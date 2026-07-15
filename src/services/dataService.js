// RFP III항 "제공 데이터 활용": 당사가 제공하는 JSON을 프론트엔드에서 직접 fetch.
// 공공데이터(TourAPI 형식) 원본을 카테고리별 파일 그대로 사용합니다.
// 각 파일 구조: { region, contentType, contentTypeId, total, items: [...] }

const CATEGORY_FILES = {
  tourist: '/data/서울_관광지.json',
  leports: '/data/서울_레포츠.json',
  culture: '/data/서울_문화시설.json',
  shopping: '/data/서울_쇼핑.json',
  lodging: '/data/서울_숙박.json',
  festival: '/data/서울_축제공연행사.json'
}

let cache = null

// "20260916" -> "2026.09.16"
function formatEventDate(raw) {
  if (!raw || raw.length !== 8) return ''
  return `${raw.slice(0, 4)}.${raw.slice(4, 6)}.${raw.slice(6, 8)}`
}

/**
 * TourAPI 원본 항목 -> 지도/게시판/챗봇에서 공용으로 쓰는 정규화된 스키마로 변환.
 * mapx = 경도(lng), mapy = 위도(lat) 이므로 이름이 서로 바뀌지 않게 주의.
 */
function normalizeItem(raw, categoryKey) {
  const lat = parseFloat(raw.mapy)
  const lng = parseFloat(raw.mapx)

  const item = {
    id: raw.contentid,
    categoryKey,
    name: raw.title || '',
    address: [raw.addr1, raw.addr2].filter(Boolean).join(' ').trim(),
    tel: raw.tel || raw.phone || raw.telephone || raw.telphone || raw.tel_no || raw.tel1 || '',
    image: raw.firstimage || raw.firstimage2 || raw.image || '',
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null
  }

  // RFP 추가 요청: 축제공연행사는 시작/종료일, 관람연령, 공연시간까지 반영
  if (categoryKey === 'festival') {
    item.eventStartDate = formatEventDate(raw.eventstartdate)
    item.eventEndDate = formatEventDate(raw.eventenddate)
    item.eventPlace = raw.eventplace || ''
    item.playtime = raw.playtime || ''
    item.ageLimit = raw.agelimit || ''
    item.useTime = raw.usetimefestival || ''
    item.program = raw.program || ''
  }

  return item
}

/**
 * 6개 카테고리 JSON을 모두 불러와 정규화한 뒤 하나의 배열로 합칩니다.
 * 위도/경도가 없는 항목(빈 문자열 등)은 지도에 표시할 수 없으므로 제외합니다.
 * 최초 호출 이후에는 캐시된 값을 반환합니다.
 */
export async function getAllItems() {
  if (cache) return cache

  const entries = Object.entries(CATEGORY_FILES)

  const results = await Promise.all(
    entries.map(async ([categoryKey, path]) => {
      const res = await fetch(path)
      if (!res.ok) {
        console.error(`[dataService] 데이터 로드 실패: ${res.status} ${path}`)
        return []
      }
      const data = await res.json()
      return (data.items ?? []).map((raw) => normalizeItem(raw, categoryKey))
    })
  )

  cache = results.flat().filter((item) => item.lat !== null && item.lng !== null)
  return cache
}

/**
 * 특정 카테고리 항목만 필요할 때 사용 (예: 게시판 검색, 가벼운 챗봇 컨텍스트 구성 등)
 */
export async function getItemsByCategory(categoryKey) {
  const all = await getAllItems()
  return all.filter((item) => item.categoryKey === categoryKey)
}
