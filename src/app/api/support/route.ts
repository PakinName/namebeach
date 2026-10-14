import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getActiveSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
const create = z.object({ subject: z.string().trim().min(3).max(150), message: z.string().trim().min(10).max(5000) });
const update = z.object({ id: z.string().min(1).max(100), message: z.string().trim().min(1).max(5000).optional(), status: z.enum(['OPEN','IN_PROGRESS','RESOLVED','CLOSED']).optional() }).refine(v => v.message || v.status);
export async function GET(request: Request) {
  const session = await getActiveSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const url = new URL(request.url), id = url.searchParams.get('id');
  const where = { ...(session.user.role === 'ADMIN' ? {} : { userId: session.user.id }), ...(id ? { id } : {}) };
  const page = Math.max(1, Math.min(10000,Math.floor(Number(url.searchParams.get('page'))) || 1));
  const [tickets,count] = await Promise.all([
    prisma.contactSupport.findMany({ where, orderBy: { updatedAt: 'desc' }, skip: id ? 0 : (page-1)*25, take: id ? 1 : 25, include: { user: { select: { id: true, name: true, role: true } }, ...(id ? { replies: { orderBy: { createdAt: 'asc' as const }, include: { author: { select: { name: true, role: true } } } } } : {}) } }),
    prisma.contactSupport.count({ where }),
  ]);
  if (id && !tickets.length) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true, data: { tickets, count, page } });
}
export async function POST(request: Request) {
  const session = await getActiveSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const parsed = create.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid subject or message.' }, { status: 400 });
  const ticket = await prisma.$transaction(async tx => {
    const result = await tx.contactSupport.create({ data: { ...parsed.data, userId: session.user.id, status: 'OPEN' } });
    const admins = await tx.user.findMany({ where: { role: 'ADMIN', active: true }, select: { id: true } });
    await tx.notification.createMany({ data: admins.map(user => ({ userId: user.id, type: 'GENERAL' as const, title: 'New support request / มีเรื่องติดต่อใหม่', message: result.subject, link: `/support?ticket=${result.id}` })) });
    return result;
  });
  return NextResponse.json({ success: true, data: { id: ticket.id } }, { status: 201 });
}
export async function PATCH(request: Request) {
  const session = await getActiveSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const parsed = update.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid reply.' }, { status: 400 });
  const input = parsed.data, admin = session.user.role === 'ADMIN';
  if (input.status && !admin) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  try {
    await prisma.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${input.id}))`;
      const ticket = await tx.contactSupport.findUnique({ where: { id: input.id } });
      if (!ticket || (!admin && ticket.userId !== session.user.id)) throw new Error('Not found');
      if (ticket.status === 'CLOSED' && input.message && (!admin || !input.status || input.status === 'CLOSED')) throw new Error('This request is closed.');
      if (input.message) await tx.supportReply.create({ data: { ticketId: ticket.id, authorId: session.user.id, message: input.message } });
      await tx.contactSupport.update({ where: { id: ticket.id }, data: { status: input.status || ticket.status, updatedAt: new Date() } });
      const recipients = admin ? [{ id: ticket.userId }] : await tx.user.findMany({ where: { role: 'ADMIN', active: true }, select: { id: true } });
      await tx.notification.createMany({ data: recipients.filter(user => user.id !== session.user.id).map(user => ({ userId: user.id, type: 'GENERAL' as const, title: 'Support update / อัปเดตเรื่องติดต่อ', message: ticket.subject, link: `/support?ticket=${ticket.id}` })) });
      if (admin) await tx.auditEvent.create({ data: { actorId: session.user.id, action: 'support.update', entityType: 'support', entityId: ticket.id, metadata: { status: input.status || ticket.status, replied: !!input.message } } });
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error && ['Not found','This request is closed.'].includes(error.message) ? error.message : 'Could not save reply.' }, { status: 409 });
  }
}
