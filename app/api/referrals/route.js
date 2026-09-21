export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

export async function GET() {
  try {
    if (!uri) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const client = new MongoClient(uri, { tls: true, serverSelectionTimeoutMS: 10000 });
    await client.connect();
    const db = client.db('daily-paisa');

    const users = await db.collection('users').find({}).toArray();
    await client.close();

    return NextResponse.json(users || []);
  } catch (error) {
    console.error('Referrals API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
