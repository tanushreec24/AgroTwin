import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const flaskUrl = 'http://localhost:5000/api/reload-models';
  try {
    const flaskRes = await fetch(flaskUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: null,
    });
    let data;
    try {
      data = await flaskRes.json();
    } catch {
      data = { error: 'Invalid JSON from Flask', text: await flaskRes.text() };
    }
    return NextResponse.json(data, { status: flaskRes.status });
  } catch (e: any) {
    return NextResponse.json({ status: 'error', message: e.message || 'Proxy error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
} 