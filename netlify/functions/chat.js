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

    // 간단한 관련도 검색: 사용자 마지막 질문에서 키워드를 뽑아 items를 점수화합니다.
    function tokenize(text) {
      return (text || '').toString().toLowerCase().replace(/[^a-z0-9가-힣\s]/g, ' ').split(/\s+/).filter(Boolean)
    }

    function scoreItem(item, tokens) {
      const hay = [item.name, item.address, item.categoryKey, item.tel, item.eventPlace, item.program].filter(Boolean).join(' ').toLowerCase()
      let score = 0
      for (const t of tokens) if (hay.includes(t)) score++
      return score
    }

    const lastUser = (history || []).slice().reverse().find(h => h.role === 'user')?.content || ''
    const tokens = tokenize(lastUser)

    const scored = (items || []).map((it) => ({ it, score: scoreItem(it, tokens) }))
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)

    const top = scored.slice(0, 8).map(s => s.it)

    const sampleNames = top.map(i => i.name).filter(Boolean)

    const systemPrompt = `당신은 서울 지역 정보를 안내하는 챗봇입니다. 사용자 질문에 친절하고 간결하게 한국어로 답변하세요.`

    // 컨텍스트로 전달할 관련 장소 정보를 구조화해서 함께 보냅니다.
    const contextMsg = top.length > 0
      ? `다음은 사용자의 질문과 관련이 있다고 판단되는 장소 데이터입니다. 가능한 경우 이 정보를 활용해 구체적으로 답변하세요.\n\n${top.map(i => `- 이름: ${i.name}\n  카테고리: ${i.categoryKey}\n  주소: ${i.address || '정보 없음'}\n  전화: ${i.tel || '정보 없음'}\n  링크 이미지: ${i.image || '없음'}`).join('\n\n')}`
      : '관련 장소 데이터가 없습니다.'

    // 추가 우선 처리: 사용자의 질의와 항목 이름이 정확히 매칭되는 경우,
    // 해당 항목의 데이터를 '권위 있는 정보'로서 모델이 반드시 우선 사용하도록 지시합니다.
    function normalizeText(t) {
      return (t || '').toString().toLowerCase().replace(/[^a-z0-9가-힣]/g, '')
    }

    const normLast = normalizeText(lastUser)
    const exactMatches = (items || []).filter(it => {
      const normName = normalizeText(it.name)
      if (!normName) return false
      return normLast.includes(normName) || normName.includes(normLast)
    })

    const authoritativeMsg = exactMatches.length > 0
      ? `중요: 아래 정보는 제공된 데이터에서 온 권위 있는 장소 정보입니다. 사용자가 장소의 주소, 전화번호, 행사정보 등을 묻는 경우, 반드시 먼저 아래 정보를 근거로 답변하세요. 추가 설명은 가능하지만 먼저 데이터 기반 응답을 제공하십시오.\n\n${exactMatches.map(i => `- 이름: ${i.name}\n  주소: ${i.address || '정보 없음'}\n  전화: ${i.tel || '정보 없음'}\n  카테고리: ${i.categoryKey || '없음'}`).join('\n\n')}`
      : null

    const messages = [
      { role: 'system', content: systemPrompt },
      // 모델에게 이미지 링크나 URL을 응답에 포함하지 말라고 명확히 지시
      { role: 'system', content: '응답에 이미지 링크(URL)는 포함하지 마십시오. 이미지 관련 정보는 텍스트 설명으로만 제공하세요.' },
      ...(authoritativeMsg ? [{ role: 'system', content: authoritativeMsg }] : []),
      { role: 'system', content: `관련 장소 요약: ${sampleNames.join(', ') || '없음'}` },
      { role: 'system', content: contextMsg },
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
