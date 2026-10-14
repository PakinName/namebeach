# ผู้ช่วย AI

เปิด http://127.0.0.1:3000/assistant หลังเข้าสู่ระบบ

- Llama เป็นค่าเริ่มต้น ใช้ Ollama ในเครื่อง โมเดล llama3.2:3b; Qwen3:8b เลือกเพิ่มได้
- Gemini มีปุ่มแยกและรายการโมเดลจากบริการจริง คีย์เก็บใน GEMINI_API_KEY ของ .env.local เท่านั้น ไม่อยู่ใน browser bundle
- GEMINI_MODEL กำหนดโมเดลที่แสดงก่อน; ปัจจุบัน gemini-3.1-flash-lite
- การเปลี่ยนผู้ให้บริการเริ่มบทสนทนาใหม่ ประวัติเดิมยังเปิดอ่านได้
- การแนบบทเรียนเป็นตัวเลือกที่ผู้ใช้ต้องเปิดเอง
- รายชื่อโมเดลโหลดได้ไม่ได้รับประกันว่าการสร้างคำตอบหรือโควตาบัญชีพร้อม ให้ดูผลคำขอจริง
- Gemini 3.1 Flash Lite ทดสอบตอบภาษาไทยผ่าน API ของเว็บและบันทึกประวัติสำเร็จ ณ 13 ตุลาคม 2026

หน้าแชตเปิดให้เลือกเฉพาะ Llama 3.2 3B, Qwen3 8B และ Gemini 3.1 Flash Lite ที่ทดสอบผ่าน โดยกำหนด OLLAMA_MODELS และ GEMINI_MODELS ฝั่งเซิร์ฟเวอร์

โค้ดตัวเชื่อมต่อเพิ่มเติมรองรับ OPENAI_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY, HUGGINGFACE_API_KEY และ AI_COMPATIBLE_BASE_URL/AI_COMPATIBLE_API_KEY แต่ไม่แสดงในแค็ตตาล็อกของหน้าผู้ช่วย ไม่รับรองว่าฟรีหรือพร้อมตอบทุกบริการ

รีสตาร์ตเว็บหลังแก้ .env.local และกดตรวจการเชื่อมต่อ รายการโมเดล cache 30 วินาที
การทดสอบ: node scripts/test-platform-features.cjs; RUN_LIVE_AI=1 เพิ่มการเรียก Ollama จริง และ RUN_GEMINI=1 เพิ่มการเรียก Gemini จริง
