// RFP III항: 전국 5개 권역 중 1곳(서울)을 선정하여 개발.
// 나머지 권역은 화면 구성(와이어프레임)에 맞춰 탭은 노출하되 비활성 처리합니다.
// 추후 다른 권역으로 확장한다면 dataFile만 추가하고 active: true 로 바꾸면 됩니다.
export const REGIONS = [
  { code: 'attractions', name: '관광지', emoji: '📸', active: true, dataFile: '/data/서울_관광지.json' },
  { code: 'leisure', name: '레포츠', emoji: '🚴', active: true, dataFile: '/data/서울_레포츠.json' },
  { code: 'culture', name: '문화시설', emoji: '🏛️', active: true, dataFile: '/data/서울_문화시설.json' },
  { code: 'shopping', name: '쇼핑', emoji: '🛍️', active: true, dataFile: '/data/서울_쇼핑.json' },
  { code: 'accommodation', name: '숙박', emoji: '🏨', active: true, dataFile: '/data/서울_숙박.json' },
  { code: 'events', name: '축제공연행사', emoji: '🎉', active: true, dataFile: '/data/서울_축제공연행사.json' }
]

// 현재 활성화된 카테고리
export const CURRENT_REGION = REGIONS.find((r) => r.active)
