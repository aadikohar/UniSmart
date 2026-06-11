import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getFacultySession } from '@/lib/auth';

// Helper to normalize date to YYYY-MM-DD at 00:00:00 UTC
function normalizeDate(dateStr: string): Date {
  const date = new Date(dateStr);
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0));
}

// GET: Fetch attendance records for a specific date and optional batch
export async function GET(req: NextRequest) {
  try {
    const session = getFacultySession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Faculty access required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');
    const batchParam = searchParams.get('batch') || '';

    if (!dateParam) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
    }

    const targetDate = normalizeDate(dateParam);
    const nextDate = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);

    // Fetch assigned students
    const studentsWhere: any = { facultyId: session.id };
    if (batchParam) {
      studentsWhere.batch = batchParam;
    }

    const students = await prisma.student.findMany({
      where: studentsWhere,
      select: { id: true, name: true, rollNumber: true, batch: true },
      orderBy: { rollNumber: 'asc' },
    });

    // Fetch attendance for these students on the target date
    const attendance = await prisma.attendance.findMany({
      where: {
        studentId: { in: students.map(s => s.id) },
        date: {
          gte: targetDate,
          lt: nextDate,
        },
      },
    });

    // Merge student list with their marked status
    const studentStatusList = students.map((student) => {
      const record = attendance.find(a => a.studentId === student.id);
      return {
        id: student.id,
        name: student.name,
        rollNumber: student.rollNumber,
        batch: student.batch,
        status: record ? record.status : 'NOT_MARKED', // PRESENT, ABSENT, NOT_MARKED
        attendanceId: record ? record.id : null,
      };
    });

    return NextResponse.json({
      date: targetDate.toISOString(),
      records: studentStatusList,
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Save/bulk-update attendance for a specific date
export async function POST(req: NextRequest) {
  try {
    const session = getFacultySession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Faculty access required' }, { status: 401 });
    }

    const body = await req.json();
    const { date, records } = body; // date: ISO string, records: Array<{ studentId: string, status: 'PRESENT' | 'ABSENT' }>

    if (!date || !records || !Array.isArray(records)) {
      return NextResponse.json({ error: 'Date and records array are required' }, { status: 400 });
    }

    const targetDate = normalizeDate(date);
    const nextDate = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);
    const facultyEmail = session.email;

    const updatedRecords = [];

    // Process each student's attendance in a sequential loop
    for (const record of records) {
      const { studentId, status } = record;
      if (status !== 'PRESENT' && status !== 'ABSENT') continue;

      // Check if student belongs to this faculty (security check)
      const student = await prisma.student.findUnique({
        where: { id: studentId, facultyId: session.id },
      });

      if (!student) continue;

      // Check if attendance is already marked on this day
      const existingAttendance = await prisma.attendance.findFirst({
        where: {
          studentId,
          date: {
            gte: targetDate,
            lt: nextDate,
          },
        },
      });

      let attendanceItem;
      if (existingAttendance) {
        // Update existing record
        attendanceItem = await prisma.attendance.update({
          where: { id: existingAttendance.id },
          data: { status, markedBy: facultyEmail },
        });
      } else {
        // Create new record
        attendanceItem = await prisma.attendance.create({
          data: {
            studentId,
            date: targetDate,
            status,
            markedBy: facultyEmail,
          },
        });
      }
      updatedRecords.push(attendanceItem);

      // --- Recalculate AI Risk Score & Level in Real-Time ---
      const allStudentAttendance = await prisma.attendance.findMany({
        where: { studentId },
        select: { status: true },
      });

      const totalDays = allStudentAttendance.length;
      const presentDays = allStudentAttendance.filter(a => a.status === 'PRESENT').length;
      const actualRate = totalDays > 0 ? presentDays / totalDays : 1.0;

      // Simple AI Recommendation Rules
      let riskLevel = 'Green';
      let riskScore = 1 - actualRate;
      let prediction = `Attendance is stable at ${(actualRate * 100).toFixed(0)}%. No absenteeism threat detected.`;
      let recommendation = 'No action required. Maintain standard tracking.';

      if (actualRate < 0.75) {
        riskLevel = 'Red';
        prediction = `High risk! Student attendance has dropped to ${(actualRate * 100).toFixed(0)}% (below the 75% threshold).`;
        recommendation = 'Schedule academic intervention and send parent/guardian notification immediately.';
      } else if (actualRate < 0.85) {
        riskLevel = 'Yellow';
        prediction = `Warning! Student attendance is currently at ${(actualRate * 100).toFixed(0)}% and showing high vulnerability.`;
        recommendation = 'Send attendance warning email and schedule one-on-one advising session.';
      }

      await prisma.attendanceRisk.upsert({
        where: { studentId },
        update: {
          riskScore: parseFloat(riskScore.toFixed(2)),
          riskLevel,
          prediction,
          recommendation,
        },
        create: {
          studentId,
          riskScore: parseFloat(riskScore.toFixed(2)),
          riskLevel,
          prediction,
          recommendation,
        },
      });
    }

    return NextResponse.json({
      message: `Successfully marked attendance for ${updatedRecords.length} students.`,
      recordsCount: updatedRecords.length,
    });
  } catch (error) {
    console.error('Error saving attendance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
