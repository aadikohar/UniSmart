import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'unismart-super-secret-dev-key';

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function verifyJWTEdge(token: string, secret: string): Promise<{ id: string; email: string; role: 'admin' | 'faculty' } | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, signatureB64] = parts;
  
  try {
    // Decode payload
    const payloadStr = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadStr);
    
    // Check expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }
    
    // Verify signature
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signature = base64UrlToUint8Array(signatureB64);
    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature as any,
      data
    );
    
    return isValid ? payload : null;
  } catch (e) {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get('unismart_token')?.value;

  let session = null;
  if (token) {
    session = await verifyJWTEdge(token, JWT_SECRET);
  }

  // 1. If trying to access admin dashboard but not authenticated as admin
  if (path.startsWith('/admin/dashboard')) {
    if (!session || session.role !== 'admin') {
      const loginUrl = new URL('/admin/login', request.url);
      // Clean up token if invalid
      const res = NextResponse.redirect(loginUrl);
      if (token && !session) {
        res.cookies.delete('unismart_token');
      }
      return res;
    }
  }

  // 2. If trying to access faculty dashboard but not authenticated as faculty
  if (path.startsWith('/faculty/dashboard')) {
    if (!session || session.role !== 'faculty') {
      const loginUrl = new URL('/faculty/login', request.url);
      const res = NextResponse.redirect(loginUrl);
      if (token && !session) {
        res.cookies.delete('unismart_token');
      }
      return res;
    }
  }

  // 3. Prevent logged in users from visiting login routes
  if (path === '/admin/login') {
    if (session && session.role === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }

  if (path === '/faculty/login') {
    if (session && session.role === 'faculty') {
      return NextResponse.redirect(new URL('/faculty/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/dashboard/:path*',
    '/faculty/dashboard/:path*',
    '/admin/login',
    '/faculty/login',
  ],
};
