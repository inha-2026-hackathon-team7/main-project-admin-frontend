# 지역 코스 어드민 — React 프로젝트

HTML 프로토타입(`지역 어드민 대시보드.dc.html`)을 **수정 가능한 Vite + React 18 프로젝트**로 옮긴 것입니다.
동작(상태 전이, 삭제 차단 규칙, 토스트 문구, API 엔드포인트 표기)은 프로토타입과 1:1로 일치합니다.

## 실행

```bash
cd react-app
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/
```

기본적으로 `http://localhost:8080` 의 `/admin/*`, `/auth/*` 백엔드를 호출합니다. 다른 주소를 쓰려면
프로젝트 루트에 `.env` 를 만들고 `VITE_API_BASE_URL=https://your-api.example.com` 을 지정하세요.

## 구조

```
src/
  main.jsx                 진입점 — AdminProvider 로 App 을 감쌉니다
  App.jsx                  레이아웃 셸 + 화면 스위치 + 모달 마운트 + 부팅 에러 화면
  index.css                body 리셋, 키프레임, :hover 보조 클래스
  styles/industry.css      Industry 디자인 시스템 토큰·컴포넌트 CSS (수정 금지 권장)
  lib/format.js            num / pct / tag 매핑 등 포맷 헬퍼
  lib/apiClient.js         fetch 래퍼 — API_BASE_URL, accessToken, 에러 처리
  api/endpoints.js         api-docs.json paths 1:1 매핑 (auth/regions/places/courses/rewards)
  api/mappers.js           서버 스키마(camelCase, 대문자 enum) ↔ 화면 상태(snake_case) 변환
  state/AdminContext.jsx   전역 상태 + 모든 액션 — 실제 API 호출 후 응답으로 상태 갱신
  components/              Header, Sidebar, Toasts, 모달 3종, MapPicker, Corners, Icon, Notice
  screens/                 Dashboard, Regions, Places, CourseList, CourseDetail,
                           Rewards, Review, Login, Register
```

## 상태 관리

`AdminContext` 하나에 모든 상태가 있습니다. `useAdmin()` 으로 꺼내 씁니다.

```jsx
const { state, patch, toast, openCourse, deleteRegion } = useAdmin();
patch({ screen: 'places' });                 // 부분 병합 (클래스형 setState 와 동일)
patch(s => ({ toasts: [...s.toasts] }));     // 함수형도 가능
```

주요 액션: `go`, `openRegionForm/deleteRegion`, `openPlaceForm/deletePlace`,
`openRewardForm/deleteReward`, `openCourseForm/openCourse/deleteCourse`,
`addDraft/removeDraft/moveDraft/saveCoursePlaces`, `submitForm`, `runAction`,
`submitLogin`, `submitRegister`.

## API 연동

`api-docs.json`(OpenAPI) 에 정의된 실제 백엔드(`http://localhost:8080`, `VITE_API_BASE_URL` 로 재정의 가능)와
연동되어 있습니다. 로그인/조직가입 이후 `regions · places · rewards · courses · courses/pending` 을 모두
실제로 fetch 하고, 모든 생성·수정·삭제·승인/반려 액션이 해당 API 를 호출합니다.

| 구성 요소 | 내용 |
| --- | --- |
| `lib/apiClient.js` | fetch 래퍼. `Authorization: Bearer <accessToken>` 자동 첨부, 네트워크/HTTP 에러를 `ApiError` 로 통일 |
| `api/endpoints.js` | `api-docs.json` 의 모든 path 를 그대로 매핑 |
| `api/mappers.js` | 서버 스키마(camelCase, 대문자 enum) ↔ 화면이 쓰는 snake_case 상태 간 변환 경계 |
| `state/AdminContext.jsx` | 부팅 시 목록 fetch, 각 액션에서 실제 API 호출 → 성공 시 응답으로 상태 갱신 · 실패 시 토스트/폼 에러 표시 |

참고로 실제 API 스펙과 기존 화면 설계가 다른 지점은 다음과 같이 보완했습니다.

- 코스 **목록**(`GET /admin/courses`)에는 `places` 배열이 없어 상세(`places` 포함)와 통계(`stats`)는
  화면에서 필요할 때(`ensureCourseFull`) 별도로 불러와 `courseDetails` / `courseStats` 캐시에 합칩니다.
- Place 삭제 차단 여부는 `GET /admin/places/{id}` 의 `referencingCourses` 로 판단합니다 — 부팅 시 전체 Place 에
  대해 한 번씩 미리 불러와 목록의 삭제 버튼 상태를 정확히 표시합니다.
- `RewardUpdateRequest` 스키마는 `name · stock · validUntil` 만 허용해 리워드 수정 시 `kind` 는 잠급니다.
- 검수 대기 항목(`CoursePendingItem`)에는 경유지 이름 목록이 없어 개수(`placeCount`)만 표시합니다.
- 로그인 응답에는 조직명이 없어(이메일 도메인으로 대체 표시) 화면 상단 조직명은 참고용입니다.

`components/MapPicker.jsx` 는 여전히 와이어프레임 좌표 피커입니다 — 실제 지도 SDK(`react-kakao-maps-sdk` 등)로
교체하려면 `<Map onClick>` 의 `latlng` 을 그대로 `form.latitude/longitude` 에 넣으면 됩니다.
`screens/Dashboard.jsx` 의 구간별 통과 추정치는 체크인 로그 API 가 없어 완주율 기반 근사치입니다.

## 유지되는 업무 규칙

- 하위 Place 가 있는 **지역**은 삭제 불가 (409 FK)
- 코스가 참조 중인 **Place**는 삭제 불가 (course_places)
- 코스에 연결된 **리워드**는 삭제 불가 (reward_id)
- 참가자가 있는 **코스**는 하드 삭제 대신 `status=archived`
- 코스 구성 저장은 `PUT /admin/courses/{id}/places` 전량 교체 (visit_order 1부터)
- 관리자 생성 코스는 `type=official`, `status=draft`
- `qrcode_string` 은 서버 발급 — 폼에 입력란 없음
- `organization_type` 은 SQL enum 3종 (`government` · `company` · `facility`)

## 라우팅

화면 전환은 `state.screen` 문자열입니다. URL 이 필요하면 `react-router-dom` 을 추가하고
`App.jsx` 의 스위치를 `<Routes>` 로 바꾸면 됩니다 — 화면 컴포넌트는 그대로 씁니다.

## 스타일

모든 스타일은 인라인 객체 + 디자인 시스템 클래스(`.btn .card .table .tag .input .field .dialog .blueprint`)입니다.
색·간격·폰트는 `styles/industry.css` 의 `var(--color-*)` / `var(--space-*)` / `var(--font-*)` 토큰만 사용합니다.
`:hover` 처럼 인라인으로 쓸 수 없는 상태만 `index.css` 의 `.om-*` 클래스로 뺐습니다.
