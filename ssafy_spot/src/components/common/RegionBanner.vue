<script setup>
import { RouterLink } from 'vue-router'
import { REGIONS } from '../../data/regions.js'
</script>

<template>
  <section class="hero card">
    <h1>SSAFY SPOT</h1>
    <p>현지 SSAFY생이 추천하는 우리 동네 점심 맛집</p>
  </section>

  <div class="region-grid">
    <div v-for="region in REGIONS" :key="region.code" class="region-card card" :class="{ inactive: !region.active }">
      <div class="thumb" aria-hidden="true">{{ region.emoji }}</div>
      <p class="name">{{ region.name }}</p>
      <RouterLink v-if="region.active" to="/board" class="link">바로가기 &gt;</RouterLink>
      <span v-else class="link muted">준비중</span>
    </div>
  </div>
</template>

<style scoped>
.hero {
  padding: 40px 24px;
  text-align: center;
  background: var(--color-primary-soft);
  border-color: var(--color-primary-soft);
  margin-bottom: 24px;
}

.hero h1 {
  font-size: 2.8rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--color-primary-dark);
  font-family: 'Comic Sans MS', 'Trebuchet MS', cursive;
  margin-bottom: 10px;
}

.hero p {
  margin: 0;
  color: var(--color-ink-muted);
}

.region-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 14px;
}

.region-card {
  padding: 20px 12px;
  text-align: center;
}

.region-card.inactive {
  opacity: 0.55;
}

.thumb {
  font-size: 1.8rem;
  margin-bottom: 8px;
}

.name {
  font-weight: 700;
  margin: 0 0 6px;
}

.link {
  font-size: 0.82rem;
  color: var(--color-primary);
  font-weight: 600;
}

.link.muted {
  color: var(--color-ink-muted);
  font-weight: 500;
}
</style>
