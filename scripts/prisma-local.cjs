/* eslint-disable @typescript-eslint/no-require-imports -- Local migration CLI */
const { spawnSync } = require('node:child_process');
require('dotenv').config({ path: '.env.local', quiet: true });
require('dotenv').config({ quiet: true });
const host = new URL(process.env.DATABASE_URL).hostname;
if (!['localhost', '127.0.0.1', '[::1]'].includes(host)) throw new Error('Local database required.');
const result = spawnSync(process.execPath, [require.resolve('prisma/build/index.js'), ...process.argv.slice(2)], {
  stdio: 'inherit', windowsHide: true, env: process.env,
});
process.exit(result.status ?? 1);
