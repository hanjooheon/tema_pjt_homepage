<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PostForm from '../components/board/PostForm.vue'
import { createPost, getPendingPassword, getPost, updatePost } from '../composables/usePosts.js'
import { CURRENT_REGION } from '../data/regions.js'

const props = defineProps({ id: { type: String, default: null } })
const router = useRouter()

const isEdit = computed(() => !!props.id)
const initial = ref({ title: '', content: '', nickname: '', category: '' })

onMounted(() => {
  if (isEdit.value) {
    const existing = getPost(props.id)
    if (existing) {
      initial.value = {
        title: existing.title,
        content: existing.content,
        nickname: existing.nickname ?? '',
        category: existing.category ?? ''
      }
    } else {
      router.replace({ name: 'board-list' })
    }
  }
})

function handleSubmit(payload) {
  if (isEdit.value) {
    const result = updatePost(props.id, payload, getPendingPassword())
    if (!result.ok) {
      alert(result.error)
      return
    }
    router.push({ name: 'board-detail', params: { id: props.id } })
  } else {
    const created = createPost(payload)
    router.push({ name: 'board-detail', params: { id: created.id } })
  }
}

function handleCancel() {
  router.back()
}
</script>

<template>
  <main class="page">
    <p class="breadcrumb">
      홈 &gt; {{ CURRENT_REGION.name }} 게시판 &gt; {{ isEdit ? '글 수정' : '글쓰기' }}
    </p>
    <PostForm :is-edit="isEdit" :initial="initial" @submit="handleSubmit" @cancel="handleCancel" />
  </main>
</template>