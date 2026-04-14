<template>
  <div class="return-page admin-theme container py-4">
    <section class="admin-card p-3 p-md-4 mb-3">
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div>
          <h2 class="mb-1 page-title">Return Equipment Management</h2>
          <p class="mb-0 admin-muted">Admin updates return status from records stored in Google Sheets.</p>
          <p class="mb-0 admin-muted small">Last fetched: {{ lastFetchedAt || '-' }}</p>
        </div>
        <button class="admin-btn-primary" :disabled="loading" @click="fetchRequests">
          <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
          {{ loading ? 'Loading...' : 'Refresh' }}
        </button>
      </div>
    </section>

    <div v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>

    <section v-if="requests.length" class="admin-card p-0 overflow-hidden">
      <div class="table-responsive admin-table-shell">
        <table class="table admin-table align-middle mb-0">
          <thead>
            <tr>
              <th>#</th>
              <th>Timestamp</th>
              <th>Name</th>
              <th>Company</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Item</th>
              <th>Qty</th>
              <th>Asset Tag</th>
              <th>Current Status</th>
              <th>Return Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in requests" :key="item.rowNumber">
              <td>{{ item.rowNumber }}</td>
              <td>{{ item.timestamp }}</td>
              <td>{{ item.fullname }}</td>
              <td>{{ item.company }}</td>
              <td>{{ item.phone }}</td>
              <td class="email-cell">{{ item.email }}</td>
              <td>{{ item.itemName }}</td>
              <td>{{ item.quantity }}</td>
              <td class="asset-cell">{{ item.assetTag }}</td>
              <td>
                <span class="admin-badge" :class="statusBadgeClass(item.status)">{{ item.status }}</span>
              </td>
              <td>
                <div class="d-grid gap-2">
                  <input
                    v-model="item.adminNote"
                    type="text"
                    class="form-control form-control-sm admin-input"
                    placeholder="Return note (optional)"
                  />
                  <div class="btn-group">
                    <button
                      class="btn btn-sm btn-success"
                      :disabled="item.submitting"
                      @click="submitReturn(item, 'returned')"
                    >
                      Mark Returned
                    </button>
                    <button
                      class="btn btn-sm btn-outline-danger"
                      :disabled="item.submitting"
                      @click="submitReturn(item, 'return_rejected')"
                    >
                      Reject Return
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-else class="text-center admin-muted py-5 admin-card">
      No request data found.
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'

// Keep this as simple as AboutView:
// set `VUE_APP_N8N_RETURN_READ_URL` / `VUE_APP_N8N_RETURN_ACTION_URL` in `.env` when needed.
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

    item.status = decision
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

  if (normalized.includes('reject') || normalized.includes('not')) {
    return 'danger'
  }

  if (normalized.includes('return') || normalized.includes('approve') || normalized.includes('complete')) {
    return 'success'
  }

  return 'warning'
}

onMounted(fetchRequests)
</script>

<style scoped>
.return-page {
  max-width: 1280px;
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
}

.page-title {
  margin: 0;
  font-size: clamp(1.1rem, 1.8vw, 1.5rem);
  font-weight: 700;
  color: #0f172a;
}

.email-cell {
  white-space: nowrap;
}

.asset-cell {
  white-space: nowrap;
  font-weight: 600;
}

@media (max-width: 768px) {
  .asset-cell {
    font-weight: 700;
  }
}
</style>
