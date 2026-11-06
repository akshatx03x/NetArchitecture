import { NextResponse } from 'next/server';
import { planNetwork } from '@/lib/engines/networkEngine';

export async function POST(request) {
  try {
    const body = await request.json();
    const result = planNetwork(body);
    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        name: error.name,
        field: error.field || null
      },
      { status: 400 }
    );
  }
}

