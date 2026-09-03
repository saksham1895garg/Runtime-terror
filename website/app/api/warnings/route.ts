import { NextResponse } from 'next/server';
import { mockWarnings } from '@/src/data/demo';

export async function GET() {
  return NextResponse.json(mockWarnings);
}
