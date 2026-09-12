/**
 * 카카오맵 JS SDK 는 index.html <head> 에 정적 <script> 태그로 이미 로드되어 있습니다
 * (SDK 내부가 document.write 로 실제 지도 엔진을 추가 삽입하는데, React 마운트 후 JS 로
 * 동적 주입하면 이 document.write 가 무시/차단되어 ERR_BLOCKED_BY_ORB 로 실패합니다 —
 * 반드시 초기 HTML 파싱 중에 실행되어야 하므로 index.html 쪽에서 로드합니다).
 * 여기서는 그 로드가 끝나기를 기다렸다가 kakao.maps.load() 만 호출합니다.
 */
const KAKAO_KEY = import.meta.env.VITE_KAKAO_API_KEY;

let loadPromise = null;

function waitForKakaoGlobal(timeoutMs = 8000) {
  if (window.kakao && window.kakao.maps) return Promise.resolve(window.kakao);
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      if (window.kakao && window.kakao.maps) {
        resolve(window.kakao);
        return;
      }
      if (Date.now() - start > timeoutMs) {
        reject(
          new Error(
            '카카오맵 스크립트를 불러오지 못했습니다 — index.html 의 script 태그와 .env 의 VITE_KAKAO_API_KEY, 카카오 개발자 콘솔의 플랫폼(Web) 도메인 등록을 확인하세요.'
          )
        );
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });
}

export function loadKakaoMaps() {
  if (!KAKAO_KEY) {
    return Promise.reject(new Error('VITE_KAKAO_API_KEY 가 설정되지 않았습니다 (.env 확인).'));
  }
  if (!loadPromise) {
    loadPromise = waitForKakaoGlobal()
      .then((kakao) => new Promise((resolve) => kakao.maps.load(() => resolve(kakao))))
      .catch((e) => {
        loadPromise = null; // 실패 시 다음 시도에서 재시도할 수 있도록 캐시 해제
        throw e;
      });
  }
  return loadPromise;
}
