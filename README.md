# ICT49467_2_2568_Project

ระบบจัดการคำขอ "เบิก/คืน" อุปกรณ์ Laptop โดยใช้ Vue (หน้าเว็บแอดมิน) + n8n (Automation) + Google Sheets (ฐานข้อมูลจาก Google Form)

## ภาพรวมการทำงาน

1. ผู้ใช้กรอกข้อมูลผ่าน Google Form ยืมและคืน (ผู้ใช้ไม่เข้าเว็บนี้)
2. Google Form บันทึกข้อมูลลง Google Sheets
3. n8n อ่านข้อมูลจาก Google Sheets แล้วแปลงเป็น JSON ที่หน้าเว็บใช้งานได้
4. หน้าเว็บฝั่งแอดมิน (Vue) ดึงข้อมูลจาก n8n webhook แล้วแสดงเป็นตาราง

หมายเหตุ
- โปรเจคนี้ทำเพื่อให้ "แอดมิน" ใช้งานเป็นหลัก (ไม่มีระบบล็อกอิน/ล็อกเอาท์ในตัวโปรเจค)
- เวลาเทสใน n8n ด้วยปุ่ม `Execute workflow` จะใช้ URL กลุ่ม `/webhook-test/*`
- เวลาใช้งานจริงต้อง "Activate workflow" แล้วใช้ URL กลุ่ม `/webhook/*` ไม่งั้นจะเจอ 404 ว่า webhook ไม่ถูก register

## การรันระบบ

### 1) รัน n8n ด้วย Docker

```bash
docker compose up -d
```

เข้าใช้งาน n8n:

```text
http://localhost:5678
```

หยุดระบบ:

```bash
docker compose down
```

ข้อมูลของ n8n จะถูกเก็บถาวรไว้ในโฟลเดอร์ `n8n_data/` (volume)

### 2) รันเว็บ Vue (ฝั่งแอดมิน)

```bash
npm install
npm run serve
```

## จุดเชื่อมต่อ (Webhook) ที่หน้าเว็บเรียกใช้

ค่าเริ่มต้นในโค้ดอาจตั้งไว้สำหรับการทดสอบ (เช่น `/webhook-test/*`) คุณสามารถเปลี่ยนได้ผ่านไฟล์ `.env`

ตัวอย่าง `.env`:

```env
VUE_APP_N8N_READ_WEBHOOK_URL=http://localhost:5678/webhook/data
VUE_APP_N8N_WEBHOOK_URL=http://localhost:5678/webhook-test/register
VUE_APP_N8N_RETURN_READ_URL=http://localhost:5678/webhook-test/return-data
VUE_APP_N8N_RETURN_ACTION_URL=http://localhost:5678/webhook-test/return-action
```

## ไฟล์สำคัญ

- `docker-compose.yml` รัน n8n
- `n8n_data/` เก็บข้อมูล n8n แบบถาวร (ห้ามลบถ้ายังต้องใช้ workflow/credential เดิม)
- `Json/admin.json` ตัวอย่างไฟล์ export workflow จาก n8n
- `src/` โค้ด Vue ฝั่งแอดมิน

