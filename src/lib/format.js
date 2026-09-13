export const num = (n) => (n || 0).toLocaleString('ko-KR');

export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

export const typeTag = (t) =>
  t === 'official' ? 'tag-accent' : t === 'ai' ? 'tag-accent-2' : 'tag-neutral';

/** 코스 유형의 원본 값(official/user/ai)을 화면에 보여줄 한글 이름으로 바꾼다. */
export const typeLabel = (t) =>
  t === 'official' ? '공식' : t === 'user' ? '사용자 제작' : t === 'ai' ? 'AI 추천' : t;

export const statusTag = (st) =>
  st === 'published' ? 'tag-accent' : st === 'draft' ? 'tag-outline' : 'tag-neutral';

/** 코스 상태의 원본 값(draft/published/archived)을 화면에 보여줄 한글 이름으로 바꾼다. */
export const statusLabel = (st) =>
  st === 'published' ? '게시됨' : st === 'draft' ? '준비중' : st === 'archived' ? '보관됨' : st;

export const coordsOf = (p) => `${p.latitude.toFixed(4)}, ${p.longitude.toFixed(4)}`;

/** 삭제 불가 버튼에 입히는 스타일 */
export const blockedBtn = (off) =>
  off ? { color: 'var(--color-neutral-600)', borderStyle: 'dashed' } : undefined;
