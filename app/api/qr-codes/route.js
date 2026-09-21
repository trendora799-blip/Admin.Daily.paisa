export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const codes = await db.getQRCodes();
    return NextResponse.json(codes);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    // Bulk upload
    if (Array.isArray(body)) {
      let codes = await db.getQRCodes();
      body.forEach(item => {
        if (item.upiId && item.name) {
          codes.push({
            id: 'qr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            upiId: item.upiId,
            name: item.name,
            active: true,
            createdAt: new Date().toISOString(),
          });
        }
      });
      await db.saveQRCodes(codes);
      return NextResponse.json({ added: body.length });
    }

    // Single upload
    if (!body.upiId || !body.name) {
      return NextResponse.json({ error: 'UPI ID and Name required' }, { status: 400 });
    }

    const qr = {
      id: 'qr_' + Date.now(),
      upiId: body.upiId,
      name: body.name,
      active: true,
      createdAt: new Date().toISOString(),
    };

    await db.addQRCode(qr);
    return NextResponse.json(qr);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const { id, active } = await req.json();
    let codes = await db.getQRCodes();
    const i = codes.findIndex(c => c.id === id);
    if (i === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    codes[i].active = active;
    await db.saveQRCodes(codes);
    return NextResponse.json(codes[i]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const id = new URL(req.url).searchParams.get('id');
    const codes = (await db.getQRCodes()).filter(c => c.id !== id);
    await db.saveQRCodes(codes);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
      }
