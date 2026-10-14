/* eslint-disable @typescript-eslint/no-require-imports -- Local integrity check */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createHash } = require('node:crypto');
require('dotenv').config({ path: '.env.local', quiet: true });
require('dotenv').config({ quiet: true });
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
const tables = ['User', 'Course', 'Chapter', 'Lesson', 'StudentProgress', 'Quiz', 'QuizQuestion', 'QuizOption', 'QuizAttempt', 'QuizAnswer', 'Classroom', 'ClassroomMember', 'ClassroomLesson', 'Announcement', 'FileUpload', 'Notification', 'ContactSupport', 'LessonCompletion'];
const target = '.data/backups/admin-migration-integrity.json';
(async () => {
  const snapshot = {};
  for (const table of tables) {
    // Names are the fixed allowlist above. Raw contents and password hashes are never written or printed.
    const rows = await db.$queryRawUnsafe(`SELECT to_jsonb(t) - 'active' AS record FROM "${table}" t ORDER BY id`);
    snapshot[table] = { count: rows.length, hash: createHash('sha256').update(JSON.stringify(rows)).digest('hex') };
  }
  if (process.argv[2] === 'capture') {
    if (fs.existsSync(target)) throw new Error('Integrity snapshot already exists; refusing to replace the baseline.');
    fs.writeFileSync(target, JSON.stringify(snapshot, null, 2));
    console.log('Captured integrity hashes for 18 existing tables.');
  } else {
    assert.deepEqual(snapshot, JSON.parse(fs.readFileSync(target, 'utf8')));
    console.log('PASS: All existing rows in 18 tables remain unchanged.');
  }
})().catch(() => { console.error('Migration integrity check failed. Inspect locally before proceeding.'); process.exitCode = 1; }).finally(() => db.$disconnect());
