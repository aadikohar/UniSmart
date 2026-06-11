import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp, role } = body;

    if (!email || !otp || !role || (role !== 'admin' && role !== 'faculty')) {
      return NextResponse.json({ error: 'Email, OTP, and valid role are required' }, { status: 400 });
    }

    // 1. Find OTP in DB and verify it is not expired
    const otpRecord = await prisma.oTP.findFirst({
      where: {
        email,
        otp,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: { expiresAt: 'desc' },
    });

    if (!otpRecord) {
      return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 400 });
    }

    // 2. Fetch the user details to build JWT payload
    let userId = '';
    let name = '';

    if (role === 'admin') {
      const admin = await prisma.admin.findUnique({ where: { email } });
      if (!admin) {
        return NextResponse.json({ error: 'Admin account not found' }, { status: 404 });
      }
      userId = admin.id;
      name = admin.name;
    } else {
      const faculty = await prisma.faculty.findUnique({ where: { email } });
      if (!faculty) {
        return NextResponse.json({ error: 'Faculty account not found' }, { status: 404 });
      }
      if (faculty.status !== 'ACTIVE') {
        return NextResponse.json({ error: 'Faculty account is suspended/inactive' }, { status: 403 });
      }
      userId = faculty.id;
      name = faculty.name;
    }

    // 3. Delete OTP records for this email
    await prisma.oTP.deleteMany({ where: { email } });

    // 4. Generate JWT
    const token = signToken({
      id: userId,
      email: email,
      role: role,
    });

    // 5. Build response and set HTTP-only cookie
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: userId,
        email,
        name,
        role,
      },
    });

    response.cookies.set({
      name: 'unismart_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });

    return response;
  } catch (error) {
    console.error('Error in verify-otp API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
