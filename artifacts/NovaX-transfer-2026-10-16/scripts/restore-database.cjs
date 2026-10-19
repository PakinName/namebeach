const {spawnSync}=require('node:child_process');const fs=require('node:fs');
require('dotenv').config({path:'.env.local',quiet:true});const {PrismaClient}=require('@prisma/client');
(async()=>{const url=new URL(process.env.DATABASE_URL);if(!['localhost','127.0.0.1','[::1]'].includes(url.hostname))throw Error('Restore supports a local database only.');
if(decodeURIComponent(url.password)==='CHANGE_ME')throw Error('Edit DATABASE_URL in .env.local first.');
const db=new PrismaClient();try{const rows=await db.$queryRawUnsafe("SELECT COUNT(*)::int AS count FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'");if(rows[0].count!==0)throw Error('Database is not empty. Create a NEW empty database; restore will not overwrite existing tables.');}finally{await db.$disconnect();}
const binary=process.env.PG_RESTORE_PATH||'C:/Program Files/PostgreSQL/17/bin/pg_restore.exe';if(!fs.existsSync(binary))throw Error('Set PG_RESTORE_PATH in .env.local to your PostgreSQL pg_restore.exe.');
const result=spawnSync(binary,['--exit-on-error','--single-transaction','--no-owner','--no-acl','--dbname',decodeURIComponent(url.pathname.slice(1)),'database/novax.dump'],{windowsHide:true,stdio:'inherit',env:{...process.env,PGHOST:url.hostname,PGPORT:url.port||'5432',PGUSER:decodeURIComponent(url.username),PGPASSWORD:decodeURIComponent(url.password)}});
if(result.status!==0)throw Error('Restore failed. Check PostgreSQL version and database credentials.');console.log('Database restored successfully. Run npm run build, then npm start.');
})().catch(e=>{console.error(e.message);process.exitCode=1;});
