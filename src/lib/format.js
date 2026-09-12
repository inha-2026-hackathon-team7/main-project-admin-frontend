export const num = (n) => (n || 0).toLocaleString('ko-KR');

export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

export const typeTag = (t) =>
  t === 'official' ? 'tag-accent' : t === 'ai' ? 'tag-accent-2' : 'tag-neutral';

export const statusTag = (st) =>
  st === 'published' ? 'tag-accent' : st === 'draft' ? 'tag-outline' : 'tag-neutral';

export const coordsOf = (p) => `${p.latitude.toFixed(4)}, ${p.longitude.toFixed(4)}`;

/** 삭제 불가 버튼에 입히는 스타일 */
export const blockedBtn = (off) =>
  off ? { color: 'var(--color-neutral-600)', borderStyle: 'dashed' } : undefined;
