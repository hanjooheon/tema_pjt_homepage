<script setup>
defineProps({
  role: { type: String, required: true }, // 'user' | 'assistant'
  content: { type: String, required: true }
})
</script>

<template>
  <div class="msg-row" :class="role">
    <div class="bubble">{{ content }}</div>
  </div>
</template>

<style scoped>
.msg-row {
  display: flex;
  margin-bottom: 10px;
}

.msg-row.user {
  justify-content: flex-end;
}

.bubble {
  max-width: 78%;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  font-size: 0.88rem;
  line-height: 1.4;
  white-space: pre-wrap;
}

.msg-row.assistant .bubble {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-top-left-radius: 2px;
}

.msg-row.user .bubble {
  background: var(--color-primary);
  color: #fff;
  border-top-right-radius: 2px;
}
</style>
