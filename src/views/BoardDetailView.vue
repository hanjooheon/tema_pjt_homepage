<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PasswordModal from '../components/board/PasswordModal.vue'
import { deletePost, getPost, incrementViews, setPendingPassword, verifyPassword } from '../composables/usePosts.js'
import { CURRENT_REGION } from '../data/regions.js'

const props = defineProps({ id: { type: String, required: true } })
const router = useRouter()

const post = ref(null)
const modalVisible = ref(false)
const pendingAction = ref(null) // 'edit' | 'delete'
const modalRef = ref(null)

onMounted(() => {
  post.value = getPost(props.id)
  if (post.value) incrementViews(props.id)
})

const formattedDate = computed(() =>
  post.value ? new Date(post.value.createdAt).toISOString().slice(0, 10) : ''
)

function openModal(action) {
  pendingAction.value = action
  modalVisible.value = true
}

function handleConfirm(password) {
  if (!verifyPassword(props.id, password)) {
    modalRef.value?.setError('비밀번호가 일치하지 않습니다.')
    return
  }

  modalVisible.value = false

  if (pendingAction.value === 'delete') {
    deletePost(props.id, password)
    router.push({ name: 'board-list' })
  } else if (pendingAction.value === 'edit') {
    setPendingPassword(password)
    router.push({ name: 'board-edit', params: { id: props.id } })
  }
}
</script>

<template>
  <main class="page">
    <p class="breadcrumb">홈 &gt; {{ CURRENT_REGION.name }} 게시판 &gt; 게시글 상세</p>

    <div v-if="post" class="detail card">
      <h1>{{ post.title }}</h1>
      <p class="meta">작성일: {{ formattedDate }} · 조회 {{ post.views }}</p>
      <p class="content">{{ post.content }}</p>

      <div class="actions">
        <button class="btn" @click="router.push({ name: 'board-list' })">목록으로</button>
        <div class="right">
          <button class="btn" @click="openModal('edit')">수정</button>
          <button class="btn btn-danger" @click="openModal('delete')">삭제</button>
        </div>
      </div>
    </div>

    <p v-else class="empty">게시글을 찾을 수 없습니다.</p>

    <PasswordModal ref="modalRef" :visible="modalVisible" @confirm="handleConfirm" @cancel="modalVisible = false" />
  </main>
</template>

<style scoped>
.detail {
  padding: 24px;
}

.meta {
  color: var(--color-ink-muted);
  font-size: 0.82rem;
  margin-bottom: 20px;
}

.content {
  white-space: pre-wrap;
  min-height: 160px;
  line-height: 1.7;
}

.actions {
  display: flex;
  justify-content: space-between;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}

.actions .right {
  display: flex;
  gap: 8px;
}

.empty {
  color: var(--color-ink-muted);
}
</style>
