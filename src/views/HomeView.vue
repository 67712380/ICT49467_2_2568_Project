<template>
  <div class="register-page">

    <!-- Subtle grid canvas background -->
    <div class="canvas-bg" aria-hidden="true">
      <div class="grid-lines"></div>
      <div class="geo geo-1"></div>
      <div class="geo geo-2"></div>
    </div>

    <!-- Form card center -->
    <div class="form-card-wrap">
      <div class="form-card">

        <!-- Header -->
        <div class="card-head">
          <div class="brand-mark">
            <span class="material-symbols-rounded">inventory_2</span>
          </div>
          <div>
            <h1 class="card-title">อนุมัติการเบิกอุปกรณ์</h1>
            <p class="card-sub">กรอกข้อมูลผู้ขอเบิกและเลือก Serial Number ที่จะมอบหมาย</p>
          </div>
        </div>

        <!-- Alert -->
        <transition name="alert-fade">
          <div
            v-if="status.message"
            :class="['form-alert', `alert-${status.type}`]"
          >
            <span class="alert-icon material-symbols-rounded">
              {{ status.type === 'success' ? 'check_circle' : 'error_outline' }}
            </span>
            <span>{{ status.message }}</span>
            <button class="alert-close" @click="status.message = ''" aria-label="ปิด">
              <span class="material-symbols-rounded">close</span>
            </button>
          </div>
        </transition>

        <!-- Form -->
        <form @submit.prevent="submitForm" class="reg-form" novalidate>

          <!-- Row 1: Name + Company -->
          <div class="form-row">
            <div class="field">
              <label class="field-label" for="f-name">ชื่อ-นามสกุล ผู้ขอเบิก</label>
              <div class="field-ctrl">
                <span class="field-ico material-symbols-rounded">person</span>
                <input
                  id="f-name"
                  type="text"
                  v-model="form.name"
                  placeholder="ชื่อ นามสกุล"
                  required
                />
              </div>
            </div>

            <div class="field">
              <label class="field-label" for="f-company">บริษัท / หน่วยงาน</label>
              <div class="field-ctrl">
                <span class="field-ico material-symbols-rounded">business</span>
                <input
                  id="f-company"
                  type="text"
                  v-model="form.company"
                  placeholder="ชื่อบริษัทหรือหน่วยงาน"
                  required
                />
              </div>
            </div>
          </div>

          <!-- Row 2: Phone + Email -->
          <div class="form-row">
            <div class="field">
              <label class="field-label" for="f-phone">เบอร์โทรศัพท์</label>
              <div class="field-ctrl">
                <span class="field-ico material-symbols-rounded">phone</span>
                <input
                  id="f-phone"
                  type="tel"
                  v-model="form.phone"
                  placeholder="0xx-xxx-xxxx"
                  required
                />
              </div>
            </div>

            <div class="field">
              <label class="field-label" for="f-email">อีเมล</label>
              <div class="field-ctrl">
                <span class="field-ico material-symbols-rounded">mail</span>
                <input
                  id="f-email"
                  type="email"
                  v-model="form.email"
                  placeholder="example@email.com"
                  required
                />
              </div>
            </div>
          </div>

          <!-- Row 3: Item + Qty -->
          <div class="form-row">
            <div class="field">
              <label class="field-label" for="f-item">อุปกรณ์ที่ขอ</label>
              <div class="field-ctrl select-wrap">
                <span class="field-ico material-symbols-rounded">laptop</span>
                <select id="f-item" v-model="form.item" required>
                  <option value="" disabled>— เลือกรายการ —</option>
                  <option value="Laptop">Laptop</option>
                  <option value="MacBook">MacBook</option>
                </select>
                <span class="select-arrow material-symbols-rounded">expand_more</span>
              </div>
            </div>

            <div class="field field-qty">
              <label class="field-label" for="f-qty">จำนวน</label>
              <div class="field-ctrl">
                <span class="field-ico material-symbols-rounded">tag</span>
                <input
                  id="f-qty"
                  type="number"
                  min="1"
                  max="10"
                  v-model="form.qty"
                  placeholder="1"
                  required
                />
              </div>
            </div>
          </div>

          <!-- Asset Tag selection -->
          <div class="field">
            <label class="field-label" for="f-asset">
              Serial Number
              <span class="label-hint">— เลือก SN ที่จะมอบหมายให้ผู้ขอ</span>
            </label>
            <div class="asset-grid">
              <button
                v-for="tag in assetTags"
                :key="tag"
                type="button"
                :class="['asset-tag-btn', { selected: form.assetTag === tag }]"
                @click="form.assetTag = (form.assetTag === tag ? '' : tag)"
              >
                {{ tag }}
              </button>
            </div>
            <p class="asset-selected" v-if="form.assetTag">
              <span class="material-symbols-rounded">check</span>
              เลือก: <strong>{{ form.assetTag }}</strong>
            </p>
          </div>

          <!-- Submit -->
          <button type="submit" class="submit-btn" :disabled="isLoading">
            <span v-if="isLoading" class="btn-spin"></span>
            <span v-else class="material-symbols-rounded btn-ico">verified</span>
            <span>{{ isLoading ? 'กำลังบันทึก...' : 'ยืนยันอนุมัติเบิก' }}</span>
            <div class="btn-sheen"></div>
          </button>

        </form>

        <p class="form-note">
          <span class="material-symbols-rounded">admin_panel_settings</span>
          สำหรับเจ้าหน้าที่ผู้ดูแลระบบเท่านั้น — ข้อมูลบันทึกลง Google Sheets ผ่าน n8n
        </p>

      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const WEBHOOK_URL = process.env.VUE_APP_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/register'

const form = reactive({
  name: '',
  company: '',
  phone: '',
  email: '',
  item: '',
  qty: 1,
  assetTag: ''
})

const isLoading = ref(false)
const status = reactive({ message: '', type: '' })

// Serial Number — SN001 ถึง SN010
const assetTags = [
  'SN001', 'SN002', 'SN003', 'SN004', 'SN005',
  'SN006', 'SN007', 'SN008', 'SN009', 'SN010'
]

onMounted(() => {
  // Read query params from route to auto-fill the form
  if (route.query.name) form.name = route.query.name
  if (route.query.company) form.company = route.query.company
  if (route.query.phone) form.phone = route.query.phone
  if (route.query.email) form.email = route.query.email
  if (route.query.item) {
    // try to match the exact string, or use default if it wasn't one of the options
    const possibleItems = ['Laptop', 'MacBook']
    const matched = possibleItems.find(i => i.toLowerCase() === String(route.query.item).toLowerCase())
    if (matched) {
      form.item = matched
    }
  }
  
  // Clean URL to prevent staying on query page directly if requested
  if (Object.keys(route.query).length > 0) {
    router.replace({ path: route.path })
  }
})

const submitForm = async () => {
  isLoading.value = true
  status.message = ''

  try {
    const payload = {
      name: form.name,
      company: form.company,
      phone: form.phone,
      email: form.email,
      item: form.item,
      qty: form.qty,
      assetTag: form.assetTag,
      timestamp: new Date().toISOString()
    }

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) throw new Error('Request failed')

    status.message = 'อนุมัติการเบิกสำเร็จ! ข้อมูลถูกบันทึกลงระบบแล้ว'
    status.type = 'success'

    // Reset
    form.name = ''; form.company = ''; form.phone = ''
    form.email = ''; form.item = ''; form.qty = 1; form.assetTag = ''

  } catch {
    status.message = 'เกิดข้อผิดพลาด กรุณาตรวจสอบการเชื่อมต่อและลองใหม่'
    status.type = 'danger'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* ══════════════════════════════════════════
   PAGE
══════════════════════════════════════════ */
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px 60px;
  position: relative;
  background: var(--snow, #f8fafc);
}

/* ══════════════════════════════════════════
   CANVAS BACKGROUND
══════════════════════════════════════════ */
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

/* ══════════════════════════════════════════
   FORM CARD
══════════════════════════════════════════ */
.form-card-wrap {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 680px;
  animation: card-in 0.5s ease both;
}

@keyframes card-in {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

.form-card {
  background: #ffffff;
  border: 1px solid #e4e9f0;
  border-radius: 20px;
  padding: 36px 40px 32px;
  box-shadow: 0 4px 24px rgba(15,34,51,0.08), 0 1px 4px rgba(15,34,51,0.04);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ══════════════════════════════════════════
   CARD HEADER
══════════════════════════════════════════ */
.card-head {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f3f7;
}

.brand-mark {
  width: 44px; height: 44px;
  border-radius: 12px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.brand-mark .material-symbols-rounded {
  font-size: 22px;
  color: #2563eb;
  font-variation-settings: 'FILL' 1;
}

.card-title {
  font-family: 'DM Sans', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #0e1b2e;
  letter-spacing: -0.03em;
  margin-bottom: 3px;
}

.card-sub {
  font-size: 0.85rem;
  color: #8fa3b8;
}

/* ══════════════════════════════════════════
   ALERT
══════════════════════════════════════════ */
.form-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 0.87rem;
  font-weight: 500;
}

.alert-icon {
  font-size: 20px;
  flex-shrink: 0;
  font-variation-settings: 'FILL' 1;
}

.alert-success {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #6ee7b7;
}

.alert-danger {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fca5a5;
}

.alert-close {
  margin-left: auto;
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  opacity: 0.55;
  display: flex;
  padding: 0;
  transition: opacity 0.15s;
}
.alert-close:hover { opacity: 1; }
.alert-close .material-symbols-rounded { font-size: 18px; }

/* ══════════════════════════════════════════
   FORM FIELDS
══════════════════════════════════════════ */
.reg-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.field-qty { max-width: 140px; }

.field-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #4a6380;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.label-hint {
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
  color: #9aaab8;
  font-size: 0.75rem;
}

.field-ctrl {
  position: relative;
  display: flex;
  align-items: center;
}

.field-ico {
  position: absolute;
  left: 13px;
  font-size: 17px;
  color: #c8d6e3;
  pointer-events: none;
  transition: color 0.2s;
  font-variation-settings: 'FILL' 0;
}

.field-ctrl input,
.field-ctrl select {
  width: 100%;
  padding: 12px 13px 12px 40px;
  border: 1.5px solid #e4e9f0;
  border-radius: 10px;
  background: #ffffff;
  color: #0e1b2e;
  font-family: 'Noto Sans Thai', 'DM Sans', sans-serif;
  font-size: 0.91rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  -webkit-appearance: none;
}

.field-ctrl input::placeholder { color: #c8d6e3; }

.field-ctrl input:focus,
.field-ctrl select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
}

.field-ctrl:focus-within .field-ico { color: #3b82f6; }

/* Select */
.select-wrap select { cursor: pointer; }

.select-arrow {
  position: absolute;
  right: 11px;
  font-size: 17px;
  color: #c8d6e3;
  pointer-events: none;
  transition: transform 0.2s, color 0.2s;
}

.select-wrap:focus-within .select-arrow {
  transform: rotate(180deg);
  color: #3b82f6;
}

/* ══════════════════════════════════════════
   ASSET TAG GRID
══════════════════════════════════════════ */
.asset-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.asset-tag-btn {
  padding: 7px 14px;
  border-radius: 8px;
  border: 1.5px solid #e4e9f0;
  background: #f8fafc;
  color: #4a6380;
  font-family: 'DM Mono', monospace;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.18s ease;
  letter-spacing: 0.04em;
}

.asset-tag-btn:hover {
  border-color: #3b82f6;
  color: #2563eb;
  background: #eff6ff;
  transform: translateY(-1px);
}

.asset-tag-btn.selected {
  border-color: #2563eb;
  background: #2563eb;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(37,99,235,0.3);
  transform: translateY(-1px);
}

.asset-selected {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.8rem;
  color: #2563eb;
  margin-top: 4px;
  font-weight: 500;
}

.asset-selected .material-symbols-rounded {
  font-size: 15px;
  font-variation-settings: 'FILL' 1;
}

/* ══════════════════════════════════════════
   SUBMIT BUTTON
══════════════════════════════════════════ */
.submit-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  width: 100%;
  padding: 14px;
  background: #2563eb;
  border: none;
  border-radius: 10px;
  color: #ffffff;
  font-family: 'Noto Sans Thai', 'DM Sans', sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  overflow: hidden;
  transition: background 0.2s, transform 0.18s, box-shadow 0.2s;
  margin-top: 4px;
  letter-spacing: 0.01em;
}

.submit-btn:hover:not(:disabled) {
  background: #1d4ed8;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(37,99,235,0.35);
}

.submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-ico { font-size: 19px; font-variation-settings: 'FILL' 1; }

.btn-sheen {
  position: absolute;
  top: 0; left: -80%;
  width: 60%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
  transform: skewX(-20deg);
  transition: left 0.55s ease;
}

.submit-btn:hover:not(:disabled) .btn-sheen { left: 150%; }

.btn-spin {
  width: 17px; height: 17px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.65s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ══════════════════════════════════════════
   FOOTER NOTE
══════════════════════════════════════════ */
.form-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 0.74rem;
  color: #c8d6e3;
  margin-top: -6px;
}

.form-note .material-symbols-rounded {
  font-size: 12px;
  font-variation-settings: 'FILL' 1;
}

/* ══════════════════════════════════════════
   ALERT TRANSITION
══════════════════════════════════════════ */
.alert-fade-enter-active,
.alert-fade-leave-active { transition: all 0.28s ease; }
.alert-fade-enter-from,
.alert-fade-leave-to { opacity: 0; transform: translateY(-8px); }

/* ══════════════════════════════════════════
   RESPONSIVE
══════════════════════════════════════════ */
@media (max-width: 680px) {
  .form-card { padding: 24px 20px; }
  .form-row  { grid-template-columns: 1fr; }
  .field-qty { max-width: 100%; }
}
</style>
