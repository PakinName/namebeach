/* eslint-disable @typescript-eslint/no-require-imports -- Transactional database integration test */
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
require('dotenv').config({ path: '.env.local', quiet: true });
require('dotenv').config({ quiet: true });
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
const rollback = new Error('ROLLBACK_TEST');
(async () => {
  const inactive = await db.user.count({ where: { active: false } });
  assert.equal(inactive, 0, 'Existing accounts must remain active after migration');
  try {
    await db.$transaction(async tx => {
      const user = await tx.user.findFirstOrThrow({ where: { role: 'ADMIN' }, select: { id: true } });
      const ticket = await tx.contactSupport.create({ data: { userId: user.id, subject: 'Transactional schema test', message: 'Rolled back at end of test', status: 'OPEN' } });
      for (const status of ['IN_PROGRESS', 'RESOLVED', 'CLOSED']) {
        const changed = await tx.contactSupport.update({ where: { id: ticket.id }, data: { status } });
        assert.equal(changed.status, status);
      }
      await tx.supportReply.create({ data: { ticketId: ticket.id, authorId: user.id, message: 'Transactional reply test' } });
      const loaded = await tx.contactSupport.findUniqueOrThrow({ where: { id: ticket.id }, include: { replies: true } });
      assert.equal(loaded.replies.length, 1);
      assert.equal(loaded.replies[0].authorId, user.id);
      await tx.auditEvent.create({ data: { actorId: user.id, entityType: 'support', entityId: ticket.id, action: 'test', metadata: { rollback: true } } });
      const setting = await tx.siteSetting.create({ data: { key: `test-${randomUUID()}`, value: { title: 'Schema test' } } });
      assert.equal(setting.version, 1);
      throw rollback;
    });
  } catch (error) { if (error !== rollback) throw error; }
  const missingId = randomUUID();
  await assert.rejects(db.supportReply.create({ data: { ticketId: missingId, authorId: missingId, message: 'Invalid relation test' } }), error => error.code === 'P2003');
  console.log('PASS: active defaults, four support statuses, replies, audit metadata, settings and foreign-key enforcement. All test inserts rolled back.');
})().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => db.$disconnect());
