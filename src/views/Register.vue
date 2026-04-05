<template>
  <div class="container py-5">
    <div class="row justify-content-center">
      <div class="col-12 col-md-8 col-lg-6">
        <div class="card shadow-lg border-0 rounded-4">
          <div
            class="card-header text-center text-white rounded-top-4"
            style="background: linear-gradient(135deg, #5b3c96, #7a57c7);"
          >
            <h4 class="mb-1 fw-bold">แบบฟอร์มเบิกอุปกรณ์</h4>
            <small>กรอกข้อมูลเพื่อบันทึกลง Google Sheets ผ่าน n8n</small>
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
              <div class="mb-3">
                <label class="form-label">ชื่อ-นามสกุล *</label>
                <input v-model="form.fullname" type="text" class="form-control" required />
              </div>

              <div class="mb-3">
                <label class="form-label">แผนก *</label>
                <select v-model="form.department" class="form-select" required>
                  <option value="" disabled>-- เลือกแผนก --</option>
                  <option value="บุคคล">บุคคล</option>
                  <option value="บัญชี">บัญชี</option>
                  <option value="ไอที">ไอที</option>
                  <option value="การตลาด">การตลาด</option>
                  <option value="ประชาสัมพันธ์">ประชาสัมพันธ์</option>
                </select>
              </div>

              <div class="mb-3">
                <label class="form-label">รายชื่อ - อุปกรณ์ *</label>
                <select v-model="form.itemName" class="form-select" required>
                  <option value="" disabled>-- เลือกอุปกรณ์ --</option>
                  <option value="กรรไกร">กรรไกร</option>
                  <option value="เทปกาว">เทปกาว</option>
                  <option value="ปากกา">ปากกา</option>
                  <option value="แฟ้มเอกสาร">แฟ้มเอกสาร</option>
                  <option value="คัตเตอร์">คัตเตอร์</option>
                </select>
              </div>

              <div class="mb-3">
                <label class="form-label">จำนวนที่เบิก *</label>
                <input
                  v-model.number="form.quantity"
                  type="number"
                  min="1"
                  class="form-control"
                  required
                />
              </div>

              <button class="btn w-100 fw-bold request-btn" :disabled="loading">
                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                {{ loading ? 'กำลังบันทึกข้อมูล...' : 'บันทึกการเบิกอุปกรณ์' }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'

const form = reactive({
  fullname: '',
  department: '',
  itemName: '',
  quantity: null
})

const loading = ref(false)

const status = reactive({
  message: '',
  type: ''
})

const resetForm = () => {
  form.fullname = ''
  form.department = ''
  form.itemName = ''
  form.quantity = null
}

const submitForm = async () => {
  loading.value = true
  status.message = ''

  try {
    const response = await fetch('http://localhost:5678/webhook/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...form,
        timestamp: new Date().toLocaleString('th-TH')
      })
    })

    if (!response.ok) {
      throw new Error('Request failed')
    }

    await response.json()
    status.message = 'บันทึกข้อมูลการเบิกอุปกรณ์สำเร็จ'
    status.type = 'success'
    resetForm()
  } catch (error) {
    console.error(error)
    status.message = 'เกิดข้อผิดพลาด กรุณาตรวจสอบ n8n flow แล้วลองใหม่'
    status.type = 'danger'
  } finally {
    loading.value = false
  }
}
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

.request-btn {
  background: #5b3c96;
  color: #fff;
}

.request-btn:hover {
  background: #4b3180;
  color: #fff;
}
</style>
