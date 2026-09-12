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
프로젝트 루트에 `.env` 를 만들고 값을 지정하세요.

```bash
VITE_API_BASE_URL=https://your-api.example.com
VITE_KAKAO_API_KEY=your-kakao-javascript-key   # Place 등록 폼의 지도(카카오맵)에 사용
```

Vite 는 `VITE_` 접두사가 붙은 값만 브라우저에 노출하므로 반드시 `VITE_KAKAO_API_KEY` 로 지정해야 합니다.
카카오 디벨로퍼스 콘솔의 앱 설정 → 플랫폼 → Web 에 실행 도메인(`http://localhost:5173` 등)이 등록되어
있어야 지도가 로드됩니다 — 등록되지 않으면 지도 영역에 로드 실패 안내가 표시됩니다.

WSL 에서 `npm run dev` 를 띄운 상태에서 이 저장소 파일을 **Windows 쪽 경로(F:\...)로 직접 수정**하면
WSL 의 파일 변경 감지(DrvFs)가 반영되지 않아 HMR 이 동작하지 않을 수 있습니다 — 코드가 반영되지 않는 것
같으면 dev 서버를 재시작하세요.

## 구조

```
src/
  main.jsx                 진입점 — AdminProvider 로 App 을 감쌉니다
  App.jsx                  레이아웃 셸 + 화면 스위치 + 모달 마운트 + 부팅 에러 화면
  index.css                body 리셋, 키프레임, :hover 보조 클래스
  styles/industry.css      Industry 디자인 시스템 토큰·컴포넌트 CSS (수정 금지 권장)
  lib/format.js            num / pct / tag 매핑 등 포맷 헬퍼
  lib/apiClient.js         fetch 래퍼 — API_BASE_URL, accessToken, 401 핸들러, 에러 처리
  lib/session.js           로그인 세션을 localStorage 에 저장/복원 (새로고침 시 로그인 유지)
  lib/routes.js            state.screen ↔ URL 경로 매핑
  lib/kakaoMaps.js         카카오맵 JS SDK 동적 로더 (1회 로드 후 캐시)
  api/endpoints.js         api-docs.json paths 1:1 매핑 (auth/regions/places/courses/rewards)
  api/mappers.js           서버 스키마(snake_case, 대문자 enum) ↔ 화면 상태(snake_case) 변환
  state/AdminContext.jsx   전역 상태 + 모든 액션 — 실제 API 호출 후 응답으로 상태 갱신, 라우팅 연동
  components/              Header, Sidebar, Toasts, 모달 3종, MapPicker(카카오맵), Corners, Icon, Notice
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
`openRewardForm/deleteReward`, `openCourseForm/openCourse/closeCourseDetail/deleteCourse`,
`addDraft/removeDraft/moveDraft/saveCoursePlaces`, `submitForm`, `runAction`,
`submitLogin`, `submitRegister`, `logout`, `reloadAll`.

## API 연동

`api-docs.json`(OpenAPI) 에 정의된 실제 백엔드(`http://localhost:8080`, `VITE_API_BASE_URL` 로 재정의 가능)와
연동되어 있습니다. 로그인/조직가입 이후 `regions · places · rewards · courses · courses/pending` 을 모두
실제로 fetch 하고, 모든 생성·수정·삭제·승인/반려 액션이 해당 API 를 호출합니다.

| 구성 요소 | 내용 |
| --- | --- |
| `lib/apiClient.js` | fetch 래퍼. `Authorization: Bearer <accessToken>` 자동 첨부, 401 시 등록된 핸들러 호출, 네트워크/HTTP 에러를 `ApiError` 로 통일 |
| `api/endpoints.js` | `api-docs.json` 의 모든 path 를 그대로 매핑 (쿼리 파라미터는 문서와 실제가 일치) |
| `api/mappers.js` | 서버 응답/요청 바디(snake_case, 대문자 enum) ↔ 화면이 쓰는 snake_case 상태 간 변환 경계 |
| `state/AdminContext.jsx` | 부팅 시 목록 fetch, 각 액션에서 실제 API 호출 → 성공 시 응답으로 상태 갱신 · 실패 시 토스트/폼 에러 표시 |

**주의:** `api-docs.json` 의 `components.schemas` 는 camelCase 로 보이지만, 실제 서버는 JSON 바디를
**snake_case** 로 주고받습니다 (예: 로그인 응답이 `accessToken` 이 아니라 `access_token`). springdoc 이 런타임
Jackson 네이밍 전략을 반영하지 못해 생기는 문서-실제 불일치로 확인되었습니다. `api/mappers.js` 는 문서가 아니라
실제 와이어 포맷(snake_case)을 기준으로 작성돼 있으니, API 스펙이 바뀌어 다시 손볼 때는 문서보다 실제 응답을
먼저 확인하세요. 쿼리 파라미터(`region_id`, `type`, `status`)는 Jackson 네이밍 전략의 영향을 받지 않아 문서와
실제가 일치합니다.

그 외 실제 API 스펙과 기존 화면 설계가 다른 지점은 다음과 같이 보완했습니다.

- 코스 **목록**(`GET /admin/courses`)에는 `places` 배열이 없어 상세(`places` 포함)와 통계(`stats`)는
  화면에서 필요할 때(`ensureCourseFull`) 별도로 불러와 `courseDetails` / `courseStats` 캐시에 합칩니다.
- Place 삭제 차단 여부는 `GET /admin/places/{id}` 의 `referencing_courses` 로 판단합니다 — 부팅 시 전체 Place 에
  대해 한 번씩 미리 불러와 목록의 삭제 버튼 상태를 정확히 표시합니다.
- `RewardUpdateRequest` 스키마는 `name · stock · valid_until` 만 허용해 리워드 수정 시 `kind` 는 잠급니다.
- 검수 대기 항목(`CoursePendingItem`)에는 경유지 이름 목록이 없어 개수(`place_count`)만 표시합니다.
- 로그인 응답에는 조직명이 없어(이메일 도메인으로 대체 표시) 화면 상단 조직명은 참고용입니다.

`components/MapPicker.jsx` 는 카카오맵 JS SDK(`lib/kakaoMaps.js`)로 실제 지도를 띄웁니다. 지도를 클릭하면
`kakao.maps.event`의 클릭 좌표를 그대로 `form.latitude/longitude` 에 채우고, 같은 지역의 다른 Place 는
참고 마커로 함께 표시합니다. `.env` 에 `VITE_KAKAO_API_KEY` 가 없거나 도메인이 등록되지 않으면 지도 영역에
에러 메시지만 표시되고 나머지 폼은 정상 동작합니다.
`screens/Dashboard.jsx` 의 구간별 통과 추정치는 체크인 로그 API 가 없어 완주율 기반 근사치입니다.

## 세션 유지 (새로고침)

로그인/조직가입 성공 시 `access_token` 과 세션 정보(조직명·담당자명·역할 등)를 `localStorage`
(`admin_session_v1` 키)에 저장합니다 (`lib/session.js`). 새로고침하면 `AdminContext` 가 이 값을 읽어
로그인 화면을 건너뛰고 바로 이전 화면으로 복원합니다. 별도의 `/me` 같은 세션 확인 API 가 없으므로,
토큰 유효성은 실제 API 호출이 처음 401 을 받을 때 확인됩니다 — 이 시점에 `apiClient.js` 의 401 핸들러가
저장된 세션을 지우고 로그인 화면으로 돌려보냅니다 (토스트로 안내). 순수 네트워크 오류(서버 접속 불가)는
세션을 지우지 않고 "다시 시도" 화면만 보여줍니다.

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

`react-router-dom` (`BrowserRouter`) 을 사용합니다. `App.jsx` 의 화면 분기는 여전히 `state.screen` /
`state.openCourseId` 문자열 기반이지만, 이제 이 값들은 저장된 상태가 아니라 **현재 URL 에서 파생**됩니다
(`lib/routes.js` 의 `parseAppPath` / `pathForScreen`). `AdminProvider` 내부에서 `useNavigate` / `useLocation`
을 직접 사용해 다음을 처리합니다.

- `go(screen)`, `openCourse(c)` 등 기존 액션은 내부적으로 `navigate(path)` 를 호출 — 화면 컴포넌트 코드는
  변경 없이 그대로 `state.screen` / `state.openCourseId` 를 읽습니다.
- 경로 매핑: `/dashboard · /regions · /places · /courses · /courses/:id · /rewards · /review`,
  인증 화면은 `/login · /register`.
- 가드 effect 가 미인증 상태의 보호 경로 접근, 이미 로그인된 상태의 `/login` 재접근, 알 수 없는 경로를
  적절히 리다이렉트합니다.
- 새로고침·URL 직접 입력·브라우저 뒤로/앞으로가기 모두 정상 동작합니다 (단, 로그인 화면 자체의 조직가입
  전환은 `replace` 방식이라 히스토리에 남지 않습니다 — 의도된 동작).

## 스타일

모든 스타일은 인라인 객체 + 디자인 시스템 클래스(`.btn .card .table .tag .input .field .dialog .blueprint`)입니다.
색·간격·폰트는 `styles/industry.css` 의 `var(--color-*)` / `var(--space-*)` / `var(--font-*)` 토큰만 사용합니다.
`:hover` 처럼 인라인으로 쓸 수 없는 상태만 `index.css` 의 `.om-*` 클래스로 뺐습니다.
