# NovaX — ย้ายไปคอมเพื่อน (Windows)
ชุดส่งต่อ 16 ตุลาคม 2026 รวม source ฐานข้อมูลเดิม และไฟล์แนบ

## 1. ติดตั้งโปรแกรม
- Node.js 22 LTS: https://nodejs.org/
- PostgreSQL 17 พร้อม pgAdmin: https://www.postgresql.org/download/windows/
- Ollama (ถ้าต้องการ AI บนเครื่อง): https://ollama.com/download/windows
ฐานข้อมูลชุดนี้ส่งออกด้วย PostgreSQL 17 แนะนำใช้เวอร์ชันเดียวกัน

## 2. แตก ZIP ก่อน
แตกทั้งโฟลเดอร์ NovaX ไปที่โฟลเดอร์ที่เขียนได้ เช่น Documents/NovaX ห้ามรันจากใน ZIP
เปิด Terminal ในโฟลเดอร์ที่มี package.json แล้วรันทีละคำสั่ง:

```powershell
npm ci
npm run setup:env
```

## 3. สร้างฐานข้อมูลเปล่า
เปิด pgAdmin เชื่อม PostgreSQL เครื่องเพื่อน → คลิกขวา Databases → Create → Database → ตั้งชื่อ novax → Save
เปิด .env.local แล้วแก้ DATABASE_URL ให้ตรงกับเครื่องเพื่อน:

```env
DATABASE_URL="postgresql://postgres:รหัสPostgreSQLเครื่องเพื่อน@localhost:5432/novax"
```
ใช้พอร์ตจริงของเครื่องเพื่อน (อาจเป็น 5432 หรือ 5433) หากรหัสมี @ : / # ให้ URL-encode อักขระเหล่านั้น
NEXTAUTH_SECRET ถูกสุ่มใหม่อัตโนมัติแล้ว ไม่ต้องคัดลอกจากเครื่องเดิม
ถ้า PostgreSQL อยู่ตำแหน่งอื่น เพิ่ม PG_RESTORE_PATH ใน .env.local เช่น:
```env
PG_RESTORE_PATH="C:/Program Files/PostgreSQL/17/bin/pg_restore.exe"
```

## 4. นำข้อมูลเดิมกลับมาและเปิดเว็บ
```powershell
npm run db:restore
node scripts/prisma-local.cjs migrate deploy
npm run build
npm start
```
เปิด http://localhost:3000
ครั้งต่อไปเปิด PostgreSQL แล้วดับเบิลคลิก START-NovaX.cmd ได้
ตัว restore ยอมรับเฉพาะฐานข้อมูลเปล่า ไม่ลบหรือทับฐานข้อมูลที่มีตารางอยู่แล้ว
ไม่ต้อง seed ข้อมูล ข้อมูลผู้ใช้และคอร์สอยู่ใน database/novax.dump แล้ว

## 5. เปิด AI
เปิด Ollama แล้วรัน:
```powershell
ollama pull llama3.2:3b
ollama pull qwen3:8b
```
ถ้า Ollama ยังไม่รัน ใช้ ollama serve (ถ้าพอร์ตถูกใช้อยู่ แสดงว่าอาจเปิดอยู่แล้ว)
โมเดลมีขนาดใหญ่จึงไม่รวมใน ZIP ต้องดาวน์โหลดบนเครื่องเพื่อนเอง
Gemini ต้องใส่ GEMINI_API_KEY ของผู้ใช้งานใน .env.local แล้วรีสตาร์ตเว็บ คีย์เดิมไม่ได้รวมมา

## ข้อมูลในชุดนี้
- บัญชีเดิมและรหัสผ่านเดิมยังใช้ได้ (ในฐานข้อมูลเก็บ password hash)
- รวมคอร์ส ข้อสอบ ผลเรียน เกียรติบัตร ประวัติแชต/ล็อกอิน และข้อมูลอื่นในฐานข้อมูลตามที่เจ้าของร้องขอ
- รวม .data/course-assets ต้องเก็บไว้ตำแหน่งเดิมเพื่อเปิดรูปและไฟล์แนบ
- ลิงก์ไฟล์ภายนอกยังต้องใช้อินเทอร์เน็ตและสิทธิ์ของบริการต้นทาง
- ไม่รวม .env เครื่องเดิม คีย์ API รหัส tunnel node_modules .next และตัวโมเดล Ollama
- ลิงก์ Cloudflare เดิมไม่ได้ย้ายมาด้วย เว็บในเครื่องเพื่อนใช้ localhost:3000
- หลังย้ายเครื่องต้องล็อกอินใหม่ เพราะใช้ NEXTAUTH_SECRET ใหม่

ZIP นี้มีข้อมูลผู้ใช้และประวัติการใช้งานจริง ส่งเฉพาะเพื่อน/อาจารย์ที่ได้รับอนุญาต อย่าอัปโหลด public repository

## หากเปิดไม่ได้
- npm ไม่พบ: ติดตั้ง Node.js แล้วเปิด Terminal ใหม่
- เชื่อม DB ไม่ได้: ตรวจ service PostgreSQL รหัส พอร์ต และชื่อฐานข้อมูล
- Restore ไม่ผ่าน: ใช้ PostgreSQL 17 และฐานข้อมูลเปล่าใหม่
- ไฟล์แนบหาย: ตรวจ .data/course-assets ไม่ใช่ย้ายเฉพาะ src
- AI ไม่ตอบ: เปิด Ollama และตรวจ ollama list

ชุดนี้ตรวจโครงสร้าง ZIP และ archive ฐานข้อมูลแล้ว แต่ยังไม่ได้รันบนเครื่องเพื่อนจริง
