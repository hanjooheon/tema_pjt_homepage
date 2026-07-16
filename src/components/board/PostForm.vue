<script setup>
import { reactive, watch, ref, computed } from 'vue'
import { isBlank, isValidPassword } from '../../utils/validators.js'
import { getItemsByCategory } from '../../services/dataService.js'

const props = defineProps({
  isEdit: { type: Boolean, default: false },
  initial: {
    type: Object,
    default: () => ({ title: '', content: '' })
  }
})

const emit = defineEmits(['submit', 'cancel'])

const form = reactive({ title: '', content: '', password: '', category: '', placeId: '', placeName: '' })
const errors = reactive({ title: '', content: '', password: '', category: '' })

const CATEGORIES = [
  { key: 'tourist', label: '관광지' },
  { key: 'leports', label: '레포츠' },
  { key: 'culture', label: '문화시설' },
  { key: 'shopping', label: '쇼핑' },
  { key: 'lodging', label: '숙박' },
  { key: 'festival', label: '축제공연행사' }
]

const places = ref([])
const placeQuery = ref('')

watch(
  () => form.category,
  async (val) => {
    placeQuery.value = ''
    form.placeId = ''
    form.placeName = ''
    places.value = []
    if (val) {
      try {
        places.value = await getItemsByCategory(val)
      } catch (e) {
        console.error('places load error', e)
        places.value = []
      }
    }
  }
)

const suggestions = computed(() => {
  const q = (placeQuery.value || '').trim().toLowerCase()
  if (!q) return places.value
  return places.value.filter((p) => (p.name || '').toLowerCase().includes(q))
})

watch(
  () => props.initial,
  (val) => {
    form.title = val?.title ?? ''
    form.content = val?.content ?? ''
    form.category = val?.category ?? ''
  },
  { immediate: true }
)

function validate() {
  errors.title = isBlank(form.title) ? '제목을 입력해 주세요.' : ''
  errors.content = isBlank(form.content) ? '내용을 입력해 주세요.' : ''
  errors.category = isBlank(form.category) ? '카테고리를 선택해 주세요.' : ''
  // 수정 모드에서는 비밀번호를 다시 받지 않음 (상세 화면에서 이미 확인함)
  errors.password = !props.isEdit && !isValidPassword(form.password) ? '숫자 4자리 이상 입력해 주세요.' : ''
  return !errors.title && !errors.content && !errors.password && !errors.category
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', {
    title: form.title.trim(),
    content: form.content.trim(),
    password: form.password,
    category: form.category,
    placeId: form.placeId || '',
    placeName: form.placeName || ''
  })
}

function toggleCategory(key) {
  form.category = form.category === key ? '' : key
}

function selectPlace(p) {
  form.placeId = p.id
  form.placeName = p.name
  placeQuery.value = p.name
}

function clearPlace() {
  form.placeId = ''
  form.placeName = ''
  placeQuery.value = ''
}
</script>

<template>
  <form class="post-form" @submit.prevent="handleSubmit">
    <div class="field">
      <label for="title">제목</label>
      <input id="title" v-model="form.title" type="text" placeholder="제목을 입력하세요" />
      <p class="error" v-if="errors.title">{{ errors.title }}</p>
    </div>

    <div class="field">
      <label>카테고리</label>
      <div class="category-list">
        <label v-for="c in CATEGORIES" :key="c.key" class="category-item">
          <input
            type="checkbox"
            :checked="form.category === c.key"
            @change="() => toggleCategory(c.key)"
          />
          <span class="cat-label">{{ c.label }}</span>
        </label>
      </div>
      <p class="error" v-if="errors.category">{{ errors.category }}</p>
    </div>

    <div class="field" v-if="form.category">
      <label for="place-search">업체 선택 (선택적)</label>
      <input id="place-search" v-model="placeQuery" type="text" placeholder="업체 검색 또는 선택" />
      <div class="suggestions" v-if="suggestions.length && !form.placeId">
        <button type="button" class="suggestion" v-for="p in suggestions" :key="p.id" @click="() => selectPlace(p)">
          {{ p.name }}
        </button>
      </div>
      <div class="selected-place" v-if="form.placeId">
        선택된 업체: <strong>{{ form.placeName }}</strong>
        <button type="button" class="btn" @click="clearPlace">해제</button>
      </div>
    </div>

    <div class="field">
      <label for="content">내용</label>
      <textarea id="content" v-model="form.content" placeholder="내용을 입력하세요" />
      <p class="error" v-if="errors.content">{{ errors.content }}</p>
    </div>

    <div class="field" v-if="!isEdit">
      <label for="password">수정용 비밀번호</label>
      <input id="password" v-model="form.password" type="password" placeholder="숫자 4자리 이상" />
      <p class="hint">※ 수정·삭제 시 동일하게 입력해야 함</p>
      <p class="error" v-if="errors.password">{{ errors.password }}</p>
    </div>

    <div class="actions">
      <button type="button" class="btn" @click="emit('cancel')">취소</button>
      <button type="submit" class="btn btn-primary">등록</button>
    </div>
  </form>
</template>

<style scoped>
.post-form {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 24px;
}

.hint {
  font-size: 0.78rem;
  color: var(--color-ink-muted);
  margin: 4px 0 0;
}

.category-list { display:flex; gap:8px; flex-wrap:wrap; margin-top:8px; justify-content: space-between; padding-left: 0; }
.category-item { display:flex; align-items:center; gap:6px; font-size:0.95rem; flex: 1 1 0; justify-content: center }
.category-item:first-child { justify-content: flex-start; padding-left: 0; margin-left: 0; }
.category-item input { width:16px; height:16px }
.cat-label { display:inline-block }

.suggestions { display:flex; flex-direction:column; gap:6px; margin-top:8px; max-height:220px; overflow-y:auto; -webkit-overflow-scrolling:touch; }
.suggestion { text-align:left; padding:8px 10px; background:var(--color-surface); border:1px solid var(--color-border); border-radius:8px; cursor:pointer; width:100%; }
.selected-place { margin-top:8px; display:flex; gap:8px; align-items:center }

.error {
  font-size: 0.78rem;
  color: var(--color-danger);
  margin: 4px 0 0;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}
</style>
