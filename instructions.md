# 작업 인수인계 (instructions.md)

이 문서는 **다음에 이 프로젝트를 이어받는 에이전트/개발자**를 위한 세션 히스토리 + 현재 상태 요약입니다.
"무엇을 왜 했는지"와 "지금 뭐가 확실하지 않은지"에 집중합니다. 코드 구조/사용법 자체는 [README.md](README.md)
가 최신 상태로 관리되고 있으니 중복 설명하지 않고 필요한 곳만 링크합니다.

## 한 줄 요약

원래 `data/seed.js` 목업 데이터로 동작하던 React 어드민 대시보드를, `api-docs.json` 에 정의된 실제
Spring Boot 백엔드와 연동하고, 카카오맵을 붙이고, 세션 유지 + URL 라우팅을 추가하고, `/admin` 하위 경로로
리버스 프록시 뒤에 서빙 가능한 Docker 이미지로 만드는 작업을 진행했습니다. 아래는 시간순 작업 로그입니다.

## 세션 히스토리 (시간순)

1. **목업 → 실제 API 연동** — `data/seed.js` 를 지우고 `lib/apiClient.js` / `api/endpoints.js` /
   `api/mappers.js` 를 새로 만들어 지역·Place·코스·리워드·검수 전체를 실제 `/admin/*`, `/auth/*` 호출로
   교체. `state/AdminContext.jsx` 전체를 이 API 호출 기준으로 재작성.
2. **로그인 후 인증 안 되는 버그 발견 및 수정** — 실제 백엔드에 직접 curl 로 확인해보니
   `api-docs.json` 문서(springdoc 생성, camelCase)와 실제 서버 응답(snake_case)이 다르다는 걸 확인.
   예: 로그인 응답이 `accessToken` 이 아니라 `access_token`. 이것 때문에 로그인은 성공한 것처럼 보이지만
   토큰이 실제로는 저장 안 돼서 이후 모든 API 호출이 401 이 났던 것. `api/mappers.js` 를 전부 snake_case
   기준으로 재작성해서 해결. **다시 API 스펙을 참고할 일이 있으면 `api-docs.json` 문서보다 실제 서버
   응답을 먼저 확인할 것** (README "API 연동" 섹션에 상세 기록).
3. **카카오맵 연동** — 처음엔 `MapPicker.jsx` 에서 JS 로 `<script>` 태그를 동적으로 주입했는데
   `ERR_BLOCKED_BY_ORB` 발생. 원인: 카카오맵 SDK 는 내부적으로 `document.write()` 로 실제 지도 엔진
   스크립트를 추가 삽입하는데, 이건 문서가 아직 파싱 중일 때만 정상 동작함. React 마운트 후 동적으로
   주입하면 무시/차단됨. **해결: `index.html` 의 `<head>` 에 정적 `<script>` 태그로 옮기고
   (`%VITE_KAKAO_API_KEY%` — Vite 의 HTML 환경변수 치환 사용), `lib/kakaoMaps.js` 는 이미 로드된
   `window.kakao` 를 기다렸다가 `kakao.maps.load()` 만 호출하도록 변경.** 이후 Place 등록 폼
   (`MapPicker.jsx`)과 Place 목록 미리보기(`PlacesMap.jsx`) 둘 다 실제 지도로 교체 완료, 사용자가
   직접 확인함.
4. **API 키를 HTML 에서 숨길 수 있는지 질문** → 답변: 클라이언트 사이드 지도 SDK 특성상 브라우저 요청에
   그대로 노출될 수밖에 없고, 이건 정상/의도된 구조(실제 보안 경계는 카카오 콘솔의 플랫폼 도메인 등록).
   코드 변경 없음, 설명만 제공.
5. **새로고침 시 로그인 풀리는 문제 + URL 이 안 바뀌는 문제 수정**
   - `lib/session.js` 추가 — 로그인 성공 시 `localStorage` (`admin_session_v1` 키)에 토큰+세션 저장,
     새로고침 시 복원.
   - `apiClient.js` 에 `setUnauthorizedHandler` 추가 — 아무 API 호출에서나 401 이 오면 자동으로
     세션을 지우고 로그인 화면으로 돌려보냄 (토큰 만료 대응). 이 값을 초기화하다가 실수로
     `KAKAO_API_KEY` 를 accessToken 에 넣는 버그도 발견해서 같이 고침.
   - `react-router-dom` (`BrowserRouter`) 도입. `state.screen` / `state.openCourseId` 를 상태로 저장하는
     대신 **현재 URL 에서 파생**시키도록 `AdminContext.jsx` 를 리팩터링 (`lib/routes.js`). 화면 컴포넌트
     쪽은 거의 안 건드림 — `state.screen` 을 그대로 읽는 기존 코드가 그대로 동작하도록 파생값을 병합해서
     내려줌.
   - `App.jsx` 에 `<Toasts/>` 가 인증된 화면에서만 렌더링되던 버그도 발견 — 로그인 화면 등에서도
     토스트(예: "세션이 만료되었습니다")가 보이도록 수정.
6. **Dockerfile 작성 (prod)** — multi-stage 빌드 (`node:20-alpine` → `nginx:1.27-alpine`). `VITE_*`
   환경변수는 Vite 가 빌드 시점에 정적 파일에 굽기 때문에 **런타임 env 가 아니라 build-arg 로 넘겨야 함**
   (`--build-arg VITE_API_BASE_URL=... --build-arg VITE_KAKAO_API_KEY=...`). `nginx.conf` 는 SPA
   fallback(`try_files ... /index.html`) + 해시 파일 장기 캐시.
7. **`/admin` 하위 경로 서빙 문제 수정** — 실제 배포 환경은 바깥 nginx 리버스 프록시가
   `location /admin { proxy_pass http://127.0.0.1:5173; }` 로 이 컨테이너를 `/admin` 경로에 매핑함.
   그런데 Vite 빌드 산출물은 기본적으로 `/assets/...` 처럼 **루트 기준 절대경로**를 쓰기 때문에, 브라우저가
   `/admin` 에서 페이지를 열어도 자산 요청은 `http://host/assets/...` 로 나가서 바깥 프록시의 catch-all
   `location /` (다른 프론트엔드, :3000) 로 잘못 라우팅됨. **해결:**
   - `vite.config.js` — `base: '/admin/'` (build 시에만 적용, `npm run dev` 는 그대로 루트)
   - `main.jsx` — `<BrowserRouter basename={import.meta.env.BASE_URL}>` 로 라우터도 `/admin` 기준으로
     동작하게 함 (하드코딩 없이 Vite 의 base 값을 그대로 따라감)
   - `nginx.conf` (컨테이너 내부) — `/admin/`, `/admin/assets/` 를 `alias` 로 매핑해서 실제 파일과
     연결, `/` 와 `/admin` 은 `/admin/` 로 리다이렉트
   Docker 로 직접 빌드·실행해서 `/admin/`, `/admin/assets/*.js`, `/admin/regions` (SPA 라우트) 모두
   정상 동작 확인함.

## 현재 상태에서 확인이 필요한 것

- **`.env` 에 `VITE_KAKAO_API_KEY` 가 현재 없음** (`VITE_API_BASE_URL` 만 있음, 확인 시점 2026-09-14).
  이전 세션에서는 있었는데 지워진 상태 — 의도적인지 확인 필요. 없으면 카카오맵은 "설정되지 않았습니다"
  에러만 뜨고 나머지 화면은 정상 동작함 (fail-soft 처리되어 있음).
- 이 저장소는 `origin` 에 push 된 상태 (`d771f6e` 까지). 이후 이 문서를 커밋할지는 사용자에게 물어볼 것 —
  **사용자가 명시적으로 커밋을 요청할 때만 커밋**하는 규칙을 계속 지킬 것.
- 실제 백엔드 로그인 테스트 계정(`admin@seongsu.or.kr`)이 있다는 걸 확인했으나 비밀번호는 이 문서에
  기록하지 않음(레포에 커밋될 문서이므로) — 필요하면 사용자에게 다시 요청할 것.
- 자동화 테스트가 전혀 없음(unit/e2e 전무). 화면 검증은 매번 실제 브라우저(또는 Docker 컨테이너)로
  수동 확인하는 방식으로 진행했음.

## 개발 환경 메모

- **(2026-09-14 갱신) 현재 세션은 프로젝트가 `/home/immin/hackathon-main-project/main-project-admin-frontend`
  (순수 WSL 파일시스템 경로, `F:\`/`/mnt/f/` 아님)에 있고, Docker 29.8.0 / Node.js v25.2.1 / npm 11.6.2가
  전부 이 환경에서 직접 사용 가능함을 확인했다.** 아래는 이전 세션(Windows 호스트 + `F:\` 드라이브를 WSL이
  마운트해서 쓰던 환경)의 기록으로, DrvFs 관련 HMR 미반영 이슈는 파일이 순수 WSL 경로에 있는 현재 세션에는
  적용되지 않을 가능성이 높다(경로가 바뀌었으니 재확인 필요).
- **이전 세션 기준 OS**: Windows. 프로젝트 경로는 `F:\main-project-admin-frontend` (Windows) = `/mnt/f/main-project-admin-frontend` (WSL).
- **이전 세션 기준 Node/npm**: Windows 에 없고 WSL(Ubuntu-24.04)에 nvm 으로 설치돼 있었음. 커맨드 실행 예시:
  ```bash
  wsl -d Ubuntu-24.04 -- bash -ic "cd /mnt/f/main-project-admin-frontend && nvm use v25.2.1 >/dev/null && npm run build"
  ```
- **주의(이전 세션 기록, F:\ 드라이브 사용 시에만 해당): WSL 이 F:\ 드라이브(DrvFs)의 파일 변경을 항상 감지하지는 못함.** Windows 쪽에서 파일을
  고쳤는데 WSL 에서 이미 떠 있는 `npm run dev` 가 반영을 안 하는 경우가 여러 번 있었음 — 코드를 고쳤는데
  브라우저에 반영이 안 되는 것 같으면 **먼저 dev 서버를 재시작**해서 캐시/HMR 문제인지 확인할 것
  (내용이 실제로 안 바뀐 건지 헷갈리지 말 것). 현재 세션처럼 프로젝트가 순수 WSL 경로에 있으면 이 문제는
  해당하지 않을 것으로 보인다.
- **Docker 도 (이전 세션·현재 세션 모두) WSL 안에서 정상 동작 확인됨** (`docker version` 동작 확인됨). Dockerfile 검증은 실제로
  `docker build` + `docker run` 해서 확인하는 방식으로 진행했음 (README 의 "prod용 Dockerfile" 섹션,
  또는 위 세션 히스토리 6/7번 참고).
- **실제 백엔드**는 이 머신(사용자 PC)에서 별도로 떠 있고, 프론트 dev 서버 기준으로
  `http://172.30.208.1:8080` 로 접근함 (`.env` 의 `VITE_API_BASE_URL`). 이 IP 는 사용자 환경에 종속적인
  값이라 다른 머신에서는 다를 수 있음.
- Claude Code 의 브라우저 프리뷰 도구(sandboxed browser)는 이 사설 IP(`172.30.208.1`)로 매번 붙을 수
  있는 게 아니었음(연결 되다 안 되다 함) — 실제 백엔드로 붙는 검증이 필요하면 사용자에게 직접 확인을
  부탁하거나, WSL 안에서 간이 mock 서버를 띄워 구조적으로만 검증하는 우회가 필요할 수 있음.

## 참고: 코드/설계 상세는 README.md 로

- 상태 관리, API 매핑 규칙, 세션 유지, 라우팅 동작 방식, 유지되는 업무 규칙(삭제 차단 등)은 모두
  [README.md](README.md) 에 최신으로 정리돼 있음. 새 기능을 추가하거나 스펙을 다시 확인할 때는
  README 를 1차로 참고하고, 실제 동작이 README 와 다르면 **README 가 아니라 코드/실제 서버 응답을
  기준으로 판단**할 것 (API 문서-실제 불일치 사례가 이미 한 번 있었음 — 위 2번 항목).

## (2026-09-14) User 코스 추천 기능 — 이 프로젝트는 카피 한 줄만 변경

프론트(main-project-frontend)와 백엔드에 "사용자가 직접 코스를 만들어 즉시 게시" 기능이 추가됐다.
조사 결과 이 어드민 프론트의 검수 큐(`src/screens/Review.jsx`)·코스 목록/상세·대시보드·API 레이어가
이미 `type=user`를 완전히 제네릭하게(AI와 동일한 방식으로) 처리하고 있어서, **구조적인 변경은 전혀
필요 없었다.** 유일한 변경: `Review.jsx`의 승인 안내 문구가 "승인 시 status=published 로 전환됩니다"
였는데, 사용자 코스는 검수 큐에 들어올 때 이미 게시된 상태라 오해를 줄 수 있어서 `type === 'user'`일
때만 "이미 사용자에게 공개된 코스입니다. 승인하면 보너스 리워드가 연결됩니다."로 문구를 분기했다
(그 외 로직 변경 없음). `npm install && npm run build` 통과 확인함. 백엔드 실제 기동 후 사용자 코스
생성→검수 큐 노출→승인(보너스 리워드)/반려(공개 목록에서 사라짐)까지 curl로 전체 플로우 검증했고
(백엔드 `instructions.md` §9 참고), 이 화면을 브라우저로 직접 클릭해서 확인하는 것은 아직 안 했음 —
다음 작업자가 `npm run dev`로 검수 큐의 "사용자 제출" 탭에서 새 문구와 승인/반려 동작을 확인할 것.
