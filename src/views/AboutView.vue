<template>
  <div class="request-page">
    <section class="hero-panel">
      <div class="hero-copy">
        <p class="eyebrow">Equipment Dashboard</p>
        <h1>รายการเบิกอุปกรณ์</h1>
        <p class="hero-text">
          ตรวจสอบข้อมูลการเบิกอุปกรณ์จาก Google Sheets ผ่าน n8n แบบเรียลไทม์
          พร้อมดูชื่อผู้เบิก แผนก อุปกรณ์ และจำนวนที่เบิกในหน้าเดียว
        </p>
      </div>

      <div class="hero-stats">
        <div class="stat-card">
          <span class="stat-label">รายการทั้งหมด</span>
          <strong class="stat-value">{{ requests.length }}</strong>
        </div>
        <div class="stat-card">
          <span class="stat-label">สถานะ</span>
          <strong class="stat-value">{{ loading ? 'กำลังโหลด' : 'พร้อมใช้งาน' }}</strong>
        </div>
      </div>
    </section>

    <section class="content-card">
      <div class="toolbar">
        <div>
          <h2>ตารางข้อมูลการเบิก</h2>
          <p class="toolbar-text">กดปุ่มรีเฟรชเพื่อดึงข้อมูลล่าสุดจาก webhook</p>
        </div>

        <button class="refresh-btn" @click="fetchData" :disabled="loading">
          <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
          {{ loading ? 'กำลังโหลด...' : 'รีเฟรชข้อมูล' }}
        </button>
      </div>

      <div v-if="errorMessage" class="alert custom-alert">
        {{ errorMessage }}
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner-border text-primary"></div>
        <p>กำลังโหลดข้อมูลการเบิกอุปกรณ์...</p>
      </div>

      <div class="table-shell" v-else-if="requests.length">
        <table class="request-table">
          <thead>
            <tr>
              <th>#</th>
              <th>ประทับเวลา</th>
              <th>ชื่อ-นามสกุล</th>
              <th>แผนก</th>
              <th>รายชื่อ - อุปกรณ์</th>
              <th>จำนวนที่เบิก</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in requests" :key="index">
              <td>{{ index + 1 }}</td>
              <td>{{ item.timestamp }}</td>
              <td class="name-cell">{{ item.fullname }}</td>
              <td>
                <span class="dept-badge">{{ item.department }}</span>
              </td>
              <td>{{ item.itemName }}</td>
              <td>
                <span class="qty-badge">{{ item.quantity }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">+</div>
        <h3>ยังไม่มีข้อมูลการเบิก</h3>
        <p>เมื่อมีการบันทึกข้อมูลจากหน้าแบบฟอร์ม รายการจะแสดงในหน้านี้ทันที</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'

const requests = ref([])
const loading = ref(false)
const errorMessage = ref('')

const normalizeRequests = (payload) => {
  const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []

  return rows.map((item) => ({
    timestamp: item.timestamp ?? item['ประทับเวลา'] ?? '-',
    fullname: item.fullname ?? item['ชื่อ-นามสกุล'] ?? '-',
    department: item.department ?? item['แผนก'] ?? '-',
    itemName: item.itemName ?? item['รายชื่อ - อุปกรณ์'] ?? item['รายชื่ออุปกรณ์'] ?? '-',
    quantity: item.quantity ?? item['จำนวนที่เบิก'] ?? '-'
  }))
}

const fetchData = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await fetch('http://localhost:5678/webhook/data')

    if (!response.ok) {
      throw new Error('Failed to load request data')
    }

    const result = await response.json()
    requests.value = normalizeRequests(result)
  } catch (error) {
    console.error(error)
    errorMessage.value = 'ไม่สามารถดึงข้อมูลได้ กรุณาตรวจสอบ n8n flow'
    requests.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.request-page {
  min-height: 100vh;
  padding: 40px 24px 64px;
  background:
    radial-gradient(circle at top left, rgba(115, 91, 255, 0.16), transparent 30%),
    radial-gradient(circle at bottom right, rgba(0, 173, 181, 0.18), transparent 30%),
    linear-gradient(180deg, #f7f4ff 0%, #eef7fb 100%);
}

.hero-panel {
  max-width: 1180px;
  margin: 0 auto 24px;
  padding: 32px;
  border-radius: 28px;
  background: linear-gradient(135deg, #3d2c8d, #635bff);
  color: #fff;
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  box-shadow: 0 24px 60px rgba(61, 44, 141, 0.22);
}

.eyebrow {
  margin: 0 0 10px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.78rem;
  opacity: 0.85;
}

.hero-copy h1 {
  margin: 0 0 14px;
  font-size: clamp(2rem, 3vw, 3rem);
  font-weight: 800;
}

.hero-text {
  margin: 0;
  max-width: 700px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.88);
}

.hero-stats {
  display: grid;
  gap: 14px;
}

.stat-card {
  padding: 20px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(8px);
}

.stat-label {
  display: block;
  margin-bottom: 8px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
}

.stat-value {
  font-size: 1.6rem;
  font-weight: 800;
}

.content-card {
  max-width: 1180px;
  margin: 0 auto;
  padding: 28px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid rgba(120, 120, 160, 0.14);
  box-shadow: 0 24px 60px rgba(29, 36, 74, 0.12);
  backdrop-filter: blur(10px);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 22px;
}

.toolbar h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  color: #24304a;
}

.toolbar-text {
  margin: 6px 0 0;
  color: #6c7893;
}

.refresh-btn {
  border: none;
  border-radius: 14px;
  padding: 12px 20px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #0f9b8e, #2d7ff9);
  box-shadow: 0 12px 24px rgba(45, 127, 249, 0.2);
}

.refresh-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.custom-alert {
  border: none;
  border-radius: 16px;
  padding: 14px 16px;
  background: #ffe7e7;
  color: #a11d2f;
}

.loading-state,
.empty-state {
  padding: 56px 20px;
  text-align: center;
  color: #68748f;
}

.loading-state p,
.empty-state p {
  margin: 14px 0 0;
}

.empty-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 18px;
  border-radius: 20px;
  display: grid;
  place-items: center;
  font-size: 2rem;
  font-weight: 300;
  color: #5b3c96;
  background: linear-gradient(135deg, rgba(91, 60, 150, 0.12), rgba(45, 127, 249, 0.12));
}

.empty-state h3 {
  margin: 0;
  color: #24304a;
  font-size: 1.35rem;
}

.table-shell {
  overflow: hidden;
  border-radius: 22px;
  border: 1px solid rgba(129, 143, 180, 0.2);
}

.request-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
}

.request-table thead th {
  padding: 18px 16px;
  background: linear-gradient(135deg, #5b3c96, #6c45ad);
  color: #fff;
  font-weight: 700;
  font-size: 0.95rem;
  white-space: nowrap;
}

.request-table tbody td {
  padding: 16px;
  border-bottom: 1px solid #edf0f7;
  color: #344054;
  background: rgba(255, 255, 255, 0.96);
}

.request-table tbody tr:nth-child(even) td {
  background: #fafbff;
}

.request-table tbody tr:hover td {
  background: #f3f7ff;
}

.name-cell {
  font-weight: 700;
  color: #24304a;
}

.dept-badge,
.qty-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  padding: 8px 12px;
  border-radius: 999px;
  font-weight: 700;
}

.dept-badge {
  color: #5b3c96;
  background: rgba(91, 60, 150, 0.12);
}

.qty-badge {
  color: #136f63;
  background: rgba(15, 155, 142, 0.14);
}

@media (max-width: 900px) {
  .hero-panel {
    grid-template-columns: 1fr;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .refresh-btn {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .request-page {
    padding: 24px 14px 44px;
  }

  .hero-panel,
  .content-card {
    padding: 20px;
    border-radius: 22px;
  }

  .request-table thead th,
  .request-table tbody td {
    padding: 12px 10px;
    font-size: 0.92rem;
  }
}
</style>
