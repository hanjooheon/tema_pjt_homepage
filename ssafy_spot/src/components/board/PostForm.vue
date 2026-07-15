<script setup>
import { reactive, watch } from 'vue'
import { isBlank, isValidPassword } from '../../utils/validators.js'

const props = defineProps({
  isEdit: { type: Boolean, default: false },
  initial: {
    type: Object,
    default: () => ({ title: '', content: '' })
  }
})

const emit = defineEmits(['submit', 'cancel'])

const form = reactive({ title: '', content: '', password: '' })
const errors = reactive({ title: '', content: '', password: '' })

watch(
  () => props.initial,
  (val) => {
    form.title = val?.title ?? ''
    form.content = val?.content ?? ''
  },
  { immediate: true }
)

function validate() {
  errors.title = isBlank(form.title) ? '제목을 입력해 주세요.' : ''
  errors.content = isBlank(form.content) ? '내용을 입력해 주세요.' : ''
  // 수정 모드에서는 비밀번호를 다시 받지 않음 (상세 화면에서 이미 확인함)
  errors.password = !props.isEdit && !isValidPassword(form.password) ? '숫자 4자리 이상 입력해 주세요.' : ''
  return !errors.title && !errors.content && !errors.password
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', { title: form.title.trim(), content: form.content.trim(), password: form.password })
}
</script>

<template>
  <form class="post-form" @submit.prevent="handleSubmit">
    <div class="field">
      <label for="title">제목</label>
      <input id="title" v-model="form.title" type="text" placeholder="제목을 입력하세요" />
      <p class="error" v-if="errors.title">{{ errors.title }}</p>
    </div>

    <div class="field">
      <label for="content">내용</label>
      <textarea id="content" v-model="form.content" placeholder="내용을 입력하세요" />
      <p class="error" v-if="errors.content">{{ errors.content }}</p>
    </div>

    <div class="field" v-if="!isEdit">
      <label for="password">수정용 비밀번호</label>
      <input id="password" v-model="form.password" type="password" placeholder="숫자 4자리 이상" />
      <p class="hint">※ 수정·삭제 시 동일하게 입력해야 함</p>
      <p class="error" v-if="errors.password">{{ errors.password }}</p>
    </div>

    <div class="actions">
      <button type="button" class="btn" @click="emit('cancel')">취소</button>
      <button type="submit" class="btn btn-primary">등록</button>
    </div>
  </form>
</template>

<style scoped>
.post-form {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 24px;
}

.hint {
  font-size: 0.78rem;
  color: var(--color-ink-muted);
  margin: 4px 0 0;
}

.error {
  font-size: 0.78rem;
  color: var(--color-danger);
  margin: 4px 0 0;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}
</style>
