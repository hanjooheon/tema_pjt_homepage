// src/services/openaiService.js
// 프론트엔드는 OpenAI API 키를 직접 다루지 않고, Netlify Function(/.netlify/functions/chat)을
// 통해서만 응답을 받아옵니다. API 키는 Netlify 서버 환경변수(OPENAI_API_KEY)에만 존재합니다.

export async function askChatbot(history = [], items = []) {
  try {
    const response = await fetch('/.netlify/functions/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history, items })
    })

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      console.error('[openaiService] chat function error', response.status, errData)
      return '챗봇 응답을 가져오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
    }

    const data = await response.json()
    return data.reply ?? '응답을 생성하지 못했습니다.'
  } catch (e) {
    console.error('[openaiService] askChatbot error', e)
    return '챗봇 처리 중 오류가 발생했습니다.'
  }
}
