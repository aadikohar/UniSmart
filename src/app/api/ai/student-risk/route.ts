import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Access denied' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const riskLevel = searchParams.get('riskLevel') || ''; // Green, Yellow, Red
    const batch = searchParams.get('batch') || '';

    const isFaculty = session.role === 'faculty';
    const facultyId = session.id;

    // Build query conditions
    const where: any = {};

    // Enforce role-based access
    if (isFaculty) {
      where.student = {
        facultyId: facultyId,
      };
    }

    if (riskLevel) {
      where.riskLevel = riskLevel;
    }

    if (batch) {
      where.student = {
        ...(where.student || {}),
        batch: batch,
      };
    }

    const risks = await prisma.attendanceRisk.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            rollNumber: true,
            batch: true,
            faculty: {
              select: { name: true },
            },
            attendance: {
              select: { status: true },
            },
          },
        },
      },
      orderBy: { riskScore: 'desc' },
    });

    const studentRisks = risks.map((risk) => {
      const totalDays = risk.student.attendance.length;
      const presentDays = risk.student.attendance.filter(a => a.status === 'PRESENT').length;
      const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

      return {
        id: risk.id,
        studentId: risk.studentId,
        name: risk.student.name,
        rollNumber: risk.student.rollNumber,
        batch: risk.student.batch,
        facultyName: risk.student.faculty?.name || 'N/A',
        attendancePercentage,
        riskScore: risk.riskScore,
        riskLevel: risk.riskLevel,
        prediction: risk.prediction,
        recommendation: risk.recommendation,
        updatedAt: risk.updatedAt,
      };
    });

    return NextResponse.json({
      studentRisks,
    });
  } catch (error) {
    console.error('Error fetching student risks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
