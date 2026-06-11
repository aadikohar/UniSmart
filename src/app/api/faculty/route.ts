import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';

// GET: Fetch all faculty members (with search and pagination)
export async function GET(req: NextRequest) {
  try {
    const session = getAdminSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { department: { contains: search } },
          ],
        }
      : {};

    const [faculty, total] = await prisma.$transaction([
      prisma.faculty.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.faculty.count({ where }),
    ]);

    return NextResponse.json({
      faculty,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching faculty:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new faculty member
export async function POST(req: NextRequest) {
  try {
    const session = getAdminSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, department, academicYear } = body;

    if (!name || !email || !department || !academicYear) {
      return NextResponse.json({ error: 'All fields (name, email, department, academicYear) are required' }, { status: 400 });
    }

    // Check if email already exists
    const existingFaculty = await prisma.faculty.findUnique({ where: { email } });
    if (existingFaculty) {
      return NextResponse.json({ error: 'Faculty with this email already exists' }, { status: 400 });
    }

    const newFaculty = await prisma.faculty.create({
      data: {
        name,
        email,
        department,
        academicYear,
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({ message: 'Faculty created successfully', faculty: newFaculty }, { status: 201 });
  } catch (error) {
    console.error('Error creating faculty:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
