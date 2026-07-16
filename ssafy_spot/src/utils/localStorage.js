// 별도 백엔드 없이 브라우저 localStorage 를 "DB"처럼 사용하기 위한 공용 헬퍼.
// RFP 명시: 비밀번호는 암호화 없이 그대로 저장/비교 (교육 목적의 의도된 설계)

export function readList(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    console.error(`[localStorage] ${key} 파싱 실패`, e)
    return []
  }
}

export function writeList(key, list) {
  localStorage.setItem(key, JSON.stringify(list))
}

export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
