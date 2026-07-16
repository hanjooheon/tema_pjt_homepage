<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getItemById } from '../services/dataService.js'

const route = useRoute()
const router = useRouter()
const item = ref(null)
const loading = ref(true)
const mapContainer = ref(null)
let map = null
let marker = null

const images = computed(() => {
  if (!item.value) return []
  const raw = item.value.raw || {}
  const imgs = []
  if (raw.firstimage) imgs.push(raw.firstimage)
  if (item.value.image) imgs.push(item.value.image)
  if (raw.image) imgs.push(raw.image)
  return [...new Set(imgs.filter(Boolean))]
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
  try {
    const L = await ensureLeaflet()
    initMap(L)
  } catch (e) {
    console.error(e)
  }
}

function backToList() {
  const category = item.value?.categoryKey || route.query.category
  router.push({ name: 'places-list', query: { category } })
}

onMounted(load)
</script>

<template>
  <main class="page">
    <p class="breadcrumb">홈 &gt; 카테고리 &gt; 업체 상세</p>

    <div v-if="loading">로딩 중...</div>

    <div v-else-if="item" class="detail card">
      <h1>{{ item.name }}</h1>
      <div class="media">
        <div v-if="images.length" class="carousel">
            <div class="image-wrapper" :style="wrapperStyle">
              <button v-if="images.length > 1" class="btn carousel-arrow left" @click="prevImg">◀</button>
              <img :src="images[imgIndex]" alt="사진" class="detail-image" @load="onImageLoad" />
              <button v-if="images.length > 1" class="btn carousel-arrow right" @click="nextImg">▶</button>
            </div>
          </div>
        <div v-else class="no-image">이미지 없음</div>
      </div>

      <section class="info" style="margin-top:12px;">
        <p><strong>주소:</strong> {{ item.address || '정보없음' }}</p>
        <p v-if="item.tel"><strong>전화:</strong> <a :href="`tel:${item.tel}`">{{ item.tel }}</a></p>
        <p v-else><strong>전화:</strong> 정보없음</p>
      </section>

      <div class="map-box" ref="mapContainer" style="height:320px;margin-top:12px;border-radius:12px;overflow:hidden;border:1px solid var(--color-border);"></div>

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

/* 고정 사이즈 이미지 래퍼: 화살표 유무와 상관없이 이미지 영역이 변하지 않도록 함 */
.image-wrapper { display: inline-flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 8px; position: relative; max-width: 100%; }
.detail-image { width: 100%; height: 100%; object-fit: contain; border-radius: 8px; display: block }
.carousel-arrow { width: 40px; height: 40px; min-width:40px; display:flex; align-items:center; justify-content:center; position: absolute; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.85); border-radius: 999px; border: 1px solid rgba(0,0,0,0.06); cursor: pointer }
.carousel-arrow.left { left: 8px }
.carousel-arrow.right { right: 8px }
</style>
