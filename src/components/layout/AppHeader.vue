<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { REGIONS } from '../../data/regions.js'

const route = useRoute()
const isMapActive = computed(() => route.name === 'map')
const isBoardActive = computed(() => route.name && String(route.name).startsWith('board'))

const regionToCategoryKey = {
  attractions: 'tourist',
  leisure: 'leports',
  culture: 'culture',
  shopping: 'shopping',
  accommodation: 'lodging',
  events: 'festival'
}

</script>

<template>
  <header class="header">
    <div class="header-inner">
      <RouterLink to="/" class="logo">SSAFY SPOT</RouterLink>

      <nav class="region-tabs">
        <RouterLink
  v-for="region in REGIONS"
  :key="region.code"
  :to="region.active
    ? (regionToCategoryKey[region.code]
      ? { path: '/places', query: { category: regionToCategoryKey[region.code] } }
      : '/board')
    : '#'"
  class="region-tab"
  :class="{ active: region.active && (route.path.startsWith('/places') ? route.query.category === regionToCategoryKey[region.code] : (route.name && String(route.name).startsWith('board'))), disabled: !region.active }"
>
  {{ region.name }}
</RouterLink>


        <RouterLink to="/map" class="region-tab" :class="{ active: isMapActive }">
          지도
        </RouterLink>
        <RouterLink to="/board" class="region-tab" :class="{ active: isBoardActive }">
          게시글
        </RouterLink>
      </nav>

      <button class="search-icon" aria-label="검색" type="button">⌕</button>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.header-inner {
  max-width: 960px;
  margin: 0 auto;
  height: var(--header-height);
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 0 20px;
}

.logo {
  font-family: 'Comic Sans MS', 'Trebuchet MS', cursive;
  font-size: 1.5rem;
  font-weight: 900;
  letter-spacing: -0.01em;
  color: var(--color-primary-dark);
  white-space: nowrap;
}

.region-tabs {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  flex: 1;
}

.region-tab {
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  font-size: 0.88rem;
  font-weight: 600;
  color: #16a34a;
  background: #dcfce7;
  white-space: nowrap;
  transition: background 120ms ease, transform 80ms ease;
}

.region-tab.disabled {
  color: #C4C9BC;
  background: transparent;
  cursor: not-allowed;
  pointer-events: none;
}

.region-tab.active {
  color: #16a34a;            /* 초록색 글자 */
  background: #dcfce7;       /* 연두빛 배경(네모) */
  border-radius: var(--radius-sm);
  box-shadow: 0 0 0 3px rgba(22,163,74,0.06); /* 선택 강조(선택 사항) */
}




.search-icon {
  border: none;
  background: transparent;
  font-size: 1.2rem;
  color: var(--color-ink-muted);
}
</style>