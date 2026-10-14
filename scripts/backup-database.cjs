/* eslint-disable @typescript-eslint/no-require-imports -- Local maintenance script */
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({ path: '.env.local', quiet: true });
require('dotenv').config({ quiet: true });
const connection = new URL(process.env.DATABASE_URL);
if (!['localhost', '127.0.0.1', '[::1]'].includes(connection.hostname)) {
  throw new Error('This backup script is restricted to the local development database.');
}
const directory = path.resolve('.data/backups');
fs.mkdirSync(directory, { recursive: true });
const filename = path.join(directory, `lms-${new Date().toISOString().replace(/[:.]/g, '-')}.dump`);
const binary = process.env.PG_DUMP_PATH || 'C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe';
const result = spawnSync(binary, ['--format=custom', '--no-owner', '--no-acl', '--file', filename], {
  windowsHide: true,
  encoding: 'utf8',
  env: { ...process.env, PGHOST: connection.hostname, PGPORT: connection.port || '5432',
    PGUSER: decodeURIComponent(connection.username), PGPASSWORD: decodeURIComponent(connection.password),
    PGDATABASE: decodeURIComponent(connection.pathname.slice(1)) },
});
if (result.status !== 0) throw new Error('Database backup failed. No migration should be applied.');
if (fs.statSync(filename).size === 0) throw new Error('Empty database backup.');
console.log('Database backup saved:', filename);
