/**
 * 실제 서버 JSON 은 snake_case 로 직렬화됩니다 (api-docs.json 의 schema 섹션은 Java 필드명을
 * 그대로 노출해 camelCase 로 보이지만, 실제 런타임 Jackson 설정은 snake_case — 문서와 실제 응답이
 * 다른 사례 확인됨: 로그인 응답이 accessToken 이 아니라 access_token 으로 내려옴).
 * 쿼리 파라미터(region_id, type, status)는 naming strategy 의 영향을 받지 않아 문서 그대로 맞습니다.
 * 화면 컴포넌트가 쓰는 상태 필드명도 원래 snake_case 라 이 경계의 변환은 대부분 그대로 통과시키는
 * 수준이고, enum 값(대문자)과 리워드 kind(한글 표시) 정도만 실제로 변환합니다.
 */

const REWARD_KIND_FROM_API = { POINT: '포인트', COUPON: '쿠폰' };
const REWARD_KIND_TO_API = { 포인트: 'POINT', 쿠폰: 'COUPON' };

const COURSE_TYPE_FROM_API = { OFFICIAL: 'official', USER: 'user', AI: 'ai' };
const COURSE_STATUS_FROM_API = { DRAFT: 'draft', PUBLISHED: 'published', ARCHIVED: 'archived' };
const COURSE_STATUS_TO_API = { draft: 'DRAFT', published: 'PUBLISHED', archived: 'ARCHIVED' };

/* ── 지역 ─────────────────────────────────── */
export const regionFromApi = (r) => ({
  id: r.id,
  name: r.name,
  type: r.type,
  place_count: r.place_count ?? 0,
  course_count: r.course_count ?? 0
});

export const regionToApi = (f) => ({ name: f.name.trim(), type: f.type });

/* ── Place ────────────────────────────────── */
export const placeFromApi = (p) => ({
  id: p.id,
  name: p.name,
  region_id: p.region_id,
  latitude: p.latitude,
  longitude: p.longitude,
  category: p.category,
  image_url: p.image_url || '',
  qrcode_string: p.qrcode_string,
  ...(p.referencing_courses !== undefined
    ? { referencing_courses: p.referencing_courses.map((c) => ({ name: c.name, status: c.status })) }
    : {})
});

export const placeCreateToApi = (f) => ({
  name: f.name.trim(),
  region_id: parseInt(f.region_id, 10),
  latitude: parseFloat(f.latitude),
  longitude: parseFloat(f.longitude),
  category: f.category || '기타',
  image_url: f.image_url || undefined
});

export const placeUpdateToApi = (f) => ({
  name: f.name.trim(),
  region_id: parseInt(f.region_id, 10),
  latitude: parseFloat(f.latitude),
  longitude: parseFloat(f.longitude),
  category: f.category || '기타',
  image_url: f.image_url || undefined
});

/* ── 리워드 ───────────────────────────────── */
export const rewardFromApi = (r) => ({
  id: r.id,
  name: r.name,
  kind: REWARD_KIND_FROM_API[r.kind] || r.kind,
  description: r.description || '',
  stock: r.stock ?? 0,
  valid_until: r.valid_until ? r.valid_until.slice(0, 10) : '',
  linked_course_count: r.linked_course_count ?? 0
});

export const rewardCreateToApi = (f) => ({
  name: f.name.trim(),
  kind: REWARD_KIND_TO_API[f.kindOf] || 'POINT',
  description: f.description || '',
  stock: parseInt(f.stock, 10),
  valid_until: f.valid_until ? `${f.valid_until}T00:00:00` : undefined
});

/** RewardUpdateRequest 는 name·stock·valid_until 만 받습니다 (kind·description 변경 불가). */
export const rewardUpdateToApi = (f) => ({
  name: f.name.trim(),
  stock: parseInt(f.stock, 10),
  valid_until: f.valid_until ? `${f.valid_until}T00:00:00` : undefined
});

/* ── 코스 ─────────────────────────────────── */
export const courseListItemFromApi = (c) => ({
  id: c.id,
  name: c.name,
  type: COURSE_TYPE_FROM_API[c.type] || String(c.type).toLowerCase(),
  status: COURSE_STATUS_FROM_API[c.status] || String(c.status).toLowerCase(),
  is_ordered: !!c.is_ordered,
  view_count: c.view_count ?? 0,
  place_count: c.place_count ?? 0,
  reward_id: c.reward ? c.reward.id : null,
  reward_name: c.reward ? c.reward.name : null,
  participants: c.participants ?? 0
});

export const courseDetailFromApi = (c) => ({
  id: c.id,
  name: c.name,
  description: c.description || '',
  type: COURSE_TYPE_FROM_API[c.type] || String(c.type).toLowerCase(),
  status: COURSE_STATUS_FROM_API[c.status] || String(c.status).toLowerCase(),
  is_ordered: !!c.is_ordered,
  view_count: c.view_count ?? 0,
  reward_id: c.reward ? c.reward.id : null,
  reward_name: c.reward ? c.reward.name : null,
  places: (c.places || []).map((p) => p.place_id),
  places_full: (c.places || []).map((p) => ({
    course_place_id: p.course_place_id,
    place_id: p.place_id,
    name: p.name,
    visit_order: p.visit_order,
    latitude: p.latitude,
    longitude: p.longitude
  }))
});

export const courseStatsFromApi = (s) => ({
  view_count: s.view_count ?? 0,
  participants: s.participants ?? 0,
  completed: s.completed ?? 0,
  abandoned: s.abandoned ?? 0,
  reward_claimed: s.reward_claimed ?? 0
});

export const courseCreateToApi = (f) => ({
  name: f.name.trim(),
  description: f.description || '',
  is_ordered: !!f.is_ordered,
  reward_id: f.reward_id ? parseInt(f.reward_id, 10) : undefined
});

/** status / reward_id / is_ordered 부분 변경 → PUT /admin/courses/{id} (JsonNode, 부분 JSON) */
export const coursePatchToApi = (patch) => {
  const body = {};
  if ('status' in patch) body.status = COURSE_STATUS_TO_API[patch.status] || patch.status;
  if ('reward_id' in patch) body.reward_id = patch.reward_id;
  if ('is_ordered' in patch) body.is_ordered = patch.is_ordered;
  return body;
};

export const coursePlacesToApi = (placeIds) =>
  placeIds.map((placeId, i) => ({ place_id: placeId, visit_order: i + 1 }));

/* ── 검수 대기 ────────────────────────────── */
export const pendingItemFromApi = (p, type) => ({
  id: p.id,
  name: p.name,
  creator: p.creator,
  created_at: p.created_at,
  type,
  place_count: p.place_count ?? 0,
  ai_confidence: p.ai_confidence != null ? Math.round(p.ai_confidence) : null
});

/* ── 인증 ─────────────────────────────────── */
export const loginToApi = (f) => ({ email: f.email.trim(), password: f.password });

export const registerToApi = (f) => ({
  organization_name: f.organization_name.trim(),
  organization_type: f.organization_type.toUpperCase(),
  admin_name: f.admin_name.trim(),
  admin_email: f.admin_email.trim(),
  admin_password: f.admin_password
});

export const initialsOf = (name) => {
  const t = (name || '').trim();
  if (!t) return '?';
  const parts = t.split(/\s+/);
  return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : t.slice(0, 2).toUpperCase();
};
