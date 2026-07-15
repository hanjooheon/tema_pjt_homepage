// RFP III항 "챗봇 기능 구현": Vue3 프론트엔드에서 OpenAI API를 직접 호출.
// 담당(WBS): 김소진 - "OpenAI 기반 지역 정보 챗봇 구현"
//
// ⚠️ 주의 (RFP 명시 사항)
//  - .env(VITE_ 접두사) 값은 빌드 결과물에 그대로 포함되어 브라우저에서 키가 노출될 수 있습니다.
//  - 반드시 "사용량 제한이 걸린 키"만 사용하고, 결제 한도를 낮게 설정하세요.
//  - .env 파일은 절대 Git에 커밋하지 마세요 (.gitignore 처리됨).

const API_URL = 'https://api.openai.com/v1/chat/completions'
const MODEL = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini'

/**
 * 제공 JSON 데이터를 컨텍스트로 넣어 시스템 프롬프트를 구성합니다.
 * TODO(김소진): 실제 데이터 스키마가 확정되면 프롬프트 요약 방식을 다듬어 주세요.
 *   (토큰 절약을 위해 전체 JSON을 통째로 넣기보다는 관련 항목만 요약해서 넣는 것을 권장)
 */
function buildSystemPrompt(regionData) {
  const regionName = regionData?.meta?.region_name ?? '서울'
  const summary = JSON.stringify(regionData?.categories ?? {}).slice(0, 6000)

  return [
    `당신은 "${regionName}" 지역 정보 안내 챗봇 LocalHub 어시스턴트입니다.`,
    '아래 제공된 지역 데이터 범위 안에서만 답변하고, 데이터에 없는 내용은 모른다고 답하세요.',
    '관광지 추천, 축제 일정, 맛집/인증업소 위치, 커뮤니티 게시글 검색 등의 질문에 친절하고 간결하게 답하세요.',
    `[제공 데이터]\n${summary}`
  ].join('\n')
}

/**
 * OpenAI Chat Completions API 호출
 * @param {Array<{role: 'user'|'assistant', content: string}>} history 대화 히스토리
 * @param {object} regionData dataService.loadRegionData() 로 불러온 JSON
 * @returns {Promise<string>} 챗봇 응답 텍스트
 */
export async function askChatbot(history, regionData) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY

  if (!apiKey) {
    // 키 미설정 시 개발 중에도 화면 흐름을 확인할 수 있도록 안내 메시지로 대체
    return '(개발 안내) VITE_OPENAI_API_KEY가 설정되지 않았습니다. .env 파일을 생성해 주세요.'
  }

  const messages = [{ role: 'system', content: buildSystemPrompt(regionData) }, ...history]

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.4,
      max_tokens: 500
    })
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`OpenAI API 오류 (${res.status}): ${errText}`)
  }

  const data = await res.json()
  return data?.choices?.[0]?.message?.content?.trim() ?? '응답을 받지 못했습니다.'
}
