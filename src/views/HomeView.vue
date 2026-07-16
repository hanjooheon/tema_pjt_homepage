<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import RegionBanner from '../components/common/RegionBanner.vue'
import { getPosts } from '../composables/usePosts.js'

const recentPosts = ref([])

onMounted(() => {
  recentPosts.value = getPosts().slice(0, 5)
})
</script>

<template>
  <main class="page">
    <RegionBanner />

    <section class="recent">
      <h2>최근 게시글</h2>
      <ul v-if="recentPosts.length" class="recent-list">
        <li v-for="post in recentPosts" :key="post.id" class="pin">
          <RouterLink :to="`/board/${post.id}`">{{ post.title }}</RouterLink>
        </li>
      </ul>
      <p v-else class="empty">아직 등록된 게시글이 없습니다.</p>
    </section>
  </main>
</template>

<style scoped>
.recent {
  margin-top: 32px;
}

.recent h2 {
  font-family: 'Pretendard', system-ui, -apple-system, 'Noto Sans KR', 'Helvetica Neue', Arial, sans-serif;
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--color-primary-dark);
  margin: 0 0 8px;
}

.recent-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.recent-list li {
  padding: 12px 4px;
  border-bottom: 1px solid var(--color-border);
  font-size: 0.92rem;
}

.empty {
  color: var(--color-ink-muted);
  font-size: 0.88rem;
}
</style>
