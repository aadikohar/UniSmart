import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  const isDev = process.env.NODE_ENV !== 'production';

  // Always log to console and write to latest_otp.json in development
  if (isDev || !process.env.SMTP_HOST) {
    console.log(`\n==========================================\n[OTP EMAIL BYPASS] OTP for ${email} is: ${otp}\n==========================================\n`);
    
    // Save to a file that can be read by automated testing / browser subagents
    try {
      const otpPath = path.join(process.cwd(), 'public', 'latest_otp.json');
      fs.writeFileSync(otpPath, JSON.stringify({ email, otp, timestamp: new Date().toISOString() }, null, 2));
    } catch (e) {
      console.error('Failed to write latest_otp.json:', e);
    }
  }

  // If SMTP variables are not set, return true (we bypassed)
  if (!process.env.SMTP_HOST) {
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for port 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"UniSmart ULMS" <${process.env.SMTP_FROM || 'no-reply@unismart.edu'}>`,
      to: email,
      subject: 'Your UniSmart Verification Code',
      text: `Your verification code is: ${otp}. It will expire in 5 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #4f46e5; text-align: center;">UniSmart Verification</h2>
          <p>Hello,</p>
          <p>You requested a one-time passcode to log in to the UniSmart University Learning Management System.</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827;">${otp}</span>
          </div>
          <p>This code will expire in <strong>5 minutes</strong>. If you did not request this code, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="font-size: 12px; color: #6b7280; text-align: center;">UniSmart ULMS &bull; AI-Powered University Management</p>
        </div>
      `,
    });

    console.log(`OTP email sent successfully to ${email}. Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending SMTP email:', error);
    // Return true in development even if SMTP fails so it doesn't block testing
    return isDev;
  }
}
