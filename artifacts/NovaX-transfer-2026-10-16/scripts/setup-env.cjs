const fs=require('node:fs'),crypto=require('node:crypto');
if(fs.existsSync('.env.local')){console.log('.env.local already exists. Kept unchanged.');process.exit(0);}
const template=fs.readFileSync('.env.example','utf8').replace('GENERATE_WITH_SETUP',crypto.randomBytes(48).toString('hex'));
fs.writeFileSync('.env.local',template,{flag:'wx'});console.log('Created .env.local. Edit DATABASE_URL for this computer before restoring.');
