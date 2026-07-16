<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { readList, writeList, generateId } from '../utils/localStorage.js'
import { useRoute, useRouter } from 'vue-router'
import { getItemById } from '../services/dataService.js'

const route = useRoute()
const router = useRouter()
const item = ref(null)
const loading = ref(true)
const mapContainer = ref(null)
let map = null
let marker = null
const activeTab = ref('images') // 'images' | 'map'

const images = computed(() => {
  if (!item.value) return []
  const raw = item.value.raw || {}
  const imgs = []
  if (raw.firstimage) imgs.push(raw.firstimage)
  if (item.value.image) imgs.push(item.value.image)
  if (raw.image) imgs.push(raw.image)
  return [...new Set(imgs.filter(Boolean))]
})

const directionsUrl = computed(() => {
  if (!item.value) return ''
  const lat = item.value.lat
  const lng = item.value.lng
  if (lat && lng) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
  }
  const q = encodeURIComponent(item.value.address || item.value.name || '')
  return `https://www.google.com/maps/search/?api=1&query=${q}`
})

const imgIndex = ref(0)
function prevImg() { if (images.value.length === 0) return; imgIndex.value = (imgIndex.value - 1 + images.value.length) % images.value.length }
function nextImg() { if (images.value.length === 0) return; imgIndex.value = (imgIndex.value + 1) % images.value.length }

// dynamic wrapper sizing: adjust to natural image size but cap to reasonable max
const wrapperStyle = ref({})
function onImageLoad(e) {
  try {
    const img = e.target
    const w = img.naturalWidth || img.width
    const h = img.naturalHeight || img.height
    if (!w || !h) {
      if (!wrapperStyle.value.width) wrapperStyle.value = { width: '420px', height: '320px' }
      return
    }

    const maxW = Math.min( Math.max(420, window.innerWidth - 120), 1200 )
    const maxH = Math.min( Math.max(320, Math.floor(window.innerHeight * 0.6)), 900 )

    const scale = Math.min(1, maxW / w, maxH / h)
    const dw = Math.round(w * scale)
    const dh = Math.round(h * scale)

    // Prevent shrinking: only expand wrapper if new image is larger than current wrapper
    const curW = parseInt(String(wrapperStyle.value.width || '').replace(/[^0-9]/g, '')) || 0
    const curH = parseInt(String(wrapperStyle.value.height || '').replace(/[^0-9]/g, '')) || 0
    const newW = Math.max(curW || 0, dw)
    const newH = Math.max(curH || 0, dh)
    wrapperStyle.value = { width: newW + 'px', height: newH + 'px' }
  } catch (e) {
    if (!wrapperStyle.value.width) wrapperStyle.value = { width: '420px', height: '320px' }
  }
}

const descriptionText = computed(() => {
  const r = item.value?.raw || {}
  return r.overview || r.introduction || r.intro || r.description || r.program || ''
})

// Reviews stored per place in localStorage
const reviews = ref([])
const reviewForm = ref({ nickname: '', rating: 5, text: '' })
const reviewErrors = ref({ nickname: '', text: '' })

function reviewsKey(placeId) {
  return `localhub_place_reviews_${placeId}`
}

function loadReviews() {
  if (!item.value || !item.value.id) return
  reviews.value = readList(reviewsKey(item.value.id)).sort((a,b)=>b.createdAt - a.createdAt)
}

function validateReview() {
  reviewErrors.value.nickname = reviewForm.value.nickname.trim() ? '' : '닉네임을 입력해 주세요.'
  reviewErrors.value.text = reviewForm.value.text.trim() ? '' : '한줄평을 입력해 주세요.'
  return !reviewErrors.value.nickname && !reviewErrors.value.text
}

function submitReview() {
  if (!validateReview()) return
  const placeId = item.value?.id
  if (!placeId) return
  const now = Date.now()
  const r = {
    id: generateId(),
    nickname: reviewForm.value.nickname.trim() || '익명',
    rating: Number(reviewForm.value.rating) || 0,
    text: reviewForm.value.text.trim(),
    createdAt: now
  }
  const list = readList(reviewsKey(placeId))
  list.push(r)
  writeList(reviewsKey(placeId), list)
  reviewForm.value.nickname = ''
  reviewForm.value.rating = 5
  reviewForm.value.text = ''
  loadReviews()
}

watch(item, () => { loadReviews() })

function ensureLeaflet() {
  return new Promise((resolve, reject) => {
    if (window.L) return resolve(window.L)
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => resolve(window.L)
    script.onerror = () => reject(new Error('Leaflet load failed'))
    document.head.appendChild(script)
  })
}

function initMap(L) {
  if (!mapContainer.value || !item.value || !item.value.lat || !item.value.lng) return
  map = L.map(mapContainer.value, { zoomControl: true, scrollWheelZoom: false }).setView([item.value.lat, item.value.lng], 15)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)
  marker = L.marker([item.value.lat, item.value.lng]).addTo(map)
  marker.bindPopup(`<strong>${item.value.name}</strong><div style="font-size:0.9rem;margin-top:6px;">${item.value.address || ''}</div>`)
}

async function load() {
  loading.value = true
  const id = route.params.id
  const it = await getItemById(id)
  item.value = it
  loading.value = false
  // initialize map only if map tab is active
  try {
    if (activeTab.value === 'map') {
      const L = await ensureLeaflet()
      initMap(L)
    }
  } catch (e) {
    console.error(e)
  }
}

function backToList() {
  const category = item.value?.categoryKey || route.query.category
  router.push({ name: 'places-list', query: { category } })
}

onMounted(load)

// when user switches to map tab, initialize map if not already
watch(activeTab, async (val) => {
  if (val === 'map' && map === null && item.value) {
    try {
      const L = await ensureLeaflet()
      initMap(L)
    } catch (e) {
      console.error(e)
    }
  }
})
</script>

<template>
  <main class="page">
    <p class="breadcrumb">홈 &gt; 카테고리 &gt; 업체 상세</p>

    <div v-if="loading">로딩 중...</div>

    <div v-else-if="item" class="detail card">
      <h1>{{ item.name }}</h1>

      <div class="detail-tabs">
        <button :class="['tab', { active: activeTab === 'images' } ]" @click="activeTab = 'images'">사진</button>
        <button :class="['tab', { active: activeTab === 'map' } ]" @click="activeTab = 'map'">지도</button>
      </div>

      <div class="detail-media">
        <div v-show="activeTab === 'images'" class="media">
          <div v-if="images.length" class="carousel">
            <div class="image-wrapper" :style="wrapperStyle">
              <button v-if="images.length > 1" class="btn carousel-arrow left" @click="prevImg">◀</button>
              <img :src="images[imgIndex]" alt="사진" class="detail-image" @load="onImageLoad" />
              <button v-if="images.length > 1" class="btn carousel-arrow right" @click="nextImg">▶</button>
            </div>
          </div>
          <div v-else class="no-image">이미지 없음</div>
          <!-- description removed per request -->
        </div>
        <!-- reviews -->
        <div class="reviews" v-show="activeTab === 'images'" style="margin-top:12px">
          <h3>리뷰 남기기</h3>
          <div class="review-form">
            <div class="row">
              <input class="nick" v-model="reviewForm.nickname" placeholder="닉네임" />
              <select class="rating-select" v-model.number="reviewForm.rating">
                <option v-for="n in 5" :key="n" :value="n">{{ n }}점</option>
              </select>
              <input class="review-text" v-model="reviewForm.text" placeholder="한줄평을 입력하세요 (최대 200자)" maxlength="200" />
              <button class="btn btn-primary submit-btn" type="button" @click="submitReview">등록</button>
            </div>
            <div class="row errors-row">
              <div class="errors">
                <div class="error" v-if="reviewErrors.nickname">{{ reviewErrors.nickname }}</div>
                <div class="error" v-if="reviewErrors.text">{{ reviewErrors.text }}</div>
              </div>
            </div>
          </div>

          <div class="review-list" style="margin-top:12px">
            <div v-if="reviews.length === 0" class="muted">아직 등록된 리뷰가 없습니다.</div>
            <div v-for="r in reviews" :key="r.id" class="review-item">
              <div class="rev-head">
                <strong>{{ r.nickname }}</strong>
                <span class="rating">{{ r.rating }}점</span>
                <span class="time">{{ new Date(r.createdAt).toISOString().slice(0,10).replace(/-/g,'.') }}</span>
              </div>
              <div class="rev-text">{{ r.text }}</div>
            </div>
          </div>
        </div>

        <div v-show="activeTab === 'map'" class="media map-view">
          <div>
            <div class="map-box" ref="mapContainer" style="height:360px;border-radius:12px;overflow:hidden;border:1px solid var(--color-border);"></div>
            <div class="info-box" style="margin-top:10px;">
              <p><strong>주소:</strong> {{ item.address || '정보없음' }}</p>
              <p v-if="item.tel"><strong>전화:</strong> <a :href="`tel:${item.tel}`">{{ item.tel }}</a></p>
              <p v-else><strong>전화:</strong> 정보없음</p>
              <div style="margin-top:8px;">
                <a v-if="directionsUrl" :href="directionsUrl" target="_blank" rel="noopener" class="btn">가는 방법</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="actions" style="margin-top:16px;display:flex;justify-content:space-between;align-items:center;gap:8px;">
        <button class="btn" @click="backToList">목록으로</button>
        <div class="right">
          <a v-if="item.raw && item.raw.homepage" :href="item.raw.homepage" target="_blank" class="btn">홈페이지</a>
        </div>
      </div>
    </div>

    <p v-else class="empty">업체 정보를 찾을 수 없습니다.</p>
  </main>
</template>

<style scoped>
.detail { padding: 20px }
.meta { color: var(--color-ink-muted); margin-bottom: 8px }
.carousel { display:flex; align-items:center; justify-content:center }
.no-image { color:var(--color-ink-muted) }

.detail-tabs { display:flex; gap:8px; margin:12px 0 }
.tab { padding:8px 12px; border-radius:8px; border:1px solid var(--color-border); background:var(--color-surface); cursor:pointer }
.tab.active { background:var(--color-primary); color:#fff; border-color:var(--color-primary) }
.detail-media { display:flex; gap:12px; flex-direction:column }
.map-view { width:100% }

/* 고정 사이즈 이미지 래퍼: 화살표 유무와 상관없이 이미지 영역이 변하지 않도록 함 */
.image-wrapper { display: inline-flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 8px; position: relative; max-width: 100%; max-width: 640px; max-height: 360px; }
.detail-image { width: 100%; height: auto; object-fit: cover; border-radius: 8px; display: block; max-height: 360px }
.carousel-arrow { width: 40px; height: 40px; min-width:40px; display:flex; align-items:center; justify-content:center; position: absolute; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.85); border-radius: 999px; border: 1px solid rgba(0,0,0,0.06); cursor: pointer }
.carousel-arrow.left { left: 8px }
.carousel-arrow.right { right: 8px }

.info-view { width:100%; }
.info-box { background: var(--color-surface); border:1px solid var(--color-border); padding:12px; border-radius:8px }

.description-box { background: var(--color-surface); border:1px solid var(--color-border); padding:12px; border-radius:8px }
.description-box .muted { color: var(--color-ink-muted) }

.reviews .review-form { display:flex; flex-direction:column; gap:12px }
.reviews .review-form .row { display:flex; gap:8px; align-items:center }
.reviews .review-form .row .nick { width:200px; padding:8px; border:1px solid var(--color-border); border-radius:6px }
.reviews .review-form .row .rating-select { width:120px; padding:8px; border:1px solid var(--color-border); border-radius:6px }
.reviews .review-form .row .review-text { flex:1 1 auto; padding:10px; border:1px solid var(--color-border); border-radius:6px; height:38px }
.reviews .review-form .row .submit-btn { margin-left:8px; white-space:nowrap }
.errors-row { display:flex; padding-top:6px }
.reviews .review-form .actions-row { display:flex; justify-content:space-between; align-items:center }
.reviews .review-list { margin-top:10px }
.review-item { background: var(--color-surface); border:1px solid var(--color-border); padding:10px; border-radius:8px; margin-bottom:8px }
.rev-head { display:flex; gap:8px; align-items:center }
.rating { margin-left:8px; color:var(--color-primary-dark); font-weight:700 }
.time { margin-left:auto; font-size:0.8rem; color:var(--color-ink-muted) }
.rev-text { margin-top:6px }
</style>
