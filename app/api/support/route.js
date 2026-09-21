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
    const tickets = await db.collection('support_tickets').find().sort({ createdAt: -1 }).toArray();
    await client.close();
    return NextResponse.json(tickets);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const { id, status, adminReply } = await req.json();
    if (!uri || !id) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    const client = new MongoClient(uri, { tls: true, serverSelectionTimeoutMS: 10000 });
    await client.connect();
    const db = client.db('daily-paisa');
    const updates = { status, updatedAt: new Date().toISOString() };
    if (adminReply) updates.adminReply = adminReply;
    await db.collection('support_tickets').updateOne({ id }, { $set: updates });
    await client.close();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!uri || !id) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

    const client = new MongoClient(uri, { tls: true, serverSelectionTimeoutMS: 10000 });
    await client.connect();
    const db = client.db('daily-paisa');
    await db.collection('support_tickets').deleteOne({ id });
    await client.close();

    return NextResponse.json({ success: true, message: 'Ticket deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
