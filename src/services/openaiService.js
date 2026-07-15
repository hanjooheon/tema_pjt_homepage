// Minimal fallback OpenAI service for local/dev mode
// The app expects `askChatbot(history, items)` to be exported. In production this
// module would call an external AI API; for local development we provide a
// simple synchronous responder so the app can run without external credentials.

export async function askChatbot(history = [], items = []) {
  try {
    const last = history.length ? history[history.length - 1].content : ''
    const sample = (items || []).slice(0, 3).map((i) => i.name).filter(Boolean)
    const sampleText = sample.length ? `예시 장소: ${sample.join(', ')}` : ''
    return `로컬 모드 응답입니다. 질문: "${String(last)}". ${sampleText}`
  } catch (e) {
    console.error('[openaiService] askChatbot error', e)
    return '챗봇 처리 중 오류가 발생했습니다.'
  }
}
