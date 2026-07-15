import { ref } from 'vue'
import { CURRENT_REGION } from '../data/regions.js'
import { readList, writeList, generateId } from '../utils/localStorage.js'

const STORAGE_KEY = `localhub_posts_${CURRENT_REGION.code}`
const pendingPassword = ref('')

export function setPendingPassword(pw) {
  pendingPassword.value = pw
}

export function getPendingPassword() {
  return pendingPassword.value
}

function normalizePost(post) {
  return {
    ...post,
    nickname: post.nickname?.trim() || '익명',
    password: post.password ?? '',
    likes: post.likes ?? 0,
    likedByUser: Boolean(post.likedByUser),
    comments: Array.isArray(post.comments) ? post.comments : [],
    views: post.views ?? 0,
    createdAt: post.createdAt ?? Date.now(),
    updatedAt: post.updatedAt ?? post.createdAt ?? Date.now()
  }
}

function readPosts() {
  return readList(STORAGE_KEY).map(normalizePost)
}

function sortPosts(list, sortBy = 'latest') {
  const posts = [...list]
  if (sortBy === 'likes') {
    return posts.sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0) || b.createdAt - a.createdAt)
  }
  return posts.sort((a, b) => b.createdAt - a.createdAt)
}

export function getPosts(sortBy = 'latest') {
  return sortPosts(readPosts(), sortBy)
}

export function getPost(id) {
  return readPosts().find((p) => p.id === id) ?? null
}

export function incrementViews(id) {
  const posts = readPosts()
  const target = posts.find((p) => p.id === id)
  if (target) {
    target.views = (target.views ?? 0) + 1
    writeList(STORAGE_KEY, posts)
  }
}

export function createPost({ title, content, nickname, password }) {
  const posts = readPosts()
  const now = Date.now()
  const newPost = {
    id: generateId(),
    title,
    content,
    nickname: nickname?.trim() || '익명',
    password,
    createdAt: now,
    updatedAt: now,
    views: 0,
    likes: 0,
    likedByUser: false,
    comments: []
  }
  posts.push(newPost)
  writeList(STORAGE_KEY, posts)
  return newPost
}

export function verifyPassword(id, password) {
  const post = getPost(id)
  return !!post && post.password === password
}

export function updatePost(id, { title, content, nickname }, password) {
  if (!verifyPassword(id, password)) {
    return { ok: false, error: '비밀번호가 일치하지 않습니다.' }
  }
  const posts = readPosts()
  const target = posts.find((p) => p.id === id)
  target.title = title
  target.content = content
  target.nickname = nickname?.trim() || target.nickname || '익명'
  target.updatedAt = Date.now()
  writeList(STORAGE_KEY, posts)
  return { ok: true }
}

export function deletePost(id, password) {
  if (!verifyPassword(id, password)) {
    return { ok: false, error: '비밀번호가 일치하지 않습니다.' }
  }
  const posts = readPosts().filter((p) => p.id !== id)
  writeList(STORAGE_KEY, posts)
  return { ok: true }
}

export function searchPosts(keyword, sortBy = 'latest') {
  const posts = getPosts(sortBy)
  if (!keyword?.trim()) return posts
  const kw = keyword.trim().toLowerCase()
  return posts.filter((p) => {
    const haystack = `${p.title ?? ''} ${p.content ?? ''} ${p.nickname ?? ''}`.toLowerCase()
    return haystack.includes(kw)
  })
}

export function toggleLike(id) {
  const posts = readPosts()
  const target = posts.find((p) => p.id === id)

  if (!target) {
    return { ok: false, error: '게시글을 찾을 수 없습니다.' }
  }

  if (target.likedByUser) {
    target.likes = Math.max((target.likes ?? 0) - 1, 0)
    target.likedByUser = false
    target.updatedAt = Date.now()
    writeList(STORAGE_KEY, posts)

    return {
      ok: true,
      likes: target.likes,
      likedByUser: target.likedByUser,
      action: 'unlike'
    }
  }

  target.likes = (target.likes ?? 0) + 1
  target.likedByUser = true
  target.updatedAt = Date.now()
  writeList(STORAGE_KEY, posts)

  return {
    ok: true,
    likes: target.likes,
    likedByUser: target.likedByUser,
    action: 'like'
  }
}

export function createComment(postId, { nickname, password, content }) {
  const posts = readPosts()
  const target = posts.find((p) => p.id === postId)
  if (!target) {
    return { ok: false, error: '게시글을 찾을 수 없습니다.' }
  }

  const now = Date.now()
  const comment = {
    id: generateId(),
    nickname: nickname?.trim() || '익명',
    password,
    content: content.trim(),
    createdAt: now,
    updatedAt: now
  }

  target.comments = Array.isArray(target.comments) ? target.comments : []
  target.comments.push(comment)
  target.updatedAt = now
  writeList(STORAGE_KEY, posts)
  return { ok: true, comment }
}

export function updateComment(postId, commentId, { content }, password) {
  const posts = readPosts()
  const target = posts.find((p) => p.id === postId)
  if (!target) {
    return { ok: false, error: '게시글을 찾을 수 없습니다.' }
  }

  const comment = target.comments?.find((item) => item.id === commentId)
  if (!comment) {
    return { ok: false, error: '댓글을 찾을 수 없습니다.' }
  }

  if (comment.password !== password) {
    return { ok: false, error: '비밀번호가 일치하지 않습니다.' }
  }

  comment.content = content.trim()
  comment.updatedAt = Date.now()
  writeList(STORAGE_KEY, posts)
  return { ok: true }
}

export function deleteComment(postId, commentId, password) {
  const posts = readPosts()
  const target = posts.find((p) => p.id === postId)
  if (!target) {
    return { ok: false, error: '게시글을 찾을 수 없습니다.' }
  }

  const comment = target.comments?.find((item) => item.id === commentId)
  if (!comment) {
    return { ok: false, error: '댓글을 찾을 수 없습니다.' }
  }

  if (comment.password !== password) {
    return { ok: false, error: '비밀번호가 일치하지 않습니다.' }
  }

  target.comments = target.comments.filter((item) => item.id !== commentId)
  target.updatedAt = Date.now()
  writeList(STORAGE_KEY, posts)
  return { ok: true }
}