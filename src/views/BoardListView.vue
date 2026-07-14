<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PostList from '../components/board/PostList.vue'
import { getPosts, searchPosts } from '../composables/usePosts.js'
import { CURRENT_REGION } from '../data/regions.js'

const router = useRouter()
const keyword = ref('')
const sortBy = ref('latest')
const posts = ref([])

function refresh() {
  posts.value = keyword.value.trim()
    ? searchPosts(keyword.value, sortBy.value)
    : getPosts(sortBy.value)
}

onMounted(refresh)

function goWrite() {
  router.push({ name: 'board-write' })
}
</script>

<template>
  <main class="page">
    <p class="breadcrumb">홈 &gt; {{ CURRENT_REGION.name }} 게시판</p>

    <div class="toolbar">
      <input
        v-model="keyword"
        type="text"
        placeholder="게시글 검색어를 입력하세요"
        @keyup.enter="refresh"
      />
      <button class="btn" @click="refresh">검색</button>
      <select v-model="sortBy" @change="refresh" class="sort-select">
        <option value="latest">최신순</option>
        <option value="likes">좋아요순</option>
      </select>
      <button class="btn btn-primary" @click="goWrite">+ 글쓰기</button>
    </div>

    <PostList :posts="posts" />
  </main>
</template>

<style scoped>
.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.toolbar input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
}

.sort-select {
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
}
</style>