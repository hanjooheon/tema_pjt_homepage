<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getAllItems } from '../services/dataService.js' // 데이터 서비스 임포트

const mapContainer = ref(null)
const errorMessage = ref('')
const places = ref([])
const currentLocation = ref(null)
const selectedCategoryKeys = ref([])
const selectedPlaceId = ref(null)

let map = null
let markersLayer = null
let userMarker = null
let accuracyCircle = null
let watchId = null

const categoryMeta = [
  { key: 'tourist', label: '관광지', color: '#2ec7a9', icon: '🏛️' },
  { key: 'leports', label: '레포츠', color: '#4dabf7', icon: '🚴' },
  { key: 'culture', label: '문화시설', color: '#845ef7', icon: '🎭' },
  { key: 'shopping', label: '쇼핑', color: '#ff922b', icon: '🛍️' },
  { key: 'lodging', label: '숙박', color: '#15aabf', icon: '🏨' },
  { key: 'festival', label: '축제공연행사', color: '#ff8787', icon: '🎉' }
]

const categoryMap = Object.fromEntries(categoryMeta.map((category) => [category.key, category]))

const visiblePlaces = computed(() =>
  places.value.filter((place) => selectedCategoryKeys.value.includes(place.categoryKey))
)

const sortedPlaces = computed(() => {
  if (!currentLocation.value) {
    return visiblePlaces.value
  }

  return [...visiblePlaces.value].sort((left, right) => {
    const leftDistance = distanceKm(left.lat, left.lng, currentLocation.value.lat, currentLocation.value.lng)
    const rightDistance = distanceKm(right.lat, right.lng, currentLocation.value.lat, currentLocation.value.lng)
    return leftDistance - rightDistance
  })
})

function distanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (value) => (value * Math.PI) / 180
  const earthRadiusKm = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return earthRadiusKm * c
}

function formatDistance(place) {
  if (!currentLocation.value) {
    return '거리 미측정'
  }

  const distance = distanceKm(place.lat, place.lng, currentLocation.value.lat, currentLocation.value.lng)
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`
  }
  return `${distance.toFixed(1)}km`
}

function toggleCategory(categoryKey) {
  if (selectedCategoryKeys.value.includes(categoryKey)) {
    selectedCategoryKeys.value = selectedCategoryKeys.value.filter((item) => item !== categoryKey)
  } else {
    selectedCategoryKeys.value = [...selectedCategoryKeys.value, categoryKey]
  }
}

function selectPlace(placeId) {
  selectedPlaceId.value = placeId
  const targetPlace = places.value.find((place) => place.id === placeId)
  if (!targetPlace || !map) {
    return
  }

  map.flyTo([targetPlace.lat, targetPlace.lng], 15, { duration: 1 })
}

function ensureLeaflet() {
  return new Promise((resolve, reject) => {
    if (window.L) {
      resolve(window.L)
      return
    }

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => resolve(window.L)
    script.onerror = () => reject(new Error('Leaflet 로딩 실패'))
    document.head.appendChild(script)
  })
}

function initMap(L) {
  if (!mapContainer.value) {
    return
  }

  map = L.map(mapContainer.value, {
    zoomControl: true,
    scrollWheelZoom: true
  }).setView([37.5665, 126.978], 12)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map)

  markersLayer = L.layerGroup().addTo(map)
  renderMarkers(L)
}

function renderMarkers(L) {
  if (!markersLayer || !L) {
    return
  }

  markersLayer.clearLayers()

  visiblePlaces.value.forEach((place) => {
    const meta = categoryMap[place.categoryKey]
    if (!meta || !place.lat || !place.lng) {
      return
    }

    const icon = L.divIcon({
      html: `<div style="background:${meta.color}; width:32px; height:32px; border-radius:999px; display:flex; align-items:center; justify-content:center; color:white; border:2px solid white; box-shadow:0 3px 8px rgba(0,0,0,.25); font-size:16px;">${meta.icon}</div>`,
      className: 'custom-marker-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    })

    const marker = L.marker([place.lat, place.lng], { icon }).addTo(markersLayer)
    marker.bindPopup(`<strong>${place.name}</strong><br>${place.address}`)
    marker.on('click', () => {
      selectedPlaceId.value = place.id
    })
  })
}

function updateUserLocation(L, coords) {
  if (!map) {
    return
  }

  currentLocation.value = { lat: coords.latitude, lng: coords.longitude }

  if (!userMarker) {
    userMarker = L.circleMarker([coords.latitude, coords.longitude], {
      radius: 8,
      color: '#1e88e5',
      fillColor: '#1e88e5',
      fillOpacity: 0.95
    }).addTo(map)

    accuracyCircle = L.circle([coords.latitude, coords.longitude], {
      radius: coords.accuracy || 80,
      color: '#64b5f6',
      fillColor: '#64b5f6',
      fillOpacity: 0.2
    }).addTo(map)

    map.setView([coords.latitude, coords.longitude], 14)
  } else {
    userMarker.setLatLng([coords.latitude, coords.longitude])
    if (accuracyCircle) {
      accuracyCircle.setLatLng([coords.latitude, coords.longitude])
      accuracyCircle.setRadius(coords.accuracy || 80)
    }
  }
}

// 수정 반영: async/await 패턴 및 서비스 모듈 활용
async function loadPlaces() {
  try {
    const items = await getAllItems()
    console.log('[DATA] loaded items count =', items.length)
    console.log('[DATA] sample item =', items[0])

    // 필터: 좌표가 존재하고, UI에 정의된 카테고리만 매핑하여 저장
    places.value = items.filter((p) => {
      const ok = p && p.lat && p.lng && categoryMap[p.categoryKey]
      if (!ok) console.debug('[DATA] filtered out', { id: p?.id, name: p?.name, lat: p?.lat, lng: p?.lng, categoryKey: p?.categoryKey })
      return ok
    })

    selectedCategoryKeys.value = categoryMeta.map((category) => category.key)

    // 맵이 이미 초기화되어 있으면 마커 재렌더링
    if (window.L && map) {
      renderMarkers(window.L)
    }
  } catch (e) {
    console.error(e)
    errorMessage.value = '지도 데이터를 불러오지 못했습니다.'
  }
}

onMounted(async () => {
  try {
    const L = await ensureLeaflet()
    initMap(L)
    await loadPlaces()

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => updateUserLocation(L, position.coords),
        () => {
          errorMessage.value = '현재 위치를 가져오지 못해 기본 중심으로 안내합니다.'
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 8000 }
      )
    } else {
      errorMessage.value = '이 브라우저는 위치 서비스를 지원하지 않습니다.'
    }
  } catch (error) {
    console.error(error)
    errorMessage.value = '지도를 불러오지 못했습니다.'
  }
})

watch(selectedCategoryKeys, () => {
  if (window.L && map) {
    renderMarkers(window.L)
  }
})

onBeforeUnmount(() => {
  if (watchId !== null && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId)
  }
  if (map) {
    map.remove()
  }
})
</script>

<template>
  <section class="map-page">
    <div class="map-toolbar">
      <div>
        <p class="eyebrow">서울 지도</p>
        <h1>카테고리별 업체를 지도에서 바로 확인하세요</h1>
        <p class="summary">
          내 위치 기준으로 가까운 순으로 정렬하고, 원하는 카테고리만 골라볼 수 있습니다.
        </p>
      </div>

      <div class="filter-chips">
        <button
          v-for="category in categoryMeta"
          :key="category.key"
          class="filter-chip"
          :class="{ active: selectedCategoryKeys.includes(category.key) }"
          type="button"
          @click="toggleCategory(category.key)"
        >
          <span class="chip-dot" :style="{ backgroundColor: category.color }"></span>
          {{ category.label }}
        </button>
      </div>
    </div>

    <div class="map-layout">
      <aside class="place-list">
        <div class="list-header">
          <div>
            <p class="eyebrow">근처 목록</p>
            <h2>가까운 순</h2>
          </div>
          <span class="list-count">{{ sortedPlaces.length }}개</span>
        </div>

        <ul v-if="sortedPlaces.length" class="place-items">
          <li
            v-for="place in sortedPlaces"
            :key="place.id"
            class="place-item"
            :class="{ active: selectedPlaceId === place.id }"
            @click="selectPlace(place.id)"
          >
            <div class="place-main">
              <strong>{{ place.name }}</strong>
              <p>{{ place.address }}</p>
            </div>
            <div class="place-meta">
              <span class="place-badge">{{ categoryMap[place.categoryKey]?.label }}</span>
              <span class="distance">{{ formatDistance(place) }}</span>
            </div>
          </li>
        </ul>

        <div v-else class="empty-state">선택한 카테고리에 맞는 장소가 없습니다.</div>
      </aside>

      <div class="map-panel">
        <div ref="mapContainer" class="map-container"></div>
        <div class="map-status">{{ errorMessage || '현재 위치는 파란 점으로 표시됩니다.' }}</div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.map-page {
  padding: 24px 20px 40px;
  background: linear-gradient(180deg, #f8fbff 0%, #f5f7fb 100%);
  min-height: calc(100vh - 140px);
}

.map-toolbar {
  max-width: 1200px;
  margin: 0 auto 20px;
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-start;
}

.eyebrow {
  margin: 0 0 6px;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--color-primary-dark);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

h1 {
  margin: 0;
  font-size: 1.45rem;
  color: var(--color-ink);
}

.summary {
  margin: 8px 0 0;
  color: var(--color-ink-muted);
  line-height: 1.6;
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.filter-chip {
  border: 1px solid var(--color-border);
  background: white;
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 0.9rem;
  color: var(--color-ink-muted);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.filter-chip.active {
  border-color: var(--color-primary-dark);
  background: var(--color-primary-soft);
  color: var(--color-primary-dark);
}

.chip-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.map-layout {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(280px, 360px) 1fr;
  gap: 18px;
  min-height: 640px;
}

.place-list {
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 18px;
  box-shadow: 0 10px 30px rgba(31, 41, 55, 0.06);
  display: flex;
  flex-direction: column;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.list-header h2 {
  margin: 0;
  font-size: 1rem;
}

.list-count {
  background: var(--color-primary-soft);
  color: var(--color-primary-dark);
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
}

.place-items {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: auto;
}

.place-item {
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 12px;
  cursor: pointer;
  background: #fff;
}

.place-item.active {
  border-color: var(--color-primary-dark);
  box-shadow: 0 10px 20px rgba(58, 95, 129, 0.12);
}

.place-main strong {
  display: block;
  font-size: 0.95rem;
  margin-bottom: 4px;
  color: var(--color-ink);
}

.place-main p {
  margin: 0;
  font-size: 0.84rem;
  color: var(--color-ink-muted);
  line-height: 1.5;
}

.place-meta {
  margin-top: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.place-badge {
  font-size: 0.72rem;
  padding: 4px 8px;
  border-radius: 999px;
  background: #eef3ff;
  color: #2d4f8b;
}

.distance {
  font-size: 0.8rem;
  color: var(--color-primary-dark);
  font-weight: 700;
}

.empty-state {
  padding: 20px 0;
  color: var(--color-ink-muted);
  font-size: 0.92rem;
}

.map-panel {
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  box-shadow: 0 12px 32px rgba(31, 41, 55, 0.08);
  background: white;
}

.map-container {
  width: 100%;
  height: 100%;
  min-height: 620px;
}

.map-status {
  position: absolute;
  left: 16px;
  bottom: 16px;
  z-index: 500;
  background: rgba(255, 255, 255, 0.92);
  padding: 10px 12px;
  border-radius: 999px;
  font-size: 0.85rem;
  color: var(--color-ink-muted);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.12);
}

.custom-marker-icon {
  background: transparent;
  border: none;
}

@media (max-width: 900px) {
  .map-toolbar {
    flex-direction: column;
  }

  .filter-chips {
    justify-content: flex-start;
  }

  .map-layout {
    grid-template-columns: 1fr;
  }

  .place-list {
    order: 2;
    position: sticky;
    bottom: 0;
    z-index: 20;
    margin-top: 10px;
    border-radius: 18px 18px 0 0;
  }

  .map-panel {
    order: 1;
    min-height: 460px;
  }
}

@media (max-width: 640px) {
  .map-page {
    padding: 16px 12px 30px;
  }

  .place-list {
    padding: 14px;
  }

  .map-container {
    min-height: 480px;
  }

  .map-status {
    left: 10px;
    right: 10px;
    bottom: 10px;
    border-radius: 14px;
    text-align: center;
  }
}
</style>0