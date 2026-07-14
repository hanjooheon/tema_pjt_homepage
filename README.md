# LocalHub MVP — 서울 지역 정보 공유 익명 커뮤니티

`02_3일차_팀프로젝트_개발_의뢰서.pdf` 요구사항과 팀에서 작성한 `LocalHub MVP 정의서` / `WBS+간트차트`를 기반으로 만든
**Vue 3(Vite) 스켈레톤 프로젝트**입니다. 각자 맡은 기능을 브랜치에서 이어서 구현하면 됩니다.

- 별도 백엔드 없음 (정적 SPA)
- 데이터: `public/data/seoul.json` (⚠️ 샘플 데이터입니다. 실제 제공 데이터로 교체하세요)
- 게시판: localStorage 기반 익명 CRUD + 비밀번호 검증
- 챗봇: 프론트엔드에서 OpenAI API 직접 호출
- 배포: Netlify

---

## 1. 시작하기

```bash
npm install
cp .env.example .env      # 발급받은 OpenAI API 키를 .env에 입력
npm run dev                # http://localhost:5173
```

빌드 / 배포 확인:

```bash
npm run build
npm run preview
```

> `.env`는 `.gitignore`에 포함되어 있습니다. **제출 전 Git에 `.env`가 올라가지 않았는지 꼭 확인하세요.** (RFP 산출물 요건)

---

## 2. 폴더 구조

```
public/
  data/seoul.json        # 제공 JSON 데이터 (샘플 → 실제 데이터로 교체)
src/
  main.js, App.vue        # 앱 진입점, 헤더/푸터/챗봇 배치
  router/index.js         # 라우팅 (홈 / 게시판 목록·상세·작성)
  data/regions.js         # 5개 권역 메타데이터 (서울만 active)
  services/
    dataService.js        # JSON 데이터 fetch + 캐싱
    openaiService.js       # OpenAI API 직접 호출 (챗봇)
  composables/
    usePosts.js            # 게시판 CRUD + localStorage + 비밀번호 검증
    useChatbot.js           # 챗봇 대화 상태 관리
  components/
    layout/                # 헤더, 푸터
    board/                  # 목록, 폼, 비밀번호 모달, (지도필터 스텁)
    chatbot/                # 플로팅 위젯, 메시지 버블
    common/                 # 홈 배너
  views/                    # 라우트에 매핑되는 화면 단위 컴포넌트
  utils/                     # localStorage 헬퍼, 유효성 검사
```

현재 동작하는 것: 홈 → 게시판 목록/검색/글쓰기 → 상세(비밀번호 확인 후 수정/삭제) → 챗봇 대화(키 설정 시 실제 OpenAI 응답).
즉, `npm run dev` 하면 바로 눌러볼 수 있는 상태입니다. 여기서부터 각자 맡은 기능을 다듬고 확장하면 됩니다.

---

## 3. Git 브랜치 전략 (WBS 담당 기준 제안)

```
main        # 배포 기준 브랜치 (Netlify 연동)
develop     # 통합 브랜치 - 각 feature 브랜치는 여기로 PR/MR
├─ feature/board-crud     # 김유민 - 게시판 CRUD, 비밀번호 검증 다듬기
├─ feature/map-filter     # 김유민 - 카테고리/거리 기반 필터, 지도 시각화 (선택기능)
├─ feature/chatbot        # 김소진 - 챗봇 프롬프트/UI 고도화
├─ feature/ui-polish       # 김소진 - 화면 UI/컴포넌트 스타일 다듬기
└─ feature/deploy-test     # 한주현 - 단위/통합 테스트, Netlify 배포 검증
```

작업 흐름 예시:

```bash
git checkout develop
git checkout -b feature/board-crud
# 작업 후
git add .
git commit -m "feat: 게시글 검색 기능 개선"
git push origin feature/board-crud
# GitLab에서 develop으로 Merge Request 생성
```

폴더가 역할별로 이미 분리되어 있어(`composables/usePosts.js` vs `composables/useChatbot.js` 등) 브랜치 간 충돌이 최소화되도록 설계했습니다.

---

## 4. 담당별 TODO 체크리스트

코드 안에 `TODO(담당자)` 주석으로도 표시해 두었습니다. (`Ctrl/Cmd+Shift+F`로 `TODO` 검색)

**김소진**
- [ ] `services/dataService.js`: 실제 제공 JSON 데이터로 `public/data/seoul.json` 교체 및 스키마에 맞게 구조 조정
- [ ] `services/openaiService.js`: 시스템 프롬프트 다듬기 (질의 유형별 답변 품질 개선)
- [ ] `components/chatbot/*`: 채팅 UI 디테일(로딩 표시, 에러 처리, 모바일 전체화면 QA)
- [ ] 화면 UI/컴포넌트 스타일 전반 다듬기

**김유민**
- [ ] `composables/usePosts.js`: 필요 시 필드 확장(조회수 정렬, 태그 등)
- [ ] `components/board/MapFilterPanel.vue`: 카테고리 필터 + 거리순 정렬 + 지도 시각화 구현 (선택 기능)
- [ ] 라우터에 지도/필터 화면 연결 (`router/index.js`의 TODO 참고)

**한주현**
- [ ] 기능별 단위 테스트 (게시글 CRUD, 비밀번호 검증, 챗봇 응답 흐름)
- [ ] 통합 테스트 및 버그 수정
- [ ] Netlify 배포 및 배포 URL 정상 동작 검증 (`netlify.toml` 이미 포함되어 있음)

---

## 5. 제출 산출물 체크리스트 (RFP 참고 1)

- [ ] 소스코드: Git Repository URL (`.env` 미포함 확인 필수)
- [ ] 배포: Netlify 배포 사이트 URL
- [ ] 기능 명세서 (PDF/docx) — 데이터 출처·라이선스 목록 포함
- [ ] WBS 문서/스프레드시트
- [ ] 발표 PPT/PDF

## 6. 유의사항 (RFP 원문 기준)

- 비밀번호는 암호화 없이 저장/비교합니다. 교육 목적의 의도된 설계이며 실제 서비스에는 사용하지 마세요.
- OpenAI API 키는 빌드 결과물에 노출될 수 있으므로 **사용량 제한이 걸린 키**만 사용하고 결제 한도를 낮게 설정하세요.
- 다국어(i18n), 소셜 공유, 축제 캘린더, 실시간 폴링 알림은 이번 MVP 범위(Won't have)에서 제외되었습니다.
