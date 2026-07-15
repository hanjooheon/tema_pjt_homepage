import test from 'node:test'
import assert from 'node:assert/strict'

function createLocalStorageMock() {
  const store = {}
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null
    },
    setItem(key, value) {
      store[key] = String(value)
    },
    removeItem(key) {
      delete store[key]
    },
    clear() {
      Object.keys(store).forEach((key) => delete store[key])
    },
    key(index) {
      return Object.keys(store)[index] ?? null
    },
    get length() {
      return Object.keys(store).length
    }
  }
}

globalThis.localStorage = createLocalStorageMock()

const { createPost, getPost, toggleLike } = await import('./usePosts.js')

test('toggleLike only increments once per browser user', () => {
  localStorage.clear()

  const post = createPost({
    title: '테스트 게시글',
    content: '좋아요 중복 방지 테스트',
    nickname: '테스터',
    password: '1234'
  })

  const first = toggleLike(post.id)
  assert.equal(first.ok, true)
  assert.equal(first.likes, 1)

  const second = toggleLike(post.id)
  assert.equal(second.ok, false)
  assert.equal(second.error, '이미 좋아요를 누르셨습니다.')
  assert.equal(getPost(post.id).likes, 1)
})
