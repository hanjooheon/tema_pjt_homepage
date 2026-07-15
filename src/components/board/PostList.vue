<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps({
  posts: { type: Array, required: true },
  pageSize: { type: Number, default: 7 }
})

const page = ref(1)

watch(
  () => props.posts,
  () => {
    page.value = 1
  }
)

const totalPages = computed(() => Math.max(1, Math.ceil(props.posts.length / props.pageSize)))

const pagedPosts = computed(() => {
  const start = (page.value - 1) * props.pageSize
  return props.posts.slice(start, start + props.pageSize)
})

function formatDate(timestamp) {
  if (!timestamp) return '-'
  try {
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) return '-' // 올바르지 않은 날짜 형식일 때
    return date.toISOString().slice(2, 10).replace(/-/g, '.')
  } catch (e) {
    return '-'
  }
}
</script>

<template>
  <table class="post-table">
    <thead>
      <tr>
        <th class="col-no">번호</th>
        <th>제목</th>
        <th class="col-date">작성일</th>
      </tr>
    </thead>
    <tbody>
      <tr v-if="posts.length === 0">
        <td colspan="3" class="empty">등록된 게시글이 없습니다. 첫 글을 작성해 보세요!</td>
      </tr>
      <tr v-for="(post, idx) in pagedPosts" :key="post.id">
        <td class="col-no">{{ posts.length - ((page - 1) * pageSize + idx) }}</td>
        <td>
          <div class="title-row">
            <div class="title-wrapper">
              <RouterLink :to="`/board/${post.id}`" class="title-link">{{ post.title }}</RouterLink>
            </div>
            <div class="stats">
              <span>좋아요 {{ post.likes ?? 0 }}</span>
              <span>댓글 {{ (post.comments || []).length }}</span>
            </div>
          </div>
          <div class="meta">
            <span>{{ post.nickname || '익명' }}</span>
          </div>
        </td>
        <td class="col-date">{{ formatDate(post.createdAt) }}</td>
      </tr>
    </tbody>
  </table>

  <div class="pagination" v-if="totalPages > 1">
    <button class="btn btn-ghost" :disabled="page === 1" @click="page--">&lt;</button>
    <button
      v-for="p in totalPages"
      :key="p"
      class="btn btn-ghost page-num"
      :class="{ active: p === page }"
      @click="page = p"
    >
      {{ p }}
    </button>
    <button class="btn btn-ghost" :disabled="page === totalPages" @click="page++">&gt;</button>
  </div>
</template>

<style scoped>
.post-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

th, td {
  padding: 12px 14px;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
  font-size: 0.92rem;
}

th {
  background: var(--color-bg);
  color: var(--color-ink-muted);
  font-weight: 700;
}

.col-no, .col-date {
  width: 90px;
  text-align: center;
  color: var(--color-ink-muted);
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.title-wrapper {
  flex: 1;
  min-width: 0; /* flex 자식 요소의 말줄임 적용을 위한 필수 설정 */
}

.title-link {
  font-weight: 600;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis; /* 제목이 너무 길면 ... 으로 표시 */
}

.title-link:hover {
  color: var(--color-primary);
}

.meta {
  margin-top: 4px;
  font-size: 0.8rem;
  color: var(--color-ink-muted);
}

.empty {
  text-align: center;
  color: var(--color-ink-muted);
  padding: 40px 0;
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-top: 16px;
}

.page-num.active {
  background: var(--color-primary-soft);
  color: var(--color-primary-dark);
}

.stats {
  display: flex;
  gap: 10px;
  font-size: 0.8rem;
  color: var(--color-ink-muted);
  white-space: nowrap;
  flex-shrink: 0; 
}
</style>