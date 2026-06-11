import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';

// PUT: Update student details
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = getAdminSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, rollNumber, email, batch, facultyId } = body;

    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Check roll number unique
    if (rollNumber && rollNumber !== student.rollNumber) {
      const existingRoll = await prisma.student.findUnique({ where: { rollNumber } });
      if (existingRoll) {
        return NextResponse.json({ error: 'Roll number already exists' }, { status: 400 });
      }
    }

    // Check email unique
    if (email && email !== student.email) {
      const existingEmail = await prisma.student.findUnique({ where: { email } });
      if (existingEmail) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
      }
    }

    // Check if faculty exists if provided
    if (facultyId) {
      const faculty = await prisma.faculty.findUnique({ where: { id: facultyId } });
      if (!faculty) {
        return NextResponse.json({ error: 'Assigned faculty member not found' }, { status: 400 });
      }
    }

    const updatedStudent = await prisma.student.update({
      where: { id },
      data: {
        name: name !== undefined ? name : student.name,
        rollNumber: rollNumber !== undefined ? rollNumber : student.rollNumber,
        email: email !== undefined ? email : student.email,
        batch: batch !== undefined ? batch : student.batch,
        facultyId: facultyId !== undefined ? facultyId : student.facultyId,
      },
    });

    return NextResponse.json({ message: 'Student updated successfully', student: updatedStudent });
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete student
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = getAdminSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

    const { id } = await params;

    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    await prisma.student.delete({ where: { id } });

    return NextResponse.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json({ status: 500, error: 'Internal server error' });
  }
}
