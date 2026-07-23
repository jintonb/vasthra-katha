import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminApiKey, isAuthorized } from '@/lib/auth';
import crypto from 'crypto';

// Cryptographically hashed credentials (SHA-256)
const HASHED_USERNAME = 'cd771e0c3a8978a5eb5ae7a6aaf614ed39fd3333939a82436a522bc01fcdab62'; // jintonb
const HASHED_PASSWORD = '81c784960ab216beae58d4362a546dcd5288b14150b8c2498c29394ea1bac4b9'; // Jb@682314#
const SESSION_COOKIE = 'vasthra_admin_session';

function verifyCredential(input, expectedHash) {
  if (!input) return false;
  const hash = crypto.createHash('sha256').update(input).digest('hex');
  return hash === expectedHash;
}

export async function GET(request) {
  if (await isAuthorized(request)) {
    return NextResponse.json({ authenticated: true });
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password, apiKey } = body;
    const configuredApiKey = getAdminApiKey();

    // 1. Check API Key authorization
    const isValidApiKey = (apiKey && apiKey === configuredApiKey) ||
                          (request.headers.get('x-api-key') === configuredApiKey);
                          
    // 2. Check hashed credentials matching (jintonb & Jb@682314#)
    const isValidCredentials = verifyCredential(username, HASHED_USERNAME) &&
                               verifyCredential(password, HASHED_PASSWORD);

    if (isValidApiKey || isValidCredentials) {
      const response = NextResponse.json({ 
        success: true, 
        message: 'Authenticated successfully' 
      });
      
      const cookieStore = await cookies();
      cookieStore.set(SESSION_COOKIE, 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 1 day
        path: '/',
      });

      return response;
    }

    return NextResponse.json(
      { success: false, message: 'Invalid Credentials' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Bad request' }, { status: 400 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  return response;
}
