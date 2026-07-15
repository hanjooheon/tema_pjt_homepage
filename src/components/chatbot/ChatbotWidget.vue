<script setup>
import { nextTick, ref, watch } from 'vue'
import { REGIONS } from '../../data/regions.js'
import { useChatbot } from '../../composables/useChatbot.js'
import ChatMessage from './ChatMessage.vue'

const isOpen = ref(false)
const input = ref('')
const scrollArea = ref(null)
const quickRegions = REGIONS.map((region) => ({
  code: region.code,
  label: region.name
}))

const { messages, isLoading, sendMessage } = useChatbot()

async function handleSend(text = input.value) {
  const value = text?.trim()
  if (!value) return
  input.value = ''
  await sendMessage(value)
}

function selectRegion(regionName) {
  handleSend(`${regionName}에 대해 알려줘`)
}

// 새 메시지가 오면 스크롤을 맨 아래로
watch(messages, async () => {
  await nextTick()
  if (scrollArea.value) {
    scrollArea.value.scrollTop = scrollArea.value.scrollHeight
  }
}, { deep: true })
</script>

<template>
  <!-- 접힌 상태: 플로팅 버튼 -->
  <button v-if="!isOpen" class="fab" type="button" @click="isOpen = true" aria-label="챗봇 열기">
    💬
    <span class="fab-label">챗봇</span>
  </button>

  <!-- 펼친 상태: 대화창 (모바일에서는 CSS로 전체 화면 처리) -->
  <div v-else class="chat-window card">
    <header class="chat-header">
      <span>LocalHub 챗봇</span>
      <button type="button" class="close-btn" @click="isOpen = false" aria-label="닫기">✕</button>
    </header>

    <div ref="scrollArea" class="chat-body">
      <ChatMessage v-if="messages.length > 0" :role="messages[0].role" :content="messages[0].content" />
      <div v-if="messages.length === 1" class="empty-state">
        <p>어떤 지역이 궁금하신가요?</p>
        <div class="region-buttons">
          <button
            v-for="region in quickRegions"
            :key="region.code"
            type="button"
            class="region-chip"
            @click="selectRegion(region.label)"
          >
            {{ region.label }}
          </button>
        </div>
      </div>
      <ChatMessage v-for="(m, idx) in messages.slice(1)" :key="idx" :role="m.role" :content="m.content" />
      <div v-if="isLoading" class="typing">답변을 준비 중이에요...</div>
    </div>

    <form class="chat-input" @submit.prevent="handleSend">
      <input v-model="input" type="text" placeholder="메시지를 입력하세요" :disabled="isLoading" />
      <button type="submit" class="btn btn-primary" :disabled="isLoading">전송</button>
    </form>
  </div>
</template>

<style scoped>
.fab {
  position: fixed;
  right: 20px;
  bottom: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: var(--color-primary);
  color: #fff;
  font-size: 1.3rem;
  box-shadow: var(--shadow-float);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 40;
}

.fab-label {
  font-size: 0.62rem;
  font-weight: 700;
}

.chat-window {
  position: fixed;
  right: 20px;
  bottom: 20px;
  width: 320px;
  height: 440px;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-float);
  z-index: 40;
  overflow: hidden;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--color-primary);
  color: #fff;
  font-weight: 700;
  font-size: 0.92rem;
}

.close-btn {
  border: none;
  background: transparent;
  color: #fff;
  font-size: 1rem;
}

.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
}

.typing {
  font-size: 0.78rem;
  color: var(--color-ink-muted);
}

.empty-state {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 6px 2px 0;
}

.empty-state p {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-primary-dark);
}

.region-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.region-chip {
  border: 1px solid var(--color-primary-soft);
  background: #fff;
  color: var(--color-primary);
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 0.75rem;
  cursor: pointer;
}

.chat-input {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding: 10px;
  border-top: 1px solid var(--color-border);
}

.chat-input input {
  flex: 1;
  min-width: 0;
  padding: 8px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.chat-input button {
  flex-shrink: 0;
}

/* RFP 참고4: 모바일에서는 전체 화면으로 표시 */
@media (max-width: 480px) {
  .chat-window {
    right: 0;
    bottom: 0;
    width: 100vw;
    height: 100vh;
    border-radius: 0;
  }
}
</style>
