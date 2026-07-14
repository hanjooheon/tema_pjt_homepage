<script setup>
import { RouterLink } from 'vue-router'
import { REGIONS } from '../../data/regions.js'
</script>

<template>
  <header class="header">
    <div class="header-inner">
      <RouterLink to="/" class="logo">LocalHub</RouterLink>

      <nav class="region-tabs">
        <RouterLink
          v-for="region in REGIONS"
          :key="region.code"
          :to="region.active ? '/board' : '#'"
          class="region-tab"
          :class="{ active: region.active, disabled: !region.active }"
        >
          {{ region.name }}
        </RouterLink>
      </nav>

      <!-- TODO(선택 기능 - 게시글 검색 담당자): 헤더 검색 아이콘을 눌렀을 때
           /board 로 이동 + 검색어 쿼리스트링 전달 등으로 확장 가능 -->
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
  font-family: var(--font-display);
  font-size: 1.4rem;
  font-weight: 700;
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
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--color-ink-muted);
  white-space: nowrap;
}

.region-tab.active {
  color: var(--color-primary-dark);
  background: var(--color-primary-soft);
}

.region-tab.disabled {
  color: #C4C9BC;
  cursor: not-allowed;
  pointer-events: none;
}

.search-icon {
  border: none;
  background: transparent;
  font-size: 1.2rem;
  color: var(--color-ink-muted);
}
</style>
