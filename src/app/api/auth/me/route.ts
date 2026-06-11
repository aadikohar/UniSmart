import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized: Invalid or expired token' }, { status: 401 });
    }

    let userDetails = null;

    if (payload.role === 'admin') {
      const admin = await prisma.admin.findUnique({
        where: { id: payload.id },
        select: { id: true, name: true, email: true },
      });
      if (admin) {
        userDetails = { ...admin, role: 'admin' as const };
      }
    } else {
      const faculty = await prisma.faculty.findUnique({
        where: { id: payload.id },
        select: { id: true, name: true, email: true, department: true, academicYear: true, status: true },
      });
      if (faculty && faculty.status === 'ACTIVE') {
        userDetails = { ...faculty, role: 'faculty' as const };
      }
    }

    if (!userDetails) {
      return NextResponse.json({ error: 'User not found or suspended' }, { status: 401 });
    }

    return NextResponse.json({ user: userDetails });
  } catch (error) {
    console.error('Error in auth/me API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
