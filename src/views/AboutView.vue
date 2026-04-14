<template>
  <div class="request-page admin-theme">
    <section class="hero-panel admin-card">
      <div class="hero-copy">
        <p class="eyebrow">แดชบอร์ดอุปกรณ์</p>
        <h1>ภาพรวมคำขอเบิกอุปกรณ์</h1>
        <p class="hero-text">
          ติดตามข้อมูลคำขอจาก Google Sheets ผ่าน n8n ได้ในหน้าเดียว
        </p>
      </div>

      <div class="hero-stats">
        <div class="stat-card">
          <span class="stat-label">Total</span>
          <strong class="stat-value">{{ requests.length }}</strong>
        </div>
        <div class="stat-card">
          <span class="stat-label">Pending</span>
          <strong class="stat-value">{{ pendingCount }}</strong>
        </div>
        <div class="stat-card">
          <span class="stat-label">Approved</span>
          <strong class="stat-value">{{ approvedCount }}</strong>
        </div>
      </div>
    </section>

    <section class="content-card admin-card">
      <div class="toolbar">
        <div>
          <h2>Request Table</h2>
          <p class="toolbar-text">Last fetched: {{ lastFetchedAt || '-' }}</p>
        </div>

        <button class="refresh-btn admin-btn-primary" @click="fetchData" :disabled="loading">
          <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
          {{ loading ? 'Loading...' : 'Refresh' }}
        </button>
      </div>

      <div v-if="errorMessage" class="alert custom-alert">
        {{ errorMessage }}
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner-border text-primary"></div>
        <p>Loading request data...</p>
      </div>

      <div class="table-shell admin-table-shell" v-else-if="requests.length">
        <div class="table-responsive">
          <table class="request-table beautiful-table admin-table table mb-0">
            <thead>
              <tr>
                <th>#</th>
                <th>Timestamp</th>
                <th>Full Name</th>
                <th>Company</th>
                <th>Item</th>
                <th>Qty</th>
                <th>Email</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, index) in requests"
                :key="item.rowNumber || index"
                :class="{ 'even-row': index % 2 === 0, 'odd-row': index % 2 === 1 }"
              >
                <td><span class="row-index">{{ index + 1 }}</span></td>
                <td>{{ item.timestamp }}</td>
                <td class="name-cell"><strong>{{ item.fullname }}</strong></td>
                <td>{{ item.company }}</td>
                <td>{{ item.itemName }}</td>
                <td><span class="qty-badge">{{ item.quantity }}</span></td>
                <td class="email-cell">{{ item.email }}</td>
                <td class="reason-cell" :title="item.reason">{{ item.reason }}</td>
                <td>
                  <span class="status-badge" :class="statusClass(item.status)">{{ item.status }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">+</div>
        <h3>No data yet</h3>
        <p>Requests will appear here after form submissions are recorded.</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'

const requests = ref([])
const loading = ref(false)
const errorMessage = ref('')
const lastFetchedAt = ref('')

const READ_WEBHOOK_URL = process.env.VUE_APP_N8N_READ_WEBHOOK_URL || 'http://localhost:5678/webhook/data'

const clean = (value) => String(value ?? '').trim().toLowerCase()

const readValue = (row, candidates = [], fallback = '-') => {
  for (const key of candidates) {
    const value = row?.[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim()
    }
  }
  return fallback
}

const normalizeRequests = (payload) => {
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.items)
        ? payload.items
        : []

  return rows
    .map((row, idx) => {
      const status = readValue(row, ['status', '?????????'], 'Pending')

      return {
        rowNumber: Number(row?.row_number ?? row?.rowNumber ?? idx + 2),
        timestamp: readValue(row, ['timestamp', '??????????'], '-'),
        fullname: readValue(row, ['fullname', '????-???????'], '-'),
        company: readValue(row, ['company', '??????-????????'], '-'),
        itemName: readValue(row, ['itemName', '?????????????'], '-'),
        quantity: readValue(row, ['quantity', '????????????'], '-'),
        email: readValue(row, ['email', 'Email'], '-'),
        reason: readValue(row, ['reason', '?????????????'], '-'),
        status
      }
    })
    .reverse()
}

const pendingCount = computed(() =>
  requests.value.filter((item) => {
    const status = clean(item.status)
    return status.includes('pending') || status.includes('?????????')
  }).length
)

const approvedCount = computed(() =>
  requests.value.filter((item) => {
    const status = clean(item.status)
    return status.includes('approved') || status.includes('???????')
  }).length
)

const statusClass = (status) => {
  const normalized = clean(status)

  if (
    normalized.includes('reject')
    || normalized.includes('not')
    || normalized.includes('return_rejected')
    || normalized.includes('??????????')
  ) {
    return 'status-rejected'
  }

  if (
    normalized.includes('approve')
    || normalized.includes('returned')
    || normalized.includes('complete')
    || normalized.includes('???????')
  ) {
    return 'status-approved'
  }

  return 'status-pending'
}

const fetchData = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await fetch(READ_WEBHOOK_URL)

    if (!response.ok) {
      throw new Error('Failed to load request data')
    }

    const contentType = response.headers.get('content-type') || ''
    const rawText = await response.text()

    let result = []
    if (contentType.includes('application/json') && rawText.trim()) {
      result = JSON.parse(rawText)
    }

    requests.value = normalizeRequests(result)
    lastFetchedAt.value = new Date().toLocaleString('th-TH', { hour12: false })
  } catch (error) {
    console.error(error)
    errorMessage.value = 'Cannot load data. Please verify n8n webhook and Google Sheets flow.'
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
  padding: 30px 22px 48px;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
}

.hero-panel {
  max-width: 1180px;
  margin: 0 auto 18px;
  padding: 24px 26px;
  color: #1f2937;
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 14px;
}

.eyebrow {
  margin: 0 0 6px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.74rem;
  color: #5d6b82;
  font-weight: 700;
}

.hero-copy h1 {
  margin: 0 0 10px;
  font-size: clamp(1.6rem, 2.3vw, 2.2rem);
  font-weight: 700;
  color: #0f172a;
}

.hero-text {
  margin: 0;
  max-width: 660px;
  line-height: 1.6;
  color: #5f6d83;
  font-size: 0.95rem;
}

.hero-stats {
  display: flex;
  gap: 10px;
  align-items: stretch;
}

.stat-card {
  flex: 1;
  padding: 14px 12px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.stat-label {
  display: block;
  margin-bottom: 6px;
  color: #6c7893;
  font-size: 0.78rem;
}

.stat-value {
  font-size: 1.28rem;
  font-weight: 700;
  color: #0f172a;
}

.content-card {
  max-width: 1180px;
  margin: 0 auto;
  padding: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
}

.toolbar h2 {
  margin: 0;
  font-size: 1.45rem;
  font-weight: 700;
  color: #0f172a;
}

.toolbar-text {
  margin: 3px 0 0;
  color: #72809a;
  font-size: 0.96rem;
}

.refresh-btn {
  padding: 10px 18px;
}

.refresh-btn:disabled {
  opacity: 0.68;
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
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.beautiful-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  margin-bottom: 0;
  font-size: 0.94rem;
}

.beautiful-table th {
  font-weight: 700;
  padding: 13px 12px;
  font-size: 0.95rem;
  text-align: left;
  position: sticky;
  top: 0;
  z-index: 2;
}

.beautiful-table td {
  padding: 15px 12px;
  vertical-align: middle;
  color: #304155;
  font-size: 0.95rem;
  transition: background 0.16s ease-in;
}

.beautiful-table tr.even-row {
  background: #fcfdff;
}

.beautiful-table tr.odd-row {
  background: #fff;
}

.beautiful-table tr:hover td {
  background: rgba(99, 102, 241, 0.05);
}

.row-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 30px;
  height: 30px;
  text-align: center;
  font-weight: 700;
  color: #6366f1;
  background: rgba(99, 102, 241, 0.12);
  border-radius: 10px;
}

.beautiful-table .qty-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(16, 185, 129, 0.16);
  color: #047857;
  font-weight: 700;
  font-size: 0.9rem;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 92px;
  padding: 8px 12px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.88rem;
}

.status-approved {
  background: rgba(16, 185, 129, 0.16);
  color: #047857;
}

.status-pending {
  background: rgba(245, 158, 11, 0.2);
  color: #b45309;
}

.status-rejected {
  background: rgba(239, 68, 68, 0.16);
  color: #b91c1c;
}

.name-cell {
  font-weight: 600;
  color: #3730a3;
}

.email-cell {
  color: #374a63;
  white-space: nowrap;
}

.reason-cell {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

@media (max-width: 900px) {
  .hero-panel {
    grid-template-columns: 1fr;
  }

  .hero-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
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
    padding: 18px 10px 34px;
  }

  .hero-panel,
  .content-card {
    padding: 16px;
    border-radius: 14px;
  }

  .toolbar h2 {
    font-size: 1.2rem;
  }

  .beautiful-table th,
  .beautiful-table td {
    padding: 10px 8px;
    font-size: 0.82rem;
  }

  .reason-cell {
    max-width: 140px;
  }
}
</style>
