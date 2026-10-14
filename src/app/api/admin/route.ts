import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { getActiveSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

const userFields = { id: true, name: true, email: true, role: true, active: true, createdAt: true } as const;
const account = z.object({ name: z.string().trim().min(2).max(100), email: z.string().trim().toLowerCase().email().max(254), role: z.enum(['STUDENT','TEACHER','ADMIN']), active: z.boolean() });
const action = z.discriminatedUnion('action', [
  account.extend({ action: z.literal('create'), password: z.string().min(10).max(72) }),
  account.extend({ action: z.literal('update'), id: z.string().min(1).max(100) }),
  z.object({ action: z.literal('settings'), announcement: z.string().trim().max(2000) }),
]);

export async function GET(request: Request) {
  const session = await getActiveSession();
  if (session?.user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  const search = new URL(request.url).searchParams;
  const page = Math.max(1, Math.min(10000, Math.floor(Number(search.get('page'))) || 1));
  const q = (search.get('q') || '').slice(0,100);
  const where = q ? { OR: [{ name: { contains: q, mode: 'insensitive' as const } }, { email: { contains: q, mode: 'insensitive' as const } }] } : {};
  const [users, count, courses, roles, attempts, lessons, tickets, announcement] = await Promise.all([
    prisma.user.findMany({ where, select: userFields, orderBy: { createdAt: 'desc' }, skip: (page-1)*25, take: 25 }),
    prisma.user.count({ where }),
    prisma.course.findMany({ orderBy: { updatedAt: 'desc' }, take: 100, select: { id: true, title: true, published: true, teacher: { select: { name: true } } } }),
    prisma.user.groupBy({ by: ['role'], _count: true }),
    prisma.quizAttempt.aggregate({ _count: true, _avg: { percentage: true } }),
    prisma.lessonCompletion.count(),
    prisma.contactSupport.count({ where: { status: { in: ['OPEN','IN_PROGRESS'] } } }),
    prisma.siteSetting.findUnique({ where: { key: 'announcement' } }),
  ]);
  return NextResponse.json({ success: true, data: { users, count, page, courses, roles, attempts, lessons, tickets, announcement: announcement?.value || '' } });
}

export async function POST(request: Request) {
  const session = await getActiveSession();
  if (session?.user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  const parsed = action.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid input: check name, email and password (10–72 characters).' }, { status: 400 });
  const input = parsed.data;
  const password = input.action === 'create' ? await bcrypt.hash(input.password,12) : undefined;
  try {
    const result = await prisma.$transaction(async tx => {
      // Serialize role/deactivation changes, including the last-admin count.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(41032026)`;
      const actor = await tx.user.findUnique({ where: { id: session.user.id } });
      if (!actor?.active || actor.role !== 'ADMIN') throw new Error('Forbidden');
      if (input.action === 'settings') {
        await tx.siteSetting.upsert({ where: { key: 'announcement' }, create: { key: 'announcement', value: input.announcement }, update: { value: input.announcement, version: { increment: 1 } } });
        await tx.auditEvent.create({ data: { actorId: actor.id, action: 'settings.update', entityType: 'setting', entityId: 'announcement' } });
        return { saved: true };
      }
      if (input.action === 'update') {
        const target = await tx.user.findUnique({ where: { id: input.id } });
        if (!target) throw new Error('Account not found');
        if (target.role === 'ADMIN' && target.active && (!input.active || input.role !== 'ADMIN') && await tx.user.count({ where: { active: true, role: 'ADMIN' } }) <= 1) throw new Error('The last active administrator cannot be disabled or demoted.');
      }
      const values = { name: input.name, email: input.email, role: input.role, active: input.active };
      const user = input.action === 'create'
        ? await tx.user.create({ data: { ...values, password: password! }, select: userFields })
        : await tx.user.update({ where: { id: input.id }, data: values, select: userFields });
      await tx.auditEvent.create({ data: { actorId: actor.id, action: `user.${input.action}`, entityType: 'user', entityId: user.id, metadata: { role: user.role, active: user.active } } });
      return user;
    });
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const conflict = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
    const message = error instanceof Error && ['Forbidden','Account not found','The last active administrator cannot be disabled or demoted.'].includes(error.message) ? error.message : conflict ? 'Email is already registered.' : 'Could not save changes.';
    return NextResponse.json({ success: false, error: message }, { status: message === 'Forbidden' ? 403 : 409 });
  }
}
