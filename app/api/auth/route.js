export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!uri) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

    const client = new MongoClient(uri, { tls: true, serverSelectionTimeoutMS: 10000 });
    await client.connect();
    const db = client.db('daily-paisa');

    const cleanEmail = String(email).trim().toLowerCase();

    // Case-insensitive admin lookup
    const admins = await db.collection('users').find({ isAdmin: true }).toArray();
    const user = admins.find(u => String(u.email).trim().toLowerCase() === cleanEmail);

    if (!user || String(user.password) !== String(password)) {
      await client.close();
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.isBanned) {
      await client.close();
      return NextResponse.json({ error: 'Account banned' }, { status: 403 });
    }

    await client.close();
    const { password: _, ...safeUser } = user;

    return NextResponse.json({ success: true, user: safeUser });
  } catch (error) {
    console.error('Admin Auth Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
