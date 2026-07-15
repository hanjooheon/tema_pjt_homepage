<script setup>
import { onMounted, ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getItemsByCategory } from '../services/dataService.js'

const route = useRoute()
const router = useRouter()
const items = ref([])
const loading = ref(true)
const keyword = ref('')

async function load() {
  loading.value = true
  const category = route.query.category
  if (!category) {
    router.push({ name: 'home' })
    return
  }

  items.value = await getItemsByCategory(category)
  loading.value = false
}

onMounted(load)

// 라우트의 쿼리(category)가 바뀌면 재로딩
watch(
  () => route.fullPath,
  () => {
    load()
    keyword.value = ''
  }
)

const filteredItems = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  if (!q) return items.value
  return items.value.filter((it) => {
    return (it.name || '').toLowerCase().includes(q) || (it.address || '').toLowerCase().includes(q)
  })
})
</script>

<template>
  <main class="page">
    <p class="breadcrumb">홈 &gt; 카테고리 목록</p>

    <section>
      <h1>카테고리 항목</h1>

      <div class="toolbar">
        <input v-model="keyword" type="text" placeholder="검색어를 입력하세요 (이름 또는 주소)" @keyup.enter="() => {}" />
        <button class="btn" @click="() => {}">검색</button>
        <button class="btn" @click="keyword = ''">초기화</button>
      </div>

      <div v-if="loading">로딩 중...</div>

      <ul v-else class="place-list-simple">
        <li v-for="item in filteredItems" :key="item.id" class="place-item">
          <strong class="place-name">{{ item.name }}</strong>
          <p class="place-address">{{ item.address }}</p>
          <p class="place-tel" v-if="item.tel">전화: {{ item.tel }}</p>
        </li>
      </ul>

      <div v-if="!loading && filteredItems.length === 0" class="empty">검색 결과가 없습니다.</div>
    </section>
  </main>
</template>

<style scoped>
.toolbar {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  align-items: center;
}

.toolbar input {
  flex: 1 1 70%;
  min-width: 220px;
  padding: 10px 14px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  font-size: 0.98rem;
}

.toolbar .btn {
  padding: 10px 14px;
  min-width: 88px;
}

.place-list-simple { list-style: none; padding: 0; margin: 0; }
.place-item { padding: 12px; border-bottom: 1px solid var(--color-border); }
.place-name { display: block; font-weight: 700; }
.place-address { margin: 6px 0 0; color: var(--color-ink-muted); }
.empty { color: var(--color-ink-muted); margin-top: 12px; }
</style>
