<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import PasswordModal from '../components/board/PasswordModal.vue'
import {
  createComment,
  deleteComment,
  deletePost,
  getPost,
  incrementViews,
  setPendingPassword,
  toggleLike,
  updateComment,
  verifyPassword
} from '../composables/usePosts.js'
import { CURRENT_REGION } from '../data/regions.js'

const props = defineProps({ id: { type: String, required: true } })
const router = useRouter()

const post = ref(null)
const modalVisible = ref(false)
const pendingAction = ref(null)
const pendingCommentId = ref(null)
const modalRef = ref(null)

const commentForm = reactive({ nickname: '', password: '', content: '' })
const commentErrors = reactive({ nickname: '', password: '', content: '' })
const editingCommentId = ref(null)
const editingCommentDraft = ref('')

onMounted(() => {
  refreshPost()
})

function refreshPost() {
  post.value = getPost(props.id)
  if (post.value) incrementViews(props.id)
}

function formattedDate(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : ''
}

function openModal(action) {
  pendingAction.value = action
  pendingCommentId.value = null
  modalVisible.value = true
}

function requestCommentAction(action, comment) {
  pendingAction.value = action
  pendingCommentId.value = comment.id
  modalVisible.value = true
}

function validateComment() {
  commentErrors.nickname = !commentForm.nickname.trim() ? '닉네임을 입력해 주세요.' : ''
  commentErrors.password = !commentForm.password.trim() ? '비밀번호를 입력해 주세요.' : ''
  commentErrors.content = !commentForm.content.trim() ? '댓글 내용을 입력해 주세요.' : ''
  return !commentErrors.nickname && !commentErrors.password && !commentErrors.content
}

function submitComment() {
  if (!validateComment()) return
  const result = createComment(props.id, {
    nickname: commentForm.nickname,
    password: commentForm.password,
    content: commentForm.content
  })
  if (result.ok) {
    commentForm.nickname = ''
    commentForm.password = ''
    commentForm.content = ''
    refreshPost()
  }
}

function startEditComment(comment) {
  editingCommentId.value = comment.id
  editingCommentDraft.value = comment.content
}

function cancelEditComment() {
  editingCommentId.value = null
  editingCommentDraft.value = ''
}

function saveCommentEdit(comment) {
  const result = updateComment(props.id, comment.id, { content: editingCommentDraft.value }, comment.password)
  if (!result.ok) {
    alert(result.error)
    return
  }
  cancelEditComment()
  refreshPost()
}

function handleLike() {
  const result = toggleLike(props.id)
  if (result.ok) {
    refreshPost()
  }
}

function handleConfirm(password) {
  if (pendingAction.value === 'delete') {
    if (!verifyPassword(props.id, password)) {
      modalRef.value?.setError('비밀번호가 일치하지 않습니다.')
      return
    }
    deletePost(props.id, password)
    router.push({ name: 'board-list' })
    return
  }

  if (pendingAction.value === 'edit') {
    if (!verifyPassword(props.id, password)) {
      modalRef.value?.setError('비밀번호가 일치하지 않습니다.')
      return
    }
    setPendingPassword(password)
    router.push({ name: 'board-edit', params: { id: props.id } })
    return
  }

  const comment = post.value?.comments?.find((item) => item.id === pendingCommentId.value)
  if (!comment) {
    modalRef.value?.setError('댓글을 찾을 수 없습니다.')
    return
  }

  if (comment.password !== password) {
    modalRef.value?.setError('비밀번호가 일치하지 않습니다.')
    return
  }

  modalVisible.value = false

  if (pendingAction.value === 'comment-delete') {
    deleteComment(props.id, comment.id, password)
    refreshPost()
  } else if (pendingAction.value === 'comment-edit') {
    startEditComment(comment)
  }
}
</script>

<template>
  <main class="page">
    <p class="breadcrumb">홈 &gt; {{ CURRENT_REGION.name }} 게시판 &gt; 게시글 상세</p>

    <div v-if="post" class="detail card">
      <h1>{{ post.title }}</h1>
      <p class="meta">
        작성자: {{ post.nickname || '익명' }} · 작성일: {{ formattedDate(post.createdAt) }} · 조회 {{ post.views }}
      </p>
      <p class="content">{{ post.content }}</p>

      <div class="actions">
        <button class="btn" @click="router.push({ name: 'board-list' })">목록으로</button>
        <div class="right">
          <button class="btn btn-primary" @click="handleLike">
            {{ post.likedByUser ? '좋아요 취소' : '좋아요' }} {{ post.likes ?? 0 }}
          </button>
          <button class="btn" @click="openModal('edit')">수정</button>
          <button class="btn btn-danger" @click="openModal('delete')">삭제</button>
        </div>
      </div>

      <section class="comments">
        <h2>댓글 {{ (post.comments || []).length }}</h2>

        <form class="comment-form" @submit.prevent="submitComment">
          <div class="comment-row">
            <input v-model="commentForm.nickname" type="text" placeholder="닉네임" />
            <input v-model="commentForm.password" type="password" placeholder="댓글 비밀번호" />
          </div>
          <textarea v-model="commentForm.content" placeholder="댓글을 입력하세요" />
          <div class="comment-actions">
            <button class="btn btn-primary" type="submit">댓글 등록</button>
          </div>
          <p class="error" v-if="commentErrors.nickname">{{ commentErrors.nickname }}</p>
          <p class="error" v-if="commentErrors.password">{{ commentErrors.password }}</p>
          <p class="error" v-if="commentErrors.content">{{ commentErrors.content }}</p>
        </form>

        <ul v-if="post.comments?.length" class="comment-list">
          <li v-for="comment in post.comments" :key="comment.id" class="comment-item">
            <div class="comment-head">
              <strong>{{ comment.nickname || '익명' }}</strong>
              <span>{{ formattedDate(comment.createdAt) }}</span>
            </div>

            <div v-if="editingCommentId === comment.id" class="comment-edit-box">
              <textarea v-model="editingCommentDraft" />
              <div class="comment-actions">
                <button class="btn" @click="cancelEditComment">취소</button>
                <button class="btn btn-primary" @click="saveCommentEdit(comment)">저장</button>
              </div>
            </div>
            <p v-else class="comment-content">{{ comment.content }}</p>

            <div class="comment-actions">
              <button class="btn" @click="requestCommentAction('comment-edit', comment)">수정</button>
              <button class="btn btn-danger" @click="requestCommentAction('comment-delete', comment)">삭제</button>
            </div>
          </li>
        </ul>

        <p v-else class="empty">아직 댓글이 없습니다.</p>
      </section>
    </div>

    <p v-else class="empty">게시글을 찾을 수 없습니다.</p>

    <PasswordModal
      ref="modalRef"
      :visible="modalVisible"
      title="비밀번호 확인"
      placeholder="비밀번호 입력"
      @confirm="handleConfirm"
      @cancel="modalVisible = false"
    />
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

.comments {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border);
}

.comment-form {
  margin-top: 12px;
}

.comment-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.comment-row input,
.comment-form textarea,
.comment-edit-box textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
}

.comment-form textarea,
.comment-edit-box textarea {
  min-height: 90px;
  margin-bottom: 8px;
}

.comment-list {
  list-style: none;
  padding: 0;
  margin: 16px 0 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.comment-item {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 12px;
  background: var(--color-bg);
}

.comment-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.9rem;
  color: var(--color-ink-muted);
}

.comment-content {
  white-space: pre-wrap;
  margin: 0 0 10px;
}

.comment-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.error {
  font-size: 0.78rem;
  color: var(--color-danger);
  margin: 4px 0 0;
}

.empty {
  color: var(--color-ink-muted);
}
</style>