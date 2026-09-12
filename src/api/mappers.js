/**
 * api-docs.json 스키마(camelCase, 대문자 enum) ↔ 화면 컴포넌트가 쓰는 snake_case 상태 변환.
 * 화면 컴포넌트는 그대로 두고 이 경계에서만 변환해 변경 범위를 좁힙니다.
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
  place_count: r.placeCount ?? 0,
  course_count: r.courseCount ?? 0
});

export const regionToApi = (f) => ({ name: f.name.trim(), type: f.type });

/* ── Place ────────────────────────────────── */
export const placeFromApi = (p) => ({
  id: p.id,
  name: p.name,
  region_id: p.regionId,
  latitude: p.latitude,
  longitude: p.longitude,
  category: p.category,
  image_url: p.imageUrl || '',
  qrcode_string: p.qrcodeString,
  ...(p.referencingCourses !== undefined
    ? { referencing_courses: p.referencingCourses.map((c) => ({ name: c.name, status: c.status })) }
    : {})
});

export const placeCreateToApi = (f) => ({
  name: f.name.trim(),
  regionId: parseInt(f.region_id, 10),
  latitude: parseFloat(f.latitude),
  longitude: parseFloat(f.longitude),
  category: f.category || '기타',
  imageUrl: f.image_url || undefined
});

export const placeUpdateToApi = (f) => ({
  name: f.name.trim(),
  regionId: parseInt(f.region_id, 10),
  latitude: parseFloat(f.latitude),
  longitude: parseFloat(f.longitude),
  category: f.category || '기타',
  imageUrl: f.image_url || undefined
});

/* ── 리워드 ───────────────────────────────── */
export const rewardFromApi = (r) => ({
  id: r.id,
  name: r.name,
  kind: REWARD_KIND_FROM_API[r.kind] || r.kind,
  description: r.description || '',
  stock: r.stock ?? 0,
  valid_until: r.validUntil ? r.validUntil.slice(0, 10) : '',
  linked_course_count: r.linkedCourseCount ?? 0
});

export const rewardCreateToApi = (f) => ({
  name: f.name.trim(),
  kind: REWARD_KIND_TO_API[f.kindOf] || 'POINT',
  description: f.description || '',
  stock: parseInt(f.stock, 10),
  validUntil: f.valid_until ? `${f.valid_until}T00:00:00` : undefined
});

/** RewardUpdateRequest 스키마는 name·stock·validUntil 만 받습니다 (kind·description 변경 불가). */
export const rewardUpdateToApi = (f) => ({
  name: f.name.trim(),
  stock: parseInt(f.stock, 10),
  validUntil: f.valid_until ? `${f.valid_until}T00:00:00` : undefined
});

/* ── 코스 ─────────────────────────────────── */
export const courseListItemFromApi = (c) => ({
  id: c.id,
  name: c.name,
  type: COURSE_TYPE_FROM_API[c.type] || String(c.type).toLowerCase(),
  status: COURSE_STATUS_FROM_API[c.status] || String(c.status).toLowerCase(),
  is_ordered: !!c.isOrdered,
  view_count: c.viewCount ?? 0,
  place_count: c.placeCount ?? 0,
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
  is_ordered: !!c.isOrdered,
  view_count: c.viewCount ?? 0,
  reward_id: c.reward ? c.reward.id : null,
  reward_name: c.reward ? c.reward.name : null,
  places: (c.places || []).map((p) => p.placeId),
  places_full: (c.places || []).map((p) => ({
    course_place_id: p.coursePlaceId,
    place_id: p.placeId,
    name: p.name,
    visit_order: p.visitOrder,
    latitude: p.latitude,
    longitude: p.longitude
  }))
});

export const courseStatsFromApi = (s) => ({
  view_count: s.viewCount ?? 0,
  participants: s.participants ?? 0,
  completed: s.completed ?? 0,
  abandoned: s.abandoned ?? 0,
  reward_claimed: s.rewardClaimed ?? 0
});

export const courseCreateToApi = (f) => ({
  name: f.name.trim(),
  description: f.description || '',
  isOrdered: !!f.is_ordered,
  rewardId: f.reward_id ? parseInt(f.reward_id, 10) : undefined
});

/** status / reward_id / is_ordered 부분 변경 → PUT /admin/courses/{id} (JsonNode, 부분 JSON) */
export const coursePatchToApi = (patch) => {
  const body = {};
  if ('status' in patch) body.status = COURSE_STATUS_TO_API[patch.status] || patch.status;
  if ('reward_id' in patch) body.rewardId = patch.reward_id;
  if ('is_ordered' in patch) body.isOrdered = patch.is_ordered;
  return body;
};

export const coursePlacesToApi = (placeIds) =>
  placeIds.map((placeId, i) => ({ placeId, visitOrder: i + 1 }));

/* ── 검수 대기 ────────────────────────────── */
export const pendingItemFromApi = (p, type) => ({
  id: p.id,
  name: p.name,
  creator: p.creator,
  created_at: p.createdAt,
  type,
  place_count: p.placeCount ?? 0,
  ai_confidence: p.aiConfidence != null ? Math.round(p.aiConfidence) : null
});

/* ── 인증 ─────────────────────────────────── */
export const loginToApi = (f) => ({ email: f.email.trim(), password: f.password });

export const registerToApi = (f) => ({
  organizationName: f.organization_name.trim(),
  organizationType: f.organization_type.toUpperCase(),
  adminName: f.admin_name.trim(),
  adminEmail: f.admin_email.trim(),
  adminPassword: f.admin_password
});

export const initialsOf = (name) => {
  const t = (name || '').trim();
  if (!t) return '?';
  const parts = t.split(/\s+/);
  return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : t.slice(0, 2).toUpperCase();
};
