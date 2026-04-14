# ICT49467-IT-Asset-Management-Vandor-n8n

โปรเจกต์นี้เป็นระบบขอเบิกอุปกรณ์ไอทีด้วย Vue + n8n โดยมีเป้าหมายหลักคือส่งอีเมลแจ้งเตือนผู้เกี่ยวข้องและรองรับขั้นตอนอนุมัติคำขอ

## วัตถุประสงค์งานปัจจุบัน

1. ผู้ใช้กรอกคำขอเบิกจากหน้าเว็บ
2. ระบบส่งข้อมูลเข้า n8n Webhook
3. n8n บันทึกข้อมูลลง Google Sheets พร้อมสถานะเริ่มต้น รออนุมัติ
4. n8n แจ้งเตือนแอดมินว่า มีคำขอเบิกใหม่
5. n8n แจ้งผู้ใช้ว่า รับคำขอแล้วและกำลังรอการอนุมัติ
6. เมื่อแอดมินอนุมัติหรือไม่อนุมัติ ให้ n8n ส่งอีเมลผลกลับผู้ใช้อีกครั้ง

## ข้อมูลที่ส่งจากหน้าเว็บ

- timestamp
- fullname
- company
- phone
- itemName
- quantity
- email
- reason
- requestStatus (ค่าเริ่มต้น: รออนุมัติ)
- approvedBy

## การตั้งค่า n8n ผ่าน Docker

เริ่มระบบ:

```bash
docker compose up -d
```

หยุดระบบ:

```bash
docker compose down
```

เข้าใช้งาน n8n:

http://localhost:5678

หมายเหตุ:
- ข้อมูล n8n ถูกเก็บในโฟลเดอร์ n8n_data
- ต้องใช้ N8N_ENCRYPTION_KEY เดิมเพื่ออ่าน credential/workflow เดิมได้

## การรันฝั่ง Vue

ติดตั้งแพ็กเกจ:

```bash
npm install
```

รันโหมดพัฒนา:

```bash
npm run serve
```

บิลด์สำหรับ production:

```bash
npm run build
```

## Webhook URL ของหน้า Register

ค่าเริ่มต้นในโค้ดคือ:

http://localhost:5678/webhook/register

สามารถเปลี่ยนได้ด้วย environment variable:

- VUE_APP_N8N_WEBHOOK_URL
