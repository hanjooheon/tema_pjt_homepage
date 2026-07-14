// RFP III항: 전국 5개 권역 중 1곳(서울)을 선정하여 개발.
// 나머지 권역은 화면 구성(와이어프레임)에 맞춰 탭은 노출하되 비활성 처리합니다.
// 추후 다른 권역으로 확장한다면 dataFile만 추가하고 active: true 로 바꾸면 됩니다.
export const REGIONS = [
  { code: 'seoul', name: '서울', active: true, dataFile: '/data/seoul.json' },
  { code: 'daejeon', name: '대전/충청', active: false, dataFile: null },
  { code: 'gumi', name: '구미/경북', active: false, dataFile: null },
  { code: 'gwangju', name: '광주/전라', active: false, dataFile: null },
  { code: 'busan', name: '부울경/경남', active: false, dataFile: null }
]

// 이번 MVP에서 실제로 서비스하는 권역 (LocalHub MVP 정의서 - 선정 권역)
export const CURRENT_REGION = REGIONS.find((r) => r.active)
