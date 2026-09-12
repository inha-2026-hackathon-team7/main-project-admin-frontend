/** 새로고침 시 로그인 상태 유지를 위한 아주 단순한 localStorage 세션 저장소. */
const KEY = 'admin_session_v1';

export function loadPersistedSession() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || !data.token || !data.session) return null;
    return data;
  } catch {
    return null;
  }
}

export function savePersistedSession(token, session) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ token, session }));
  } catch {
    /* localStorage 사용 불가 — 새로고침 시 재로그인이 필요할 뿐 앱 동작에는 지장 없음 */
  }
}

export function clearPersistedSession() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* no-op */
  }
}
