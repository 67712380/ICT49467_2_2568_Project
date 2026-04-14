---
title: Run Project and Docker
summary: รันโปรเจค Vue และ Docker Compose สำหรับ n8n stack
arguments:
  - name: project
    description: ชื่อโปรเจคหรือ path (optional)
    required: false
  - name: docker
    description: รัน docker-compose ด้วยหรือไม่ (true/false)
    required: false
    default: true
output:
  - สรุปขั้นตอนการรันโปรเจค Vue (npm run serve)
  - สรุปขั้นตอนการรัน docker-compose (docker compose up -d)
  - ข้อควรระวังและ troubleshooting เบื้องต้น
---

# Prompt: Run Project and Docker

## Task
รันโปรเจค Vue (npm run serve) และ/หรือ docker-compose สำหรับ n8n stack ตามที่กำหนด

## Steps
1. ตรวจสอบว่ามีไฟล์ package.json และ docker-compose.yml ใน workspace
2. ถ้า arguments.docker เป็น true หรือไม่ได้ระบุ ให้รัน docker-compose ด้วยคำสั่ง:
   - `docker compose up -d`
3. รันโปรเจค Vue ด้วยคำสั่ง:
   - `npm run serve`
4. สรุปผลลัพธ์และแจ้งข้อผิดพลาดที่พบบ่อย เช่น port ซ้ำ, docker daemon ไม่ทำงาน ฯลฯ

## Output Format
- รายงานผลแต่ละขั้นตอน (สำเร็จ/ล้มเหลว)
- ข้อควรระวัง เช่น "ถ้าเจอ error port 8080 is already in use ให้ kill process หรือเปลี่ยน port ใน vue.config.js"
- Troubleshooting เบื้องต้น (docker, npm)

## ภาษา
- ตอบกลับเป็นภาษาไทย

---
