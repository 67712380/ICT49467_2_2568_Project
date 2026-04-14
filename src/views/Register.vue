<template>
  <div class="container py-5">
    <div class="row justify-content-center">
      <div :class="isAdminMode ? 'col-12 col-xl-10' : 'col-12 col-md-8 col-lg-6'">
        <div class="card shadow-lg border-0 rounded-4">
          <div
            class="card-header text-center text-white rounded-top-4"
            style="background: linear-gradient(135deg, #5b3c96, #7a57c7);"
          >
            <h4 class="mb-1 fw-bold">
              {{ isAdminMode ? '??????????? (Admin)' : '?????????????????????' }}
            </h4>
            <small>
              {{
                isAdminMode
                  ? '??????????????????????? ??????????????????'
                  : '??????????????????????? Google Sheets ???? n8n'
              }}
            </small>
          </div>

          <div class="card-body p-4">
            <div
              v-if="status.message"
              :class="`alert alert-${status.type} alert-dismissible fade show`"
            >
              {{ status.message }}
              <button type="button" class="btn-close" @click="status.message = ''"></button>
            </div>

            <form @submit.prevent="submitForm">
              <div v-if="isAdminMode" class="table-responsive mb-3">
                <table class="table table-bordered align-middle admin-form-table">
                  <tbody>
                    <tr>
                      <th>????????????</th>
                      <td>{{ selectedRowNumber || '-' }}</td>
                    </tr>
                    <tr>
                      <th>????-??????? *</th>
                      <td><input v-model="form.fullname" type="text" class="form-control" required /></td>
                    </tr>
                    <tr>
                      <th>??????/???????? *</th>
                      <td><input v-model="form.company" type="text" class="form-control" required /></td>
                    </tr>
                    <tr>
                      <th>????? *</th>
                      <td><input v-model="form.email" type="email" class="form-control" required /></td>
                    </tr>
                    <tr>
                      <th>????????????? *</th>
                      <td>
                        <select v-model="form.itemName" class="form-select" required>
                          <option value="" disabled>-- ??????????? --</option>
                          <option v-for="option in itemOptions" :key="option" :value="option">{{ option }}</option>
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <th>????? *</th>
                      <td>
                        <input
                          v-model.number="form.quantity"
                          type="number"
                          min="1"
                          class="form-control"
                          required
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>?????????? (Asset Tag) *</th>
                      <td>
                        <input
                          v-model="form.assetTag"
                          type="text"
                          class="form-control"
                          placeholder="???? LTP-001"
                          required
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <template v-else>
                <div class="mb-3">
                  <label class="form-label">????-??????? *</label>
                  <input v-model="form.fullname" type="text" class="form-control" required />
                </div>

                <div class="mb-3">
                  <label class="form-label">??????/???????? *</label>
                  <input v-model="form.company" type="text" class="form-control" required />
                </div>

                <div class="mb-3">
                  <label class="form-label">????? *</label>
                  <input v-model="form.email" type="email" class="form-control" required />
                </div>

                <div class="mb-3">
                  <label class="form-label">????????????? *</label>
                  <select v-model="form.itemName" class="form-select" required>
                    <option value="" disabled>-- ??????????? --</option>
                    <option v-for="option in itemOptions" :key="option" :value="option">{{ option }}</option>
                  </select>
                </div>

                <div class="mb-3">
                  <label class="form-label">????? *</label>
                  <input
                    v-model.number="form.quantity"
                    type="number"
                    min="1"
                    class="form-control"
                    required
                  />
                </div>

                <div class="mb-3">
                  <label class="form-label">?????????? (Asset Tag) *</label>
                  <input
                    v-model="form.assetTag"
                    type="text"
                    class="form-control"
                    placeholder="???? LTP-001"
                    required
                  />
                </div>
              </template>

              <button class="btn w-100 fw-bold request-btn" :disabled="loading">
                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                {{
                  loading
                    ? '?????????????????...'
                    : isAdminMode
                      ? '?????????????????? Admin'
                      : '?????????????????????'
                }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const WEBHOOK_URL = process.env.VUE_APP_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook-test/register'
const route = useRoute()

const form = reactive({
  fullname: '',
  company: '',
  email: '',
  itemName: '',
  quantity: 1,
  assetTag: ''
})

const loading = ref(false)
const selectedRowNumber = ref('')
const baseItemOptions = ['Laptop']

const status = reactive({
  message: '',
  type: ''
})

const isAdminMode = computed(() => String(route.query.mode || '').toLowerCase() === 'admin')

const itemOptions = computed(() => {
  if (!form.itemName || baseItemOptions.includes(form.itemName)) {
    return baseItemOptions
  }
  return [form.itemName, ...baseItemOptions]
})

const queryText = (value, fallback = '') => {
  const raw = Array.isArray(value) ? value[0] : value
  if (raw === undefined || raw === null) {
    return fallback
  }
  const text = String(raw).trim()
  return text || fallback
}

const applyQueryToForm = () => {
  if (!isAdminMode.value) {
    return
  }

  selectedRowNumber.value = queryText(route.query.rowNumber, '')
  form.fullname = queryText(route.query.fullname, form.fullname)
  form.company = queryText(route.query.company, form.company)
  form.email = queryText(route.query.email, form.email)
  form.itemName = queryText(route.query.itemName, form.itemName)
  form.assetTag = queryText(route.query.assetTag, form.assetTag)

  const quantity = Number(queryText(route.query.quantity, form.quantity))
  if (Number.isFinite(quantity) && quantity > 0) {
    form.quantity = quantity
  }
}

const resetForm = () => {
  form.fullname = ''
  form.company = ''
  form.email = ''
  form.itemName = ''
  form.quantity = 1
  form.assetTag = ''
}

const submitForm = async () => {
  loading.value = true
  status.message = ''

  try {
    const payload = {
      timestamp: new Date().toLocaleString('th-TH', { hour12: false }),
      fullname: form.fullname,
      company: form.company,
      email: form.email,
      itemName: form.itemName,
      quantity: form.quantity,
      asset_tag: form.assetTag,
      phone: '-',
      reason: '-',
      status: 'pending'
    }

    if (isAdminMode.value) {
      payload.sourceRowNumber = selectedRowNumber.value || '-'
      payload.createdByRole = 'admin'
    }

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error('Request failed')
    }

    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      await response.json()
    } else {
      await response.text()
    }

    status.message = isAdminMode.value
      ? 'Admin ??????????????????????'
      : '????????????????????'
    status.type = 'success'

    if (!isAdminMode.value) {
      resetForm()
    }
  } catch (error) {
    console.error(error)
    status.message = '?????????????? ???????????? n8n flow ???????????'
    status.type = 'danger'
  } finally {
    loading.value = false
  }
}

onMounted(applyQueryToForm)

watch(
  () => route.query,
  () => applyQueryToForm(),
  { deep: true }
)
</script>

<style scoped>
.card {
  transition: 0.3s;
}

.card:hover {
  transform: translateY(-5px);
}

.form-control:focus,
.form-select:focus {
  box-shadow: 0 0 0 0.2rem rgba(122, 87, 199, 0.2);
  border-color: #7a57c7;
}

.admin-form-table th {
  width: 240px;
  background: #f6f3ff;
}

.request-btn {
  background: #5b3c96;
  color: #fff;
}

.request-btn:hover {
  background: #4b3180;
  color: #fff;
}
</style>
