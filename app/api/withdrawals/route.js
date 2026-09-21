export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

export async function GET() {
  try {
    if (!uri) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
    const client = new MongoClient(uri, { tls: true, serverSelectionTimeoutMS: 10000 });
    await client.connect();
    const wds = await client.db('daily-paisa').collection('withdrawals').find().toArray();
    await client.close();
    return NextResponse.json(wds.reverse());
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { userId, amount, reason } = await req.json();
    if (!userId || !amount) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    if (!uri) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

    const client = new MongoClient(uri, { tls: true, serverSelectionTimeoutMS: 10000 });
    await client.connect();
    const db = client.db('daily-paisa');

    const user = await db.collection('users').findOne({ id: userId });
    if (!user) { await client.close(); return NextResponse.json({ error: 'User not found' }, { status: 404 }); }

    const pendingWithdrawal = await db.collection('withdrawals').findOne({ userId: userId, status: 'pending' });
    if (pendingWithdrawal) { 
      await client.close(); 
      return NextResponse.json({ error: 'User already has a pending withdrawal.' }, { status: 400 }); 
    }

    const withdrawalId = 'wd_admin_' + Date.now();
    const withdrawal = {
      id: withdrawalId, userId, amount: parseFloat(amount),
      bankAccount: user.bankAccount || 'N/A', ifscCode: user.ifscCode || 'N/A',
      accountHolderName: user.accountHolderName || 'N/A',
      note: reason || 'Manual Admin Withdrawal',
      status: 'pending', createdAt: new Date().toISOString(),
    };

    await db.collection('withdrawals').insertOne(withdrawal);

    await db.collection('transactions').insertOne({
      id: 'tx_' + withdrawalId,
      userId, type: 'withdrawal', amount: -parseFloat(amount),
      description: `Manual Withdrawal: ${reason || 'Admin Request'}`,
      status: 'pending', createdAt: new Date().toISOString(),
    });

    await client.close();
    return NextResponse.json({ success: true, withdrawal });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const { id, status } = await req.json();

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    if (!uri) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
    const client = new MongoClient(uri, { tls: true, serverSelectionTimeoutMS: 10000 });
    await client.connect();
    const db = client.db('daily-paisa');

    const originalWd = await db.collection('withdrawals').findOne({ id });
    if (!originalWd) { await client.close(); return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 }); }

    const result = await db.collection('withdrawals').updateOne(
      { id: id, status: 'pending' },
      { $set: { status, updatedAt: new Date().toISOString() } }
    );

    if (result.modifiedCount === 0) {
      await client.close();
      return NextResponse.json({ error: 'Already processed!' }, { status: 400 });
    }

    await db.collection('transactions').updateOne(
      { id: 'tx_' + id },
      { $set: { status } }
    );

    const user = await db.collection('users').findOne({ id: originalWd.userId });
    if (!user) { await client.close(); return NextResponse.json({ success: true }); }

    if (status === 'rejected') {
      await db.collection('users').updateOne(
        { id: user.id },
        { 
          $inc: { 
            balance: originalWd.amount, 
            totalWithdrawn: -originalWd.amount 
          } 
        }
      );
    }

    await client.close();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    if (!uri) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

    const client = new MongoClient(uri, { tls: true, serverSelectionTimeoutMS: 10000 });
    await client.connect();
    const result = await client.db('daily-paisa').collection('withdrawals').deleteOne({ id });
    await client.close();

    if (result.deletedCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
