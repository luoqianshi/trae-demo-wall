import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/local-db';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = db.getUser('1');
    const token = 'local-token-1';

    return NextResponse.json({ success: true, user, token }, { status: 200 });
  } catch (error: any) {
    console.error('Error in login route:', error);
    return NextResponse.json({ error: error.message || 'Invalid email or password' }, { status: 401 });
  }
}
