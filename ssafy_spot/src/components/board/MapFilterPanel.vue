<script setup>
// 담당(WBS): 김유민 - "지도 시각화 및 카테고리, 거리 기반 추천 필터 구현" (Should/Could have)
//
// 이 컴포넌트는 아직 어떤 라우트/화면에도 연결되지 않은 "시작점"입니다.
// 구현 아이디어:
//  1) dataService.getAllItems() 로 카테고리별 항목을 불러온다.
//  2) navigator.geolocation.getCurrentPosition() 으로 현재 위치를 구한다.
//  3) lat/lng 하버사인(haversine) 거리 계산 후 가까운 순으로 정렬한다.
//  4) 카테고리 체크박스로 필터링한다.
//  5) 지도 표시가 필요하면 Leaflet.js 등을 추가 설치해 핀으로 시각화한다.
//     (RFP 참고2: Leaflet.js 또는 Kakao Maps API 사용 가능)
//
// 완성되면 router/index.js 에 라우트를 추가하고, HomeView 또는 BoardListView 에서 진입 링크를 연결하세요.

import { onMounted, ref } from 'vue'
import { getAllItems } from '../../services/dataService.js'

const items = ref([])
const loading = ref(true)

onMounted(async () => {
  items.value = await getAllItems()
  loading.value = false
})
</script>

<template>
  <div class="map-filter card">
    <h2>카테고리 · 거리 기반 추천 (준비 중)</h2>
    <p v-if="loading">불러오는 중...</p>
    <ul v-else>
      <li v-for="item in items" :key="item.id" class="pin">
        {{ item.name }} <span class="category">[{{ item.category }}]</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.map-filter {
  padding: 20px;
}

.category {
  color: var(--color-ink-muted);
  font-size: 0.8rem;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  padding: 6px 0;
}
</style>
