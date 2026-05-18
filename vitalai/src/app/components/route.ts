import { NextResponse } from 'next/server';

// In a production app, this would be a Prisma/Drizzle call to SQL/NoSQL
let storage: any[] = []; 

export async function GET() {
  return NextResponse.json(storage);
}

export async function POST(request: Request) {
  const body = await request.json();
  const newMeal = {
    ...body,
    id: `log-${Date.now()}`,
    loggedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
  storage.unshift(newMeal);
  return NextResponse.json(newMeal);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  storage = storage.filter((m) => m.id !== id);
  return NextResponse.json({ success: true });
}