import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
export async function GET() {
  const item = await prisma.siteSetting.findUnique({ where: { key: 'announcement' } });
  return NextResponse.json({ success: true, data: { announcement: typeof item?.value === 'string' ? item.value : '' } });
}
