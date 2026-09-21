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

    const requests = await db.collection('re_registration_requests').find().sort({ createdAt: -1 }).toArray();
    await client.close();
    return NextResponse.json(requests);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const { id, status } = await req.json(); 
    if (!uri || !id) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

    const client = new MongoClient(uri, { tls: true, serverSelectionTimeoutMS: 10000 });
    await client.connect();
    const db = client.db('daily-paisa');

    const request = await db.collection('re_registration_requests').findOne({ id });
    if (!request) { 
      await client.close(); 
      return NextResponse.json({ error: 'Request not found' }, { status: 404 }); 
    }

    if (status === 'approved') {
      // ✅ CRITICAL FIX: Use deleteMany to remove ALL entries for this user
      await db.collection('deleted_users').deleteMany({ 
        $or: [
          { id: request.userId },
          { email: request.email },
          { phone: request.phone }
        ]
      });

      // ✅ Also clean up any other pending requests for this user
      await db.collection('re_registration_requests').deleteMany({
        $or: [
          { email: request.email },
          { phone: request.phone }
        ]
      });

      // ✅ Create a notification so the user knows they've been approved
      await db.collection('notifications').insertOne({
        id: 'notif_' + Date.now(),
        email: request.email,
        phone: request.phone,
        type: 'reregistration_approved',
        message: 'Your re-registration request has been approved! You can now create a new account.',
        read: false,
        createdAt: new Date().toISOString(),
      });
    } 
    else if (status === 'rejected') {
      // Just delete the rejected request
      await db.collection('re_registration_requests').deleteOne({ id });
    }

    await client.close();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
