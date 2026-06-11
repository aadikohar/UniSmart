import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';

// PUT: Update faculty details
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = getAdminSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, email, department, academicYear, status } = body;

    // Validate existence of faculty
    const faculty = await prisma.faculty.findUnique({ where: { id } });
    if (!faculty) {
      return NextResponse.json({ error: 'Faculty member not found' }, { status: 404 });
    }

    // Check email uniqueness if email is changing
    if (email && email !== faculty.email) {
      const existingEmail = await prisma.faculty.findUnique({ where: { email } });
      if (existingEmail) {
        return NextResponse.json({ error: 'Email is already in use by another faculty' }, { status: 400 });
      }
    }

    const updatedFaculty = await prisma.faculty.update({
      where: { id },
      data: {
        name: name !== undefined ? name : faculty.name,
        email: email !== undefined ? email : faculty.email,
        department: department !== undefined ? department : faculty.department,
        academicYear: academicYear !== undefined ? academicYear : faculty.academicYear,
        status: status !== undefined ? status : faculty.status,
      },
    });

    return NextResponse.json({ message: 'Faculty updated successfully', faculty: updatedFaculty });
  } catch (error) {
    console.error('Error updating faculty:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete faculty member
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = getAdminSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

    const { id } = await params;

    // Validate existence
    const faculty = await prisma.faculty.findUnique({ where: { id } });
    if (!faculty) {
      return NextResponse.json({ error: 'Faculty member not found' }, { status: 404 });
    }

    // Delete faculty
    await prisma.faculty.delete({ where: { id } });

    return NextResponse.json({ message: 'Faculty member deleted successfully' });
  } catch (error) {
    console.error('Error deleting faculty:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
