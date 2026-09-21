
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

    const totalUsers = await db.collection('users').countDocuments();

    const deposits = await db.collection('transactions').find({ type: 'deposit' }).toArray();
    const totalRevenue = deposits
      .filter(tx => tx.status === 'approved')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);

    const pendingDeposits = deposits.filter(tx => tx.status === 'pending').length;

    const withdrawals = await db.collection('transactions')
      .find({ type: 'withdrawal', status: 'approved' })
      .toArray();
    const totalPaidOut = withdrawals.reduce((sum, tx) => sum + (Math.abs(tx.amount) || 0), 0);

    await client.close();

    return NextResponse.json({
      totalUsers,
      totalRevenue,
      pendingDeposits,
      totalPaidOut
    });
  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  }
