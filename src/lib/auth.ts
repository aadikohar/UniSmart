import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'unismart-super-secret-dev-key';

export interface JWTPayload {
  id: string;
  email: string;
  role: 'admin' | 'faculty';
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export function getTokenFromRequest(req: NextRequest): string | null {
  // Try cookie first
  const cookieToken = req.cookies.get('unismart_token')?.value;
  if (cookieToken) return cookieToken;

  // Try authorization header
  const authHeader = req.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

export function getSession(req: NextRequest): JWTPayload | null {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}

export function getAdminSession(req: NextRequest): JWTPayload | null {
  const session = getSession(req);
  if (!session || session.role !== 'admin') return null;
  return session;
}

export function getFacultySession(req: NextRequest): JWTPayload | null {
  const session = getSession(req);
  if (!session || session.role !== 'faculty') return null;
  return session;
}

