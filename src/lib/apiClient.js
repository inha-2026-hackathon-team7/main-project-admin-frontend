/** api-docs.json 의 servers[0].url 을 기본값으로 사용. .env 의 VITE_API_BASE_URL 로 덮어쓸 수 있습니다. */
export const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  'http://localhost:8080';

let accessToken = null;

export const getToken = () => accessToken;
export const setToken = (next) => {
  accessToken = next || null;
};

/** 401 응답을 받았을 때 호출할 핸들러 — AdminProvider 가 마운트 시 등록해 세션 만료를 감지합니다. */
let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function readErrorMessage(res) {
  try {
    const data = await res.json();
    return data.message || data.error || `${res.status} ${res.statusText}`;
  } catch {
    return `${res.status} ${res.statusText}`;
  }
}

/**
 * @param {string} path - /admin/regions 같은 절대 경로
 * @param {{method?: string, body?: unknown, blob?: boolean}} opts
 */
export async function request(path, opts = {}) {
  const { method = 'GET', body, blob = false } = opts;

  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
      },
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new ApiError(`서버(${API_BASE_URL})에 연결할 수 없습니다. 네트워크 상태를 확인하세요.`, 0);
  }

  if (!res.ok) {
    if (res.status === 401 && onUnauthorized) onUnauthorized();
    throw new ApiError(await readErrorMessage(res), res.status);
  }

  if (res.status === 204) return null;
  if (blob) return res.blob();

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
