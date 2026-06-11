import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET: List students with filters, search, and pagination
export async function GET(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Access denied' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const batch = searchParams.get('batch') || '';
    const facultyIdParam = searchParams.get('facultyId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build query conditions
    const where: any = {};

    // 1. Force faculty members to ONLY see their assigned students
    if (session.role === 'faculty') {
      where.facultyId = session.id;
    } else if (facultyIdParam) {
      where.facultyId = facultyIdParam;
    }

    if (batch) {
      where.batch = batch;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { rollNumber: { contains: search } },
      ];
    }

    const [students, total] = await prisma.$transaction([
      prisma.student.findMany({
        where,
        include: {
          faculty: {
            select: { id: true, name: true, email: true, department: true },
          },
          attendance: {
            select: { status: true },
          },
          attendanceRisk: {
            select: { riskScore: true, riskLevel: true, prediction: true, recommendation: true },
          },
        },
        orderBy: { rollNumber: 'asc' },
        skip,
        take: limit,
      }),
      prisma.student.count({ where }),
    ]);

    // Format students to include calculated attendance rates
    const formattedStudents = students.map((student) => {
      const totalDays = student.attendance.length;
      const presentDays = student.attendance.filter((a) => a.status === 'PRESENT').length;
      const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

      return {
        id: student.id,
        name: student.name,
        email: student.email,
        rollNumber: student.rollNumber,
        batch: student.batch,
        facultyId: student.facultyId,
        faculty: student.faculty,
        attendancePercentage,
        risk: student.attendanceRisk,
      };
    });

    // Get all unique batches for filter dropdowns
    const batches = await prisma.student.findMany({
      select: { batch: true },
      distinct: ['batch'],
    });

    return NextResponse.json({
      students: formattedStudents,
      batches: batches.map((b) => b.batch),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
