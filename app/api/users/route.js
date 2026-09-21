export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

export async function GET() {
  try {
    if (!uri) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
    const client = new MongoClient(uri, { tls: true, serverSelectionTimeoutMS: 10000 });
    await client.connect();
    const db = client.db('daily-paisa');
    const users = await db.collection('users').find({}).toArray();
    await client.close();
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const { userId, action } = await req.json();
    if (!uri || !userId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const client = new MongoClient(uri, { tls: true, serverSelectionTimeoutMS: 10000 });
    await client.connect();
    const db = client.db('daily-paisa');

    if (action === 'ban') {
      await db.collection('users').updateOne({ id: userId }, { $set: { isBanned: true } });
    } else if (action === 'unban') {
      await db.collection('users').updateOne({ id: userId }, { $set: { isBanned: false } });
    }

    await client.close();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!uri || !userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const client = new MongoClient(uri, { tls: true, serverSelectionTimeoutMS: 10000 });
    await client.connect();
    const db = client.db('daily-paisa');

    await db.collection('users').deleteOne({ id: userId });
    await client.close();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
