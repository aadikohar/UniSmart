import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendOTPEmail } from '@/lib/mail';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, role } = body;

    if (!email || !role || (role !== 'admin' && role !== 'faculty')) {
      return NextResponse.json({ error: 'Email and valid role are required' }, { status: 400 });
    }

    // 1. Verify that the user exists in the database with the specified role
    let userExists = false;
    if (role === 'admin') {
      const admin = await prisma.admin.findUnique({ where: { email } });
      userExists = !!admin;
    } else {
      const faculty = await prisma.faculty.findUnique({ where: { email } });
      userExists = !!faculty && faculty.status === 'ACTIVE';
    }

    if (!userExists) {
      return NextResponse.json({ error: 'No authorized account found with this email' }, { status: 404 });
    }

    // 2. Check for rate limiting (OTPs sent in the last 60 seconds)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentOTP = await prisma.oTP.findFirst({
      where: {
        email,
        expiresAt: {
          gt: new Date(Date.now() + 4 * 60 * 1000 + 45 * 1000), // Created less than 75 seconds ago
        },
      },
      orderBy: { expiresAt: 'desc' },
    });

    if (recentOTP) {
      // If there's an active OTP that expires in > 4 mins (i.e. sent less than 60s ago)
      const now = new Date();
      // Calculate age of the OTP
      const sentTime = new Date(recentOTP.expiresAt.getTime() - 5 * 60 * 1000);
      const secondsPassed = Math.floor((now.getTime() - sentTime.getTime()) / 1000);
      const secondsToWait = 60 - secondsPassed;

      if (secondsToWait > 0) {
        return NextResponse.json({
          error: `Please wait ${secondsToWait} seconds before requesting a new code.`,
          retryAfter: secondsToWait
        }, { status: 429 });
      }
    }

    // 3. Generate a 6-digit numeric OTP
    // For demo/admin@unismart.edu, we can use a fixed OTP '123456' to speed up testing
    let otp = '';
    if (email === 'admin@unismart.edu' && process.env.NODE_ENV !== 'production') {
      otp = '123456';
    } else {
      otp = Math.floor(100000 + Math.random() * 900000).toString();
    }

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // 4. Save to OTP table
    await prisma.oTP.create({
      data: {
        email,
        otp,
        expiresAt,
      },
    });

    // 5. Send OTP Email
    await sendOTPEmail(email, otp);

    return NextResponse.json({ message: 'Verification code sent successfully' });
  } catch (error) {
    console.error('Error in send-otp API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
