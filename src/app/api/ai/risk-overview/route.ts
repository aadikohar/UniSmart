import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Access denied' }, { status: 401 });
    }

    const isFaculty = session.role === 'faculty';
    const facultyId = session.id;

    // Build filters
    const studentFilter = isFaculty ? { facultyId } : {};
    const riskFilter = isFaculty ? { student: { facultyId } } : {};
    const attendanceFilter = isFaculty ? { student: { facultyId } } : {};

    // 1. Basic Stats
    const totalStudents = await prisma.student.count({ where: studentFilter });
    
    let totalFaculty = 0;
    if (!isFaculty) {
      totalFaculty = await prisma.faculty.count();
    }

    // 2. Batches
    const uniqueBatches = await prisma.student.groupBy({
      by: ['batch'],
      where: studentFilter,
    });
    const activeBatchesCount = uniqueBatches.length;

    // 3. Risk Levels Count
    const riskCounts = await prisma.attendanceRisk.groupBy({
      by: ['riskLevel'],
      where: riskFilter,
      _count: {
        studentId: true,
      },
    });

    const riskDistribution = {
      Low: 0,    // Green
      Medium: 0, // Yellow
      High: 0,   // Red
    };

    riskCounts.forEach((rc) => {
      if (rc.riskLevel === 'Green') riskDistribution.Low = rc._count.studentId;
      if (rc.riskLevel === 'Yellow') riskDistribution.Medium = rc._count.studentId;
      if (rc.riskLevel === 'Red') riskDistribution.High = rc._count.studentId;
    });

    const highRiskCount = riskDistribution.High;

    // 4. Overall Attendance Percentage
    // Average of the actual attendance rates
    const allStudentAttendance = await prisma.attendance.groupBy({
      by: ['studentId', 'status'],
      where: attendanceFilter,
      _count: {
        id: true,
      },
    });

    const studentStatsMap = new Map<string, { present: number; total: number }>();
    allStudentAttendance.forEach((item) => {
      const stats = studentStatsMap.get(item.studentId) || { present: 0, total: 0 };
      if (item.status === 'PRESENT') {
        stats.present += item._count.id;
      }
      stats.total += item._count.id;
      studentStatsMap.set(item.studentId, stats);
    });

    let overallRateSum = 0;
    let studentCountWithAttendance = 0;
    studentStatsMap.forEach((stats) => {
      if (stats.total > 0) {
        overallRateSum += stats.present / stats.total;
        studentCountWithAttendance++;
      }
    });

    const overallAttendanceRate = studentCountWithAttendance > 0 
      ? Math.round((overallRateSum / studentCountWithAttendance) * 100)
      : 100;

    // 5. Daily Attendance Trends (Last 7 dates with records)
    const recentAttendanceDates = await prisma.attendance.findMany({
      where: attendanceFilter,
      select: { date: true },
      distinct: ['date'],
      orderBy: { date: 'desc' },
      take: 7,
    });

    // Sort dates chronologically
    const targetDates = recentAttendanceDates.map(a => a.date).sort((a, b) => a.getTime() - b.getTime());

    const attendanceTrends = [];
    for (const d of targetDates) {
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

      const dayRecords = await prisma.attendance.findMany({
        where: {
          ...attendanceFilter,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        select: { status: true },
      });

      if (dayRecords.length > 0) {
        const present = dayRecords.filter(r => r.status === 'PRESENT').length;
        const rate = Math.round((present / dayRecords.length) * 100);
        
        attendanceTrends.push({
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          rate,
        });
      }
    }

    // 6. Batch Performance
    const batchDistribution = [];
    for (const b of uniqueBatches) {
      const batchStudents = await prisma.student.findMany({
        where: {
          ...studentFilter,
          batch: b.batch,
        },
        select: { id: true },
      });

      const batchStudentIds = batchStudents.map(s => s.id);
      
      const batchAttendance = await prisma.attendance.findMany({
        where: {
          studentId: { in: batchStudentIds },
        },
        select: { status: true },
      });

      const total = batchAttendance.length;
      const present = batchAttendance.filter(a => a.status === 'PRESENT').length;
      const rate = total > 0 ? Math.round((present / total) * 100) : 100;

      batchDistribution.push({
        batch: b.batch,
        rate,
      });
    }

    // 7. Today's attendance percentage (for faculty dashboard overview card)
    let todayAttendanceRate = 100;
    if (isFaculty) {
      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
      const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      const todayRecords = await prisma.attendance.findMany({
        where: {
          ...attendanceFilter,
          date: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
        select: { status: true },
      });

      if (todayRecords.length > 0) {
        const present = todayRecords.filter(r => r.status === 'PRESENT').length;
        todayAttendanceRate = Math.round((present / todayRecords.length) * 100);
      } else {
        todayAttendanceRate = 0; // Not marked yet
      }
    }

    return NextResponse.json({
      role: session.role,
      stats: {
        totalStudents,
        totalFaculty,
        activeBatchesCount,
        overallAttendanceRate,
        highRiskCount,
        todayAttendanceRate,
      },
      riskDistribution,
      attendanceTrends,
      batchDistribution,
    });
  } catch (error) {
    console.error('Error fetching risk overview:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
