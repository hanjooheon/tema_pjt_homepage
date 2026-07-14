import { CURRENT_REGION } from '../data/regions.js'

// RFP III항 "제공 데이터 활용": 당사가 제공하는 JSON을 프론트엔드에서 직접 fetch.
// 별도 백엔드가 없으므로 public/data/*.json 정적 파일을 그대로 불러옵니다.

let cache = null

/**
 * 현재 선정 권역(서울)의 JSON 데이터를 불러옵니다. (fetch 1회 후 캐시)
 * @returns {Promise<object>} regions.js 의 CURRENT_REGION 에 대응하는 JSON 데이터
 */
export async function loadRegionData() {
  if (cache) return cache

  if (!CURRENT_REGION?.dataFile) {
    throw new Error('선정된 권역의 dataFile 경로가 없습니다. src/data/regions.js 를 확인하세요.')
  }

  const res = await fetch(CURRENT_REGION.dataFile)
  if (!res.ok) {
    throw new Error(`데이터 로드 실패: ${res.status} ${CURRENT_REGION.dataFile}`)
  }

  cache = await res.json()
  return cache
}

/**
 * 카테고리별 항목 배열만 뽑아 평탄화합니다. (지도/필터/챗봇 컨텍스트에서 공용으로 사용)
 * TODO(선택 기능 - 카테고리/거리 필터 담당자): 여기에 lat/lng 기반 거리 계산 유틸을 추가해
 *   "현재 위치 기준 가까운 순" 정렬 기능을 구현하세요. (예: getNearbyItems(lat, lng, radiusKm))
 */
export async function getAllItems() {
  const data = await loadRegionData()
  const categories = data.categories ?? {}
  return Object.entries(categories).flatMap(([categoryKey, items]) =>
    items.map((item) => ({ ...item, category: categoryKey }))
  )
}
