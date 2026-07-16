<script setup>
import { onMounted, ref, watch, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getItemsByCategory } from '../services/dataService.js'

const route = useRoute()

const categoryLabels = {
  tourist: '관광지',
  leports: '레포츠',
  culture: '문화시설',
  shopping: '쇼핑',
  lodging: '숙박',
  festival: '축제공연행사'
}

const title = computed(() => {
  const key = route.query.category
  return (key && categoryLabels[key]) ? categoryLabels[key] : '관광지'
})
const categoryEmojis = {
  tourist: '📸',
  leports: '🚴',
  culture: '🏛️',
  shopping: '🛍️',
  lodging: '🏨',
  festival: '🎉' 
}

const emoji = computed(() => {
  const key = route.query.category
  return (key && categoryEmojis[key]) ? categoryEmojis[key] : '📍'
})
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
  await nextTick()
  restoreScroll()
}

onMounted(load)

// 라우트의 쿼리(category)가 바뀌면 재로딩
watch(
  () => route.fullPath,
  () => {
    load()
    keyword.value = ''
    currentPage.value = 1
  }
)

// reset page when keyword changes
watch(keyword, () => { currentPage.value = 1 })

const filteredItems = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  if (!q) return items.value
  return items.value.filter((it) => {
    return (it.name || '').toLowerCase().includes(q) || (it.address || '').toLowerCase().includes(q)
  })
})

// Pagination state (default 10 items per page; 6 for festival category)
const currentPage = ref(1)
const pageSize = computed(() => (route.query.category === 'festival' ? 6 : 10))
const totalPages = computed(() => Math.max(1, Math.ceil(filteredItems.value.length / pageSize.value)))
const pagedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredItems.value.slice(start, start + pageSize.value)
})

// reset page when pageSize changes (e.g., switching to festival)
watch(pageSize, () => { currentPage.value = 1 })

// Block pagination (show 1-10, 11-20, ...)
const blockSize = 10
const currentBlockIndex = computed(() => Math.floor((currentPage.value - 1) / blockSize))
const blockStart = computed(() => currentBlockIndex.value * blockSize + 1)
const blockEnd = computed(() => Math.min(totalPages.value, blockStart.value + blockSize - 1))
const pageNumbers = computed(() => {
  const arr = []
  for (let i = blockStart.value; i <= blockEnd.value; i++) arr.push(i)
  return arr
})

function prevPage() { currentPage.value = Math.max(1, currentPage.value - 1) }
function nextPage() { currentPage.value = Math.min(totalPages.value, currentPage.value + 1) }
function prevBlock() { const newStart = Math.max(1, blockStart.value - blockSize); currentPage.value = newStart }
function nextBlock() { const newStart = Math.min(totalPages.value, blockStart.value + blockSize); currentPage.value = newStart }

function restoreScroll() {
  const category = route.query.category || 'all'
  const key = `places-scroll-${category}`
  const val = sessionStorage.getItem(key)
  if (val) {
    const y = Number(val) || 0
    window.scrollTo(0, y)
    sessionStorage.removeItem(key)
  }
}

function goToDetail(item) {
  const category = route.query.category
  const key = `places-scroll-${category || 'all'}`
  try { sessionStorage.setItem(key, String(window.scrollY || window.pageYOffset || 0)) } catch (e) {}
  router.push({ name: 'place-detail', params: { id: item.id }, query: { category } })
}
</script>

<template>
  <main class="page">
    
<h1><span class="title-emoji">{{ emoji }}</span> {{ title }}</h1>

    <section>
      
      <div class="toolbar">
        <input v-model="keyword" type="text" placeholder="검색어를 입력하세요 (이름 또는 주소)" @keyup.enter="() => {}" />
        <button class="btn" @click="() => {}">검색</button>
        <button class="btn" @click="keyword = ''">초기화</button>
      </div>

      <div v-if="loading">로딩 중...</div>

      <ul v-else class="place-list-simple">
        <li v-for="item in pagedItems" :key="item.id" class="place-item" @click="goToDetail(item)" style="cursor:pointer">
          <strong class="place-name">{{ item.name }}</strong>
          <p class="place-address">{{ item.address }}</p>
          <p class="place-tel" v-if="item.tel">전화: {{ item.tel }}</p>
        </li>
      </ul>

      <div v-if="!loading && filteredItems.length === 0" class="empty">검색 결과가 없습니다.</div>

      <!-- Pagination -->
      <div v-if="filteredItems.length > pageSize" class="pagination">
        <button class="btn" :disabled="blockStart === 1" @click="prevBlock"><<</button>
        <button class="btn" :disabled="currentPage === 1" @click="prevPage"><</button>

        <button
          v-for="n in pageNumbers"
          :key="n"
          class="btn"
          :class="{ 'btn-primary': n === currentPage }"
          @click="currentPage = n"
        >
          {{ n }}
        </button>

        <button class="btn" :disabled="currentPage === totalPages" @click="nextPage">></button>
        <button class="btn" :disabled="blockEnd === totalPages" @click="nextBlock">>></button>
      </div>
    </section>
  </main>
</template>

<style scoped>

h1 {
  font-family: 'Pretendard', system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans KR', 'Helvetica Neue', Arial, sans-serif;
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: 0;
  color: var(--color-primary-dark);
  margin: 0 0 12px;
}

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

.pagination {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  align-items: center;
  width: 100%;
  flex-wrap: wrap;
  /* center across the full page */
  justify-content: center;
  /* allow horizontal scroll on small screens */
  overflow-x: auto;
  padding: 6px 0;
}

.pagination .btn {
  padding: 6px 10px;
  min-width: 38px;
  flex: 0 0 auto;
}

.pagination .btn-primary {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}
</style>
