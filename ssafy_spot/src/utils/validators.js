// 와이어프레임 기준: "수정용 비밀번호 - 숫자 4자리 이상"
export function isValidPassword(password) {
  return /^\d{4,}$/.test(password ?? '')
}

export function isBlank(text) {
  return !text || !text.trim()
}
