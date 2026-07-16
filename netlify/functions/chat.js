// netlify/functions/chat.js
// 서버(Function) 사이드에서만 OpenAI API 키를 사용하도록 분리한 엔드포인트.
// 프론트엔드는 이 함수를 /.netlify/functions/chat 으로 호출합니다.

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    }
  }

  try {
    const { history = [], items = [] } = JSON.parse(event.body || '{}')

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'OPENAI_API_KEY가 서버 환경변수에 설정되어 있지 않습니다.' })
      }
    }

    const sample = (items || []).slice(0, 10).map((i) => i.name).filter(Boolean)
    const systemPrompt = `당신은 서울 지역 정보를 안내하는 챗봇입니다. 사용자 질문에 친절하고 간결하게 한국어로 답변하세요. 참고 가능한 장소 예시: ${sample.join(', ')}`

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map(({ role, content }) => ({ role, content }))
    ]

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        messages,
        temperature: 1
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('[chat function] OpenAI API error', response.status, errText)
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: 'OpenAI API 호출 중 오류가 발생했습니다.' })
      }
    }

    const data = await response.json()
    const reply = data?.choices?.[0]?.message?.content ?? '응답을 생성하지 못했습니다.'

    return {
      statusCode: 200,
      body: JSON.stringify({ reply })
    }
  } catch (err) {
    console.error('[chat function] handler error', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: '서버 처리 중 오류가 발생했습니다.' })
    }
  }
}
