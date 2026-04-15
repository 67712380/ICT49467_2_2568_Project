<template>
  <div class="return-page">

    <!-- Canvas background (shared with HomeView) -->
    <div class="canvas-bg" aria-hidden="true">
      <div class="grid-lines"></div>
      <div class="geo geo-1"></div>
      <div class="geo geo-2"></div>
    </div>

    <!-- Page Header -->
    <header class="page-header">
      <div class="page-header-inner">
        <div class="header-left">
          <p class="eyebrow">
            <span class="material-symbols-rounded eyebrow-ico">assignment_return</span>
            Return Management
          </p>
          <h1 class="page-title">Return Approval</h1>
          <p class="page-sub">Review and approve equipment return requests. Status updates are saved to Google Sheets automatically.</p>
        </div>
        <div class="header-right">
          <div class="fetch-time" v-if="lastFetchedAt">
            <span class="material-symbols-rounded">schedule</span>
            {{ lastFetchedAt }}
          </div>
          <button class="refresh-btn" :disabled="loading" @click="fetchRequests">
            <span class="material-symbols-rounded" :class="{ 'spin-icon': loading }">refresh</span>
            {{ loading ? 'กำลังโหลด' : 'Refresh' }}
          </button>
        </div>
      </div>
    </header>

    <!-- Content -->
    <div class="return-content">

      <!-- Error -->
      <div v-if="errorMessage" class="err-bar">
        <span class="material-symbols-rounded">wifi_off</span>
        {{ errorMessage }}
        <button class="err-close" @click="errorMessage = ''" aria-label="ปิด">
          <span class="material-symbols-rounded">close</span>
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="load-state">
        <div class="load-ring"></div>
        <p>กำลังดึงข้อมูล...</p>
      </div>

      <!-- Table -->
      <div v-else-if="requests.length" class="table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Full Name</th>
                <th>Company / Dept.</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Item</th>
                <th>Qty</th>
                <th>Asset Tag</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in requests" :key="item.rowNumber">
                <td class="row-num">{{ item.rowNumber }}</td>
                <td class="ts-cell">{{ item.timestamp }}</td>
                <td class="name-cell"><strong>{{ item.fullname }}</strong></td>
                <td>{{ item.company }}</td>
                <td>{{ item.phone }}</td>
                <td class="email-cell">{{ item.email }}</td>
                <td>{{ item.itemName }}</td>
                <td class="center-cell">{{ item.quantity }}</td>
                <td class="asset-cell">{{ item.assetTag }}</td>
                <td>
                  <span class="status-badge" :class="statusBadgeClass(item.status)">{{ item.status }}</span>
                </td>
                <td class="action-cell">
                  <input
                    v-model="item.adminNote"
                    type="text"
                    class="note-input"
                    placeholder="หมายเหตุ (ถ้ามี)"
                  />
                  <div class="action-btns">
                    <button
                      class="act-btn act-approve"
                      :disabled="item.submitting"
                      @click="submitReturn(item, 'returned')"
                    >
                      <span class="material-symbols-rounded">check_circle</span>
                      คืนแล้ว
                    </button>
                    <button
                      class="act-btn act-reject"
                      :disabled="item.submitting"
                      @click="submitReturn(item, 'return_rejected')"
                    >
                      <span class="material-symbols-rounded">cancel</span>
                      ปฏิเสธ
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <span class="material-symbols-rounded empty-icon">inventory_2</span>
        <p>ไม่พบข้อมูลคำขอคืนอุปกรณ์</p>
      </div>

    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'

const RETURN_READ_URL =
  process.env.VUE_APP_N8N_RETURN_READ_URL || 'http://localhost:5678/webhook/return-data'

const RETURN_ACTION_URL =
  process.env.VUE_APP_N8N_RETURN_ACTION_URL || 'http://localhost:5678/webhook/return-action'

const requests = ref([])
const loading = ref(false)
const errorMessage = ref('')
const lastFetchedAt = ref('')

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

const formatSheetDate = (raw) => {
  const value = String(raw ?? '').trim()
  const serial = Number(value)
  if (!Number.isNaN(serial) && serial > 1000) {
    const excelEpoch = new Date(1899, 11, 30)
    const dt = new Date(excelEpoch.getTime() + serial * 86400000)
    return dt.toLocaleString('th-TH', { hour12: false })
  }
  return value || '-'
}

const normalizeRequests = (payload) => {
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.items)
        ? payload.items
        : []

  return rows.map((row, idx) => {
    const quantityRaw = readValue(row, ['quantity', 'qty', 'จำนวน'], '0')
    const quantityNum = Number(String(quantityRaw).trim())

    return {
      rowNumber: Number(row.row_number ?? row.rowNumber ?? idx + 2),
      timestamp: formatSheetDate(readValue(row, ['timestamp', 'ประทับเวลา'], '-')),
      fullname: readValue(row, ['fullname', 'name', 'ชื่อ-นามสกุล'], '-'),
      company: readValue(row, ['company', 'บริษัท-หน่วยงาน'], '-'),
      phone: readValue(row, ['phone', 'เบอร์โทร', 'เบอร์โทรศัพท์'], '-'),
      email: readValue(row, ['email', 'Email'], '-'),
      itemName: readValue(row, ['itemName', 'item', 'รายชื่ออุปกรณ์', 'รายการอุปกรณ์'], '-'),
      quantity: Number.isFinite(quantityNum) ? quantityNum : quantityRaw,
      assetTag: readValue(row, ['assetTag', 'asset_tag', 'เลขเครื่อง (asset_tag)', 'เลขเครื่อง(asset_tag)'], '-').trim(),
      status: readValue(row, ['status', 'สถานะคำขอ', 'สถานะ'], 'รอตรวจรับ'),
      adminNote: readValue(row, ['adminNote', 'หมายเหตุแอดมิน'], ''),
      submitting: false
    }
  })
}

const fetchRequests = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await fetch(RETURN_READ_URL)
    if (!response.ok) {
      throw new Error(`Failed to load request data (HTTP ${response.status})`)
    }

    const raw = await response.text()
    const parsed = raw.trim() ? JSON.parse(raw) : []
    const result = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.data)
        ? parsed.data
        : Array.isArray(parsed?.items)
          ? parsed.items
          : []

    requests.value = normalizeRequests(result)
    lastFetchedAt.value = new Date().toLocaleString('th-TH', { hour12: false })
  } catch (error) {
    console.error(error)
    errorMessage.value = `Unable to load request data from webhook. ${error?.message || ''}`.trim()
  } finally {
    loading.value = false
  }
}

const postAction = async (payload) => {
  const send = (url) => fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  try {
    return await send(RETURN_ACTION_URL)
  } catch (networkError) {
    const fallbackUrl = RETURN_ACTION_URL.includes('/webhook-test/')
      ? RETURN_ACTION_URL.replace('/webhook-test/', '/webhook/')
      : null

    if (!fallbackUrl) {
      throw networkError
    }

    return send(fallbackUrl)
  }
}

const submitReturn = async (item, decision) => {
  item.submitting = true
  errorMessage.value = ''

  try {
    const payload = {
      row_number: item.rowNumber,
      rowNumber: item.rowNumber,
      status: decision,
      adminNote: String(item.adminNote ?? '').trim() || '-',
      email: item.email,
      fullname: item.fullname,
      itemName: item.itemName
    }

    const response = await postAction(payload)
    const raw = await response.text()

    let parsed = {}
    try {
      parsed = raw.trim() ? JSON.parse(raw) : {}
    } catch {
      parsed = {}
    }

    const hasOkFlag = Object.prototype.hasOwnProperty.call(parsed, 'ok')
    if (!response.ok || (hasOkFlag && parsed.ok !== true)) {
      if (response.status === 404) {
        throw new Error('Return webhook path not found (404).')
      }
      throw new Error(parsed.message || 'Failed to update return status')
    }

    item.status = decision === 'returned' ? 'คืนแล้ว' : 'ปฏิเสธการคืน'
    item.adminNote = String(item.adminNote ?? '').trim() || '-'
    await fetchRequests()
  } catch (error) {
    console.error(error)
    errorMessage.value = `Update failed: ${error.message}`
  } finally {
    item.submitting = false
  }
}

const statusBadgeClass = (value) => {
  const normalized = clean(value)

  if (normalized.includes('reject') || normalized.includes('not') || normalized.includes('ปฏิเสธ')) {
    return 'danger'
  }

  if (normalized.includes('return') || normalized.includes('approve') || normalized.includes('complete') || normalized.includes('คืน')) {
    return 'success'
  }

  return 'warning'
}

onMounted(fetchRequests)
</script>

<style scoped>
/* ══════════════════════════════════════════
   CANVAS BACKGROUND
══════════════════════════════════════════ */
.canvas-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
  background: var(--snow, #f8fafc);
}

.grid-lines {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px);
  background-size: 56px 56px;
}

.geo {
  position: absolute;
  border-radius: 50%;
  opacity: 0.05;
}

.geo-1 {
  width: 600px; height: 600px;
  background: #2563eb;
  top: -200px; right: -100px;
  animation: float 22s ease-in-out infinite;
}

.geo-2 {
  width: 400px; height: 400px;
  background: #3b82f6;
  bottom: -120px; left: -80px;
  animation: float 30s ease-in-out infinite reverse;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  50%       { transform: translate(18px, -24px); }
}

/* ══════════════════════════════════════════
   PAGE HEADER
══════════════════════════════════════════ */
.page-header {
  background: #ffffff;
  border-bottom: 1px solid #e4e9f0;
  padding: 32px 0 28px;
  position: relative;
  z-index: 1;
  animation: fade-up 0.4s ease both;
}

.page-header-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 40px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
}

.eyebrow {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #4a6380;
  margin-bottom: 8px;
}

.eyebrow-ico {
  font-size: 14px;
  font-variation-settings: 'FILL' 1;
  color: var(--gold, #c8922a);
}

.page-title {
  font-family: 'DM Sans', sans-serif;
  font-size: clamp(1.6rem, 2.8vw, 2.2rem);
  font-weight: 700;
  color: var(--navy, #0f2233);
  letter-spacing: -0.035em;
  line-height: 1.15;
  margin-bottom: 6px;
}

.page-sub {
  font-size: 0.9rem;
  color: #8fa3b8;
  line-height: 1.6;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.fetch-time {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.77rem;
  color: #8fa3b8;
  font-family: 'DM Mono', monospace;
}

.fetch-time .material-symbols-rounded { font-size: 15px; }

.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 20px;
  background: var(--navy, #0f2233);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-family: 'Noto Sans Thai', 'DM Sans', sans-serif;
  font-size: 0.86rem;
  font-weight: 600;
  cursor: pointer;
  letter-spacing: 0.01em;
  transition: background 0.18s, transform 0.18s, box-shadow 0.18s;
}

.refresh-btn:hover:not(:disabled) {
  background: var(--navy-mid, #1a3a55);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(15,34,51,0.22);
}

.refresh-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.spin-icon { animation: spin-r 0.7s linear infinite; }

@keyframes spin-r { to { transform: rotate(360deg); } }

/* ══════════════════════════════════════════
   RETURN CONTENT
══════════════════════════════════════════ */
.return-content {
  max-width: 1280px;
  margin: 0 auto;
  padding: 28px 40px;
  position: relative;
  z-index: 1;
}

/* ══════════════════════════════════════════
   ERROR BAR
══════════════════════════════════════════ */
.err-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fca5a5;
  border-radius: 10px;
  font-size: 0.87rem;
  font-weight: 500;
  margin-bottom: 20px;
}

.err-close {
  margin-left: auto;
  background: none;
  border: none;
  cursor: pointer;
  color: #dc2626;
  opacity: 0.6;
  display: flex;
  padding: 0;
}

.err-close:hover { opacity: 1; }

/* ══════════════════════════════════════════
   LOADING STATE
══════════════════════════════════════════ */
.load-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 0;
  color: #8fa3b8;
  font-size: 0.9rem;
  gap: 16px;
}

.load-ring {
  width: 36px; height: 36px;
  border: 3px solid #e4e9f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin-r 0.7s linear infinite;
}

/* ══════════════════════════════════════════
   TABLE CARD
══════════════════════════════════════════ */
.table-card {
  background: #ffffff;
  border: 1px solid #e4e9f0;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(15,34,51,0.07);
  animation: fade-up 0.4s ease both;
}

.table-responsive {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  font-family: 'Noto Sans Thai', 'DM Sans', sans-serif;
  color: var(--slate, #4a6380);
}

.data-table thead tr {
  background: var(--snow, #f8fafc);
  border-bottom: 1.5px solid var(--frost, #edf2f7);
}

.data-table thead th {
  padding: 13px 16px;
  font-family: 'DM Mono', monospace;
  font-size: 0.67rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--mist, #8fa3b8);
  white-space: nowrap;
  text-align: left;
}

.data-table tbody tr {
  border-bottom: 1px solid #f8fafb;
  transition: background 0.13s ease;
}

.data-table tbody tr:hover td { background: #fef9ee; color: var(--navy, #0f2233); }
.data-table tbody tr:last-child td { border-bottom: none; }

.data-table td {
  padding: 14px 16px;
  border-bottom: 1px solid #f8fafb;
  color: var(--slate, #4a6380);
  vertical-align: middle;
  transition: background 0.13s ease, color 0.13s ease;
}

.row-num { color: var(--mist, #8fa3b8); font-weight: 600; }
.ts-cell { white-space: nowrap; color: var(--mist, #8fa3b8); font-size: 0.82rem; }
.name-cell { white-space: nowrap; }
.name-cell strong { font-weight: 600; color: var(--navy, #0f2233); font-size: 0.91rem; }
.email-cell { white-space: nowrap; }
.center-cell { text-align: center; }

.asset-cell {
  white-space: nowrap;
  font-family: 'DM Mono', monospace;
  font-weight: 600;
  color: var(--navy, #0f2233);
  font-size: 0.84rem;
  letter-spacing: 0.04em;
}

/* ══════════════════════════════════════════
   STATUS BADGE
══════════════════════════════════════════ */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-badge.success {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #6ee7b7;
}

.status-badge.warning {
  background: #fffbeb;
  color: #d97706;
  border: 1px solid #fde68a;
}

.status-badge.danger {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fca5a5;
}

/* ══════════════════════════════════════════
   ACTION CELL
══════════════════════════════════════════ */
.action-cell {
  min-width: 220px;
}

.note-input {
  width: 100%;
  padding: 7px 10px;
  border: 1.5px solid #e4e9f0;
  border-radius: 8px;
  font-family: 'Noto Sans Thai', 'DM Sans', sans-serif;
  font-size: 0.83rem;
  color: #0e1b2e;
  outline: none;
  margin-bottom: 8px;
  transition: border-color 0.2s;
}

.note-input:focus { border-color: #3b82f6; }

.action-btns {
  display: flex;
  gap: 6px;
}

.act-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 12px;
  border-radius: 8px;
  border: none;
  font-family: 'Noto Sans Thai', 'DM Sans', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
  flex: 1;
  justify-content: center;
}

.act-btn .material-symbols-rounded { font-size: 15px; font-variation-settings: 'FILL' 1; }

.act-approve {
  background: #ecfdf5;
  color: #059669;
  border: 1.5px solid #6ee7b7;
}

.act-approve:hover:not(:disabled) {
  background: #059669;
  color: #fff;
}

.act-reject {
  background: #fef2f2;
  color: #dc2626;
  border: 1.5px solid #fca5a5;
}

.act-reject:hover:not(:disabled) {
  background: #dc2626;
  color: #fff;
}

.act-btn:disabled { opacity: 0.45; cursor: not-allowed; }

/* ══════════════════════════════════════════
   EMPTY STATE
══════════════════════════════════════════ */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 0;
  color: #8fa3b8;
  gap: 12px;
  background: #ffffff;
  border: 1px solid #e4e9f0;
  border-radius: 16px;
}

.empty-icon {
  font-size: 48px;
  color: #c8d6e3;
  font-variation-settings: 'FILL' 1;
}

/* ══════════════════════════════════════════
   ANIMATION
══════════════════════════════════════════ */
@keyframes fade-up {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ══════════════════════════════════════════
   RESPONSIVE
══════════════════════════════════════════ */
@media (max-width: 768px) {
  .page-header-inner,
  .return-content { padding-left: 20px; padding-right: 20px; }
  .page-header-inner { flex-direction: column; align-items: flex-start; }
}
</style>
