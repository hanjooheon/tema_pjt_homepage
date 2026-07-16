<script setup>
import AppHeader from './components/layout/AppHeader.vue'
import AppFooter from './components/layout/AppFooter.vue'
import ChatbotWidget from './components/chatbot/ChatbotWidget.vue'
</script>

<template>
  <AppHeader />
  <router-view />
  <AppFooter />

  <!-- 챗봇은 모든 화면에서 우측 하단에 떠 있어야 하므로 App 최상단에 배치 -->
  <ChatbotWidget />
</template>
