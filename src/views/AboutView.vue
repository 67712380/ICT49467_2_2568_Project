<template>
  <div class="dashboard">

    <!-- Canvas background (shared with HomeView) -->
    <div class="canvas-bg" aria-hidden="true">
      <div class="grid-lines"></div>
      <div class="geo geo-1"></div>
      <div class="geo geo-2"></div>
    </div>

    <!-- Canvas-design: structured grid ruler decoration -->
    <div class="ruler-top" aria-hidden="true">
      <div class="ruler-mark" v-for="n in 12" :key="n"></div>
    </div>

    <!-- ── PAGE HEADER ── -->
    <header class="dash-header">
      <div class="dash-header-inner">
        <div class="header-left">
          <p class="eyebrow">
            <span class="material-symbols-rounded eyebrow-ico">grid_on</span>
            Equipment Request Dashboard
          </p>
          <h1 class="dash-title">Borrow Request Overview</h1>
          <p class="dash-subtitle">Track all equipment borrow requests — click any row to open the approval form.</p>
        </div>

        <div class="header-right">
          <div class="fetch-time" v-if="lastFetchedAt">
            <span class="material-symbols-rounded">schedule</span>
            {{ lastFetchedAt }}
          </div>
          <button
            class="refresh-btn"
            @click="fetchData"
            :disabled="loading"
          >
            <span
              class="material-symbols-rounded"
              :class="{ 'spin-icon': loading }"
            >refresh</span>
            {{ loading ? 'กำลังโหลด' : 'Refresh' }}
          </button>
        </div>
      </div>
    </header>

    <!-- ── KPI STRIP ── -->
    <section class="kpi-strip" aria-label="สรุปสถิติ">
      <div class="kpi-strip-inner">

        <div class="kpi-card" style="--accent:#0f2233">
          <div class="kpi-meta">
            <span class="kpi-label">Total Requests</span>
            <span class="kpi-icon material-symbols-rounded">list_alt</span>
          </div>
          <strong class="kpi-num">{{ requests.length }}</strong>
          <div class="kpi-bar" style="--pct:100%"></div>
        </div>

        <div class="kpi-card" style="--accent:#c8922a">
          <div class="kpi-meta">
            <span class="kpi-label">Pending</span>
            <span class="kpi-icon material-symbols-rounded">hourglass_empty</span>
          </div>
          <strong class="kpi-num">{{ pendingCount }}</strong>
          <div class="kpi-bar"
               :style="`--pct:${requests.length ? (pendingCount/requests.length*100) : 0}%`">
          </div>
        </div>

        <div class="kpi-card" style="--accent:#059669">
          <div class="kpi-meta">
            <span class="kpi-label">Approved</span>
            <span class="kpi-icon material-symbols-rounded">check_circle</span>
          </div>
          <strong class="kpi-num">{{ approvedCount }}</strong>
          <div class="kpi-bar"
               :style="`--pct:${requests.length ? (approvedCount/requests.length*100) : 0}%`">
          </div>
        </div>

      </div>
    </section>

    <!-- ── TABLE SECTION ── -->
    <section class="table-section">
      <div class="table-section-inner">

        <!-- Error -->
        <transition name="fade-drop">
          <div v-if="errorMessage" class="err-bar">
            <span class="material-symbols-rounded">wifi_off</span>
            {{ errorMessage }}
            <button class="err-close" @click="errorMessage = ''" aria-label="ปิด">
              <span class="material-symbols-rounded">close</span>
            </button>
          </div>
        </transition>

        <!-- Loading -->
        <div v-if="loading" class="load-state">
          <div class="load-ring"></div>
          <p>กำลังดึงข้อมูลจาก Google Sheets…</p>
        </div>

        <!-- Table -->
        <div v-else-if="requests.length" class="tbl-wrap">
          <table class="data-tbl">
            <thead>
              <tr>
                <th class="th-num">#</th>
                <th>Timestamp</th>
                <th>Full Name</th>
                <th>Company</th>
                <th>Item</th>
                <th class="th-center">Qty</th>
                <th>Email</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, index) in requests"
                :key="item.rowNumber || index"
                :class="{ 'even-row': index % 2 === 0, 'odd-row': index % 2 === 1, 'clickable-row': true }"
                class="data-row"
                :style="`--i:${index}`"
                @click="goToApproval(item)"
              >
                <td><span class="row-index">{{ index + 1 }}</span></td>
                <td class="td-time">{{ item.timestamp }}</td>
                <td class="name-cell"><strong>{{ item.fullname }}</strong></td>
                <td class="td-co">{{ item.company }}</td>
                <td class="td-item">{{ item.itemName }}</td>
                <td class="th-center"><span class="qty-badge">{{ item.quantity }}</span></td>
                <td class="email-cell">{{ item.email }}</td>
                <td class="reason-cell" :title="item.reason">{{ item.reason }}</td>
                <td>
                  <span class="status-badge" :class="statusClass(item.status)">
                    {{ item.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty -->
        <div v-else class="empty-state">
          <div class="empty-glyph">
            <span class="material-symbols-rounded">inbox</span>
          </div>
          <h3>ยังไม่มีข้อมูล</h3>
          <p>คำขอจะปรากฏที่นี่หลังจากมีการส่งแบบฟอร์ม</p>
        </div>

      </div>
    </section>

  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const requests = ref([])
const loading = ref(false)
const errorMessage = ref('')
const lastFetchedAt = ref('')

const router = useRouter()
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
      const status = readValue(row, ['status', 'สถานะ', 'สถานะคำขอ'], 'Pending')
      return {
        rowNumber: Number(row?.row_number ?? row?.rowNumber ?? idx + 2),
        timestamp: readValue(row, ['timestamp', 'ประทับเวลา'], '-'),
        fullname: readValue(row, ['fullname', 'ชื่อ', 'นามสกุล', 'ชื่อ-นามสกุล'], '-'),
        company: readValue(row, ['company', 'บริษัท', 'หน่วยงาน', 'บริษัท/หน่วยงาน'], '-'),
        itemName: readValue(row, ['itemName', 'อุปกรณ์', 'รายชื่อ', 'รายชื่ออุปกรณ์'], '-'),
        quantity: readValue(row, ['quantity', 'จำนวน'], '-'),
        email: readValue(row, ['email', 'Email', 'อีเมล'], '-'),
        phone: readValue(row, ['phone', 'เบอร์โทร', 'เบอร์โทรศัพท์', 'tel'], ''),
        reason: readValue(row, ['reason', 'เหตุผล', 'เหตุผลการเบิก'], '-'),
        status
      }
    })
    .reverse()
}

const pendingCount = computed(() =>
  requests.value.filter(item => {
    const s = clean(item.status)
    return s.includes('pending') || s.includes('รออนุมัติ') || s.includes('รอ')
  }).length
)

const approvedCount = computed(() =>
  requests.value.filter(item => {
    const s = clean(item.status)
    return s.includes('approved') || s.includes('อนุมัติ')
  }).length
)

const statusClass = (status) => {
  const normalized = clean(status)
  if (normalized.includes('reject') || normalized.includes('not') || normalized.includes('return_rejected') || normalized.includes('ไม่อนุมัติ')) return 'status-rejected'
  if (normalized.includes('approve') || normalized.includes('returned') || normalized.includes('complete') || normalized.includes('อนุมัติ')) return 'status-approved'
  return 'status-pending'
}

const goToApproval = (item) => {
  // Pass relevant data via query string. If data is '-', pass empty string instead.
  router.push({
    path: '/',
    query: {
      name: item.fullname !== '-' ? item.fullname : '',
      company: item.company !== '-' ? item.company : '',
      phone: item.phone !== '-' ? item.phone : '',
      email: item.email !== '-' ? item.email : '',
      item: item.itemName !== '-' ? item.itemName : ''
    }
  })
}

const fetchData = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await fetch(READ_WEBHOOK_URL)
    if (!response.ok) throw new Error('Failed to load request data')
    const contentType = response.headers.get('content-type') || ''
    const rawText = await response.text()
    let result = []
    if (contentType.includes('application/json') && rawText.trim()) result = JSON.parse(rawText)
    requests.value = normalizeRequests(result)
    lastFetchedAt.value = new Date().toLocaleString('th-TH', { hour12: false })
  } catch (error) {
    console.error(error)
    errorMessage.value = 'ไม่สามารถโหลดข้อมูลได้ กรุณาตรวจสอบ n8n webhook และ Google Sheets'
    requests.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => { fetchData() })
</script>

<style scoped>
/* ══════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════ */
.dashboard {
  min-height: 100vh;
  background: var(--snow);
  font-family: 'Noto Sans Thai', 'DM Sans', system-ui, sans-serif;
  position: relative;
}

/* ══════════════════════════════════════════════
   CANVAS BACKGROUND (shared style from HomeView)
══════════════════════════════════════════════ */
.canvas-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
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

/* ══════════════════════════════════════════════
   CANVAS-DESIGN: TOP RULER (visual rhythm element)
══════════════════════════════════════════════ */
.ruler-top {
  display: flex;
  height: 3px;
  width: 100%;
  overflow: hidden;
}

.ruler-mark {
  flex: 1;
  background: var(--navy);
  opacity: 0.06;
}

.ruler-mark:nth-child(4n) { opacity: 0.18; }
.ruler-mark:nth-child(12n) { opacity: 0.35; background: var(--gold); }

/* ══════════════════════════════════════════════
   HEADER
══════════════════════════════════════════════ */
.dash-header {
  background: var(--white);
  border-bottom: 1px solid var(--frost);
  padding: 32px 0 28px;
  animation: fade-up 0.45s ease both;
}

.dash-header-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 40px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
}

.eyebrow {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--mist);
  margin-bottom: 10px;
}

.eyebrow-ico {
  font-size: 14px;
  font-variation-settings: 'FILL' 1;
  color: var(--gold);
}

.dash-title {
  font-family: 'DM Sans', sans-serif;
  font-size: clamp(1.6rem, 2.8vw, 2.2rem);
  font-weight: 700;
  color: var(--navy);
  letter-spacing: -0.035em;
  line-height: 1.15;
  margin-bottom: 6px;
}

.dash-subtitle {
  font-size: 0.88rem;
  color: var(--mist);
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
  color: var(--fog);
  font-family: 'DM Mono', monospace;
}

.fetch-time .material-symbols-rounded { font-size: 14px; }

.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 20px;
  border-radius: 10px;
  background: var(--navy);
  border: none;
  color: var(--white);
  font-family: 'Noto Sans Thai', 'DM Sans', sans-serif;
  font-size: 0.86rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s, transform 0.18s, box-shadow 0.18s;
  letter-spacing: 0.01em;
}

.refresh-btn:hover:not(:disabled) {
  background: var(--navy-mid);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(15,34,51,0.22);
}

.refresh-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.refresh-btn .material-symbols-rounded { font-size: 18px; }

.spin-icon { animation: spin-r 0.7s linear infinite; }
@keyframes spin-r { to { transform: rotate(360deg); } }

/* ══════════════════════════════════════════════
   KPI STRIP
══════════════════════════════════════════════ */
.kpi-strip {
  background: var(--white);
  border-bottom: 1px solid var(--frost);
  padding: 24px 0;
  animation: fade-up 0.45s 0.05s ease both;
}

.kpi-strip-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 40px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.kpi-card {
  position: relative;
  padding: 20px 22px 16px;
  border: 1px solid var(--frost);
  border-radius: 14px;
  background: var(--snow);
  overflow: hidden;
  transition: box-shadow 0.2s, transform 0.2s;
}

.kpi-card:hover {
  box-shadow: 0 6px 24px rgba(15,34,51,0.10);
  transform: translateY(-2px);
}

/* Top edge color */
.kpi-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: var(--accent);
  border-radius: 14px 14px 0 0;
}

.kpi-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.kpi-label {
  font-family: 'DM Mono', monospace;
  font-size: 0.68rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--mist);
}

.kpi-icon {
  font-size: 18px;
  color: var(--accent);
  font-variation-settings: 'FILL' 1;
  opacity: 0.7;
}

.kpi-num {
  display: block;
  font-family: 'DM Sans', sans-serif;
  font-size: 3rem;
  font-weight: 700;
  color: var(--navy);
  letter-spacing: -0.06em;
  line-height: 1;
  margin-bottom: 14px;
}

/* Progress bar — canvas-design proportional visual */
.kpi-bar {
  height: 3px;
  background: var(--frost);
  border-radius: 99px;
  overflow: hidden;
}

.kpi-bar::after {
  content: '';
  display: block;
  height: 100%;
  width: var(--pct, 0%);
  background: var(--accent);
  border-radius: 99px;
  transition: width 0.8s cubic-bezier(0.4,0,0.2,1);
}

/* ══════════════════════════════════════════════
   TABLE SECTION
══════════════════════════════════════════════ */
.table-section {
  padding: 32px 0 64px;
  animation: fade-up 0.45s 0.1s ease both;
}

.table-section-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 40px;
}

/* ── Error bar ── */
.err-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 18px;
  border-radius: 10px;
  background: #fef2f2;
  border: 1px solid #fca5a5;
  border-left: 4px solid #dc2626;
  color: #dc2626;
  font-size: 0.88rem;
  margin-bottom: 20px;
}

.err-bar .material-symbols-rounded { font-variation-settings:'FILL' 1; }

.err-close {
  margin-left: auto;
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  opacity: 0.6;
  padding: 0;
  display: flex;
  transition: opacity 0.15s;
}
.err-close:hover { opacity: 1; }

/* ── Loading ── */
.load-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 80px 20px;
  color: var(--mist);
  font-size: 0.9rem;
}

.load-ring {
  width: 36px;
  height: 36px;
  border: 3px solid var(--fog);
  border-top-color: var(--navy);
  border-radius: 50%;
  animation: spin-r 0.75s linear infinite;
}

/* ── Table wrapper ── */
.tbl-wrap {
  background: var(--white);
  border: 1px solid var(--frost);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(15,34,51,0.06);
}

.data-tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  font-family: 'Noto Sans Thai', 'DM Sans', sans-serif;
}

/* thead */
.data-tbl thead tr {
  background: var(--snow);
  border-bottom: 1.5px solid var(--frost);
}

.data-tbl th {
  padding: 13px 16px;
  font-family: 'DM Mono', monospace;
  font-size: 0.67rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--mist);
  text-align: left;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--snow);
}

.th-num { width: 52px; padding-left: 24px; }
.th-center { text-align: center; }

.data-tbl th:last-child { padding-right: 24px; }

/* tbody */
.data-tbl td {
  padding: 14px 16px;
  border-bottom: 1px solid #f8fafb;
  color: var(--slate);
  vertical-align: middle;
  transition: background 0.13s ease, color 0.13s ease;
}

.data-tbl td:first-child { padding-left: 24px; }
.data-tbl td:last-child  { padding-right: 24px; }

/* Staggered row entrance */
.data-row {
  animation: row-in 0.35s calc(var(--i, 0) * 0.03s) ease both;
}

@keyframes row-in {
  from { opacity: 0; transform: translateX(-6px); }
  to   { opacity: 1; transform: translateX(0); }
}

.data-tbl tr.even-row td { background: #fafbfc; }
.data-tbl tr.odd-row td  { background: var(--white); }

.data-tbl tbody tr.clickable-row {
  cursor: pointer;
}

.data-tbl tbody tr:hover td {
  background: #fef9ee;
  color: var(--navy);
}

.data-tbl tbody tr:hover td:first-child {
  border-left: 3px solid var(--gold);
  padding-left: 21px;
}

.data-tbl tbody tr:last-child td { border-bottom: none; }

/* Row index */
.row-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 26px;
  font-family: 'DM Mono', monospace;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--mist);
  background: var(--snow);
  border: 1px solid var(--frost);
  border-radius: 6px;
}

.td-time {
  font-family: 'DM Mono', monospace;
  font-size: 0.8rem;
  color: var(--fog);
  white-space: nowrap;
}

.name-cell { white-space: nowrap; }
.name-cell strong { font-weight: 600; color: var(--navy); font-size: 0.91rem; }

.td-co  { font-size: 0.88rem; }
.td-item { font-size: 0.88rem; color: var(--navy-mid); font-weight: 500; }

.email-cell {
  font-family: 'DM Mono', monospace;
  font-size: 0.8rem;
  color: #1d4ed8;
  white-space: nowrap;
}

.qty-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 30px;
  height: 24px;
  padding: 0 8px;
  border-radius: 6px;
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
  font-family: 'DM Mono', monospace;
  font-weight: 500;
  font-size: 0.82rem;
}

.th-center { text-align: center; }

.reason-cell {
  max-width: 170px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  font-size: 0.84rem;
  color: var(--mist);
  line-height: 1.5;
}

/* Status badges */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 11px;
  border-radius: 99px;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

.status-badge::before {
  content: '';
  width: 5px; height: 5px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}

.status-approved {
  background: #ecfdf5; color: #059669;
  border: 1px solid #6ee7b7;
}

.status-pending {
  background: #fffbeb; color: #d97706;
  border: 1px solid #fde68a;
}
.status-pending::before { animation: blink 1.8s ease-in-out infinite; }

@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.2; }
}

.status-rejected {
  background: #fef2f2; color: #dc2626;
  border: 1px solid #fca5a5;
}

/* ── Empty state ── */
.empty-state {
  padding: 90px 20px;
  text-align: center;
  color: var(--mist);
  background: var(--white);
  border: 1px solid var(--frost);
  border-radius: 16px;
}

.empty-glyph {
  width: 70px; height: 70px;
  margin: 0 auto 20px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  background: var(--snow);
  border: 1.5px dashed var(--fog);
}

.empty-glyph .material-symbols-rounded { font-size: 32px; color: var(--fog); }

.empty-state h3 {
  font-family: 'DM Sans', sans-serif;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--navy);
  margin-bottom: 6px;
}

.empty-state p { font-size: 0.87rem; color: var(--mist); }

/* ══════════════════════════════════════════════
   TRANSITION
══════════════════════════════════════════════ */
.fade-drop-enter-active, .fade-drop-leave-active { transition: all 0.28s ease; }
.fade-drop-enter-from, .fade-drop-leave-to { opacity: 0; transform: translateY(-8px); }

/* ══════════════════════════════════════════════
   GLOBAL ANIMATION
══════════════════════════════════════════════ */
@keyframes fade-up {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ══════════════════════════════════════════════
   RESPONSIVE
══════════════════════════════════════════════ */
@media (max-width: 1024px) {
  .kpi-strip-inner,
  .dash-header-inner,
  .table-section-inner { padding: 0 24px; }
}

@media (max-width: 800px) {
  .dash-header-inner { flex-direction: column; align-items: flex-start; gap: 16px; }
  .kpi-strip-inner { grid-template-columns: 1fr 1fr; }

  .data-tbl th,
  .data-tbl td { padding: 11px 12px; font-size: 0.83rem; }

  .data-tbl th:first-child,
  .data-tbl td:first-child { padding-left: 16px; }
}

@media (max-width: 560px) {
  .kpi-strip-inner { grid-template-columns: 1fr; }
  .kpi-num { font-size: 2.4rem; }
  .refresh-btn { width: 100%; justify-content: center; }
}
</style>
