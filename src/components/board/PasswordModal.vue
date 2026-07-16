<script setup>
import { ref } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '비밀번호 확인' },
  placeholder: { type: String, default: '비밀번호 입력' }
})

const emit = defineEmits(['confirm', 'cancel'])

const password = ref('')
const error = ref('')

function handleConfirm() {
  if (!password.value) {
    error.value = '비밀번호를 입력해 주세요.'
    return
  }
  emit('confirm', password.value)
  password.value = ''
  error.value = ''
}

function handleCancel() {
  password.value = ''
  error.value = ''
  emit('cancel')
}

defineExpose({
  setError: (msg) => {
    error.value = msg
  }
})
</script>

<template>
  <div v-if="visible" class="modal-backdrop" @click.self="handleCancel">
    <div class="modal card">
      <h3>{{ title }}</h3>
      <input
        v-model="password"
        type="password"
        :placeholder="placeholder"
        @keyup.enter="handleConfirm"
      />
      <p class="error" v-if="error">{{ error }}</p>
      <div class="actions">
        <button class="btn btn-primary" @click="handleConfirm">확인</button>
        <button class="btn" @click="handleCancel">취소</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(34, 38, 31, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal {
  width: 280px;
  padding: 20px;
  background: var(--color-surface);
}

.modal h3 {
  font-size: 1rem;
  margin-bottom: 12px;
}

.modal input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.error {
  font-size: 0.78rem;
  color: var(--color-danger);
  margin: 6px 0 0;
}

.actions {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}

.actions .btn {
  flex: 1;
}
</style>