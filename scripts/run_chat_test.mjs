import fs from 'fs'
import path from 'path'

// 로컬 .env 파싱
const envPath = path.resolve(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  const raw = fs.readFileSync(envPath, 'utf8')
  raw.split(/\r?\n/).forEach(line => {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i)
    if (m) {
      const key = m[1]
      let val = m[2]
      // 제거 가능한 따옴표
      if ((val.startsWith("\"") && val.endsWith("\"")) || (val.startsWith("\'") && val.endsWith("\'"))) {
        val = val.slice(1, -1)
      }
      process.env[key] = val
    }
  })
}

// 가져올 핸들러 모듈 경로
const handlerPath = path.resolve(process.cwd(), 'netlify/functions/chat.js')
let mod
try {
  mod = await import(`file://${handlerPath}`)
} catch (e) {
  console.error('핸들러 모듈 로드 실패:', e)
  process.exit(1)
}

const handler = mod.handler
if (typeof handler !== 'function') {
  console.error('핸들러가 함수가 아닙니다.')
  process.exit(1)
}

// 샘플 요청: 순차 대화 시 최초 1회만 JSON 데이터가 포함되는지 테스트
const event = {
  httpMethod: 'POST',
  body: JSON.stringify({
    history: [
      { role: 'user', content: '효사정' },
      { role: 'assistant', content: '효사정 주소: 서울특별시 송파구 잠실동' },
      { role: 'user', content: '효사정 근처 맛집 뭐 있어?' }
    ],
    items: [
      { name: '효사정', address: '서울특별시 송파구 잠실동', categoryKey: 'tourist', tel: '02-111-1111', image: '' },
      { name: '효사정 카페', address: '서울 송파구 예시로', categoryKey: 'shopping', tel: '', image: '' }
    ]
  })
}

console.log('OPENAI_API_KEY set?', !!process.env.OPENAI_API_KEY)

try {
  const res = await handler(event)
  console.log('statusCode:', res.statusCode)
  try {
    const parsed = JSON.parse(res.body)
    console.log('body:', JSON.stringify(parsed, null, 2))
  } catch (e) {
    console.log('body:', res.body)
  }
} catch (e) {
  console.error('핸들러 실행 중 오류:', e)
  process.exit(1)
}
