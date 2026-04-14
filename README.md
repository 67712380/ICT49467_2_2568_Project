# ICT49467 IT-Asset-Management (Vue + n8n + Google Sheets)

โปรเจคนี้เป็น “หน้าเว็บสำหรับแอดมิน” เพื่อดูรายการ **เบิกอุปกรณ์** และ **คืนอุปกรณ์** ที่ถูกบันทึกไว้ใน Google Sheets (ข้อมูลมาจาก Google Form) โดยใช้ n8n เป็นตัวกลางดึง/แปลงข้อมูล และส่งให้ Vue แสดงผล

ข้อสำคัญ
- ระบบนี้เน้นฝั่งแอดมินเท่านั้น (ไม่มีระบบล็อกอิน/ล็อกเอาท์ในตัวโปรเจค)
- n8n รันด้วย Docker (`docker-compose.yml`)
- เวลาเทสด้วยปุ่ม `Execute workflow` ของ n8n จะใช้ URL กลุ่ม `/webhook-test/*`
- เวลาใช้งานจริง (Production) จะใช้ URL กลุ่ม `/webhook/*` และ “ต้องเปิด Active workflow” ไม่งั้นจะเจอ 404 ว่า webhook ไม่ถูก register

## โครงสร้างงาน (ภาพรวม)

1. ผู้ใช้กรอกข้อมูลผ่าน Google Form
2. Google Form บันทึกข้อมูลลง Google Sheets
3. n8n อ่านข้อมูลจากชีต แล้วทำการ “จัดชื่อฟิลด์” ให้เป็น JSON มาตรฐานสำหรับหน้าเว็บ
4. Vue เรียกอ่านข้อมูลจาก n8n webhook แล้วแสดงเป็นตาราง (ฝั่งแอดมิน)

## การรันระบบ

### 1) รัน n8n (Docker)

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

หมายเหตุ
- ข้อมูลของ n8n ถูกเก็บไว้ที่โฟลเดอร์ `n8n_data/` (เป็น volume ของ container)
- ใน repo นี้มีไฟล์ workflow export ไว้ให้ทีมต่อยอดที่ `Json/admin.json`

### 2) รันเว็บ (Vue)

```bash
npm install
npm run serve
```

## Webhook ที่หน้าเว็บเรียกใช้ (ค่าเริ่มต้นในโค้ด)

หมายเหตุ: URL จริงที่ใช้งานจะขึ้นกับว่า workflow ใน n8n “เปิด Active” หรือกำลัง “Execute workflow” อยู่

### รายการ “เบิก” (ตัวอย่างหน้า About)

ไฟล์หน้าเว็บ: `src/views/AboutView.vue`
- อ่านข้อมูลจาก: `VUE_APP_N8N_READ_WEBHOOK_URL`
- ถ้าไม่ตั้ง env จะใช้ค่าเริ่มต้น: `http://localhost:5678/webhook/data`

### ส่งข้อมูล “คืน” (ตัวอย่างหน้า Register)

ไฟล์หน้าเว็บ: `src/views/Register.vue`
- ส่งข้อมูลไปที่: `VUE_APP_N8N_WEBHOOK_URL`
- ถ้าไม่ตั้ง env จะใช้ค่าเริ่มต้น (โหมดเทสของ n8n): `http://localhost:5678/webhook-test/register`

### รายการ “คืน” (หน้า AdminApprove)

ไฟล์หน้าเว็บ: `src/views/AdminApprove.vue`
- อ่านข้อมูลจาก: `VUE_APP_N8N_RETURN_READ_URL` (ค่าเริ่มต้น: `http://localhost:5678/webhook/return-data`)
- URL สำหรับ action (ถ้ามีทำต่อในอนาคต): `VUE_APP_N8N_RETURN_ACTION_URL` (ค่าเริ่มต้น: `http://localhost:5678/webhook/return-action`)

## โครงสร้างข้อมูลที่หน้าเว็บต้องการ (Return)

ตัวอย่าง JSON ที่หน้าเว็บคาดหวัง (Return):

```json
[
  {
    "timestamp": "14/4/2026, 16:12:37",
    "fullname": "ชื่อ-นามสกุล",
    "company": "บริษัท/หน่วยงาน",
    "phone": "เบอร์โทร",
    "email": "อีเมล",
    "itemName": "Laptop",
    "quantity": 1,
    "assetTag": "SN001",
    "status": "รอตรวจรับ",
    "adminNote": "-",
    "rowNumber": "2"
  }
]
```

## ตั้งค่า Environment (ตัวเลือก)

ถ้าต้องการเปลี่ยน URL โดยไม่แก้โค้ด ให้สร้างไฟล์ `.env` ที่ root ของโปรเจค แล้วกำหนดค่า เช่น:

```env
VUE_APP_N8N_READ_WEBHOOK_URL=http://localhost:5678/webhook/data
VUE_APP_N8N_WEBHOOK_URL=http://localhost:5678/webhook-test/register
VUE_APP_N8N_RETURN_READ_URL=http://localhost:5678/webhook-test/return-data
VUE_APP_N8N_RETURN_ACTION_URL=http://localhost:5678/webhook-test/return-action
```

