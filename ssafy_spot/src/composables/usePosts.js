import { ref } from 'vue'
import { CURRENT_REGION } from '../data/regions.js'
import { readList, writeList, generateId } from '../utils/localStorage.js'

// 담당(WBS): 김유민 - "익명 게시판 CRUD 및 localStorage 구현" / "게시글 비밀번호 검증 기능 구현"
//
// 게시글 데이터 모델
// { id, title, content, password, createdAt, updatedAt, views }
//
// ※ 권역별로 키를 분리해두면, 추후 다른 권역으로 확장할 때 데이터가 섞이지 않습니다.
const STORAGE_KEY = `localhub_posts_${CURRENT_REGION.code}`

// 수정/삭제 진행 중 비밀번호를 잠깐 들고 있기 위한 모듈 스코프 상태.
// (백엔드/세션이 없으므로 "상세 화면에서 비밀번호 확인 → 수정 화면 이동" 흐름을 위해 사용)
const pendingPassword = ref('')

export function setPendingPassword(pw) {
  pendingPassword.value = pw
}

export function getPendingPassword() {
  return pendingPassword.value
}

export function getPosts() {
  return readList(STORAGE_KEY).sort((a, b) => b.createdAt - a.createdAt)
}

export function getPost(id) {
  return readList(STORAGE_KEY).find((p) => p.id === id) ?? null
}

export function incrementViews(id) {
  const posts = readList(STORAGE_KEY)
  const target = posts.find((p) => p.id === id)
  if (target) {
    target.views = (target.views ?? 0) + 1
    writeList(STORAGE_KEY, posts)
  }
}

export function createPost({ title, content, password }) {
  const posts = readList(STORAGE_KEY)
  const now = Date.now()
  const newPost = {
    id: generateId(),
    title,
    content,
    password,
    createdAt: now,
    updatedAt: now,
    views: 0
  }
  posts.push(newPost)
  writeList(STORAGE_KEY, posts)
  return newPost
}

export function verifyPassword(id, password) {
  const post = getPost(id)
  return !!post && post.password === password
}

export function updatePost(id, { title, content }, password) {
  if (!verifyPassword(id, password)) {
    return { ok: false, error: '비밀번호가 일치하지 않습니다.' }
  }
  const posts = readList(STORAGE_KEY)
  const target = posts.find((p) => p.id === id)
  target.title = title
  target.content = content
  target.updatedAt = Date.now()
  writeList(STORAGE_KEY, posts)
  return { ok: true }
}

export function deletePost(id, password) {
  if (!verifyPassword(id, password)) {
    return { ok: false, error: '비밀번호가 일치하지 않습니다.' }
  }
  const posts = readList(STORAGE_KEY).filter((p) => p.id !== id)
  writeList(STORAGE_KEY, posts)
  return { ok: true }
}

// TODO(선택 기능 - 검색 담당자): 현재는 제목 기준 단순 포함 검색만 구현되어 있습니다.
// 필요 시 내용 검색, 태그 검색 등으로 확장하세요.
export function searchPosts(keyword) {
  const posts = getPosts()
  if (!keyword?.trim()) return posts
  const kw = keyword.trim().toLowerCase()
  return posts.filter((p) => p.title.toLowerCase().includes(kw))
}
