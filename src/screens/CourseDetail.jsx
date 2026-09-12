import { useEffect } from 'react';
import { useAdmin } from '../state/AdminContext.jsx';
import Corners from '../components/Corners.jsx';
import { Svg, paths } from '../components/Icon.jsx';
import { num, coordsOf } from '../lib/format.js';

export default function CourseDetail() {
  const {
    state,
    patch,
    region,
    place,
    getCourseFull,
    ensureCourseFull,
    closeCourseDetail,
    deleteCourse,
    updateCourse,
    moveDraft,
    addDraft,
    removeDraft,
    saveCoursePlaces,
    dragFrom
  } = useAdmin();

  useEffect(() => {
    if (state.openCourseId != null) ensureCourseFull(state.openCourseId);
  }, [state.openCourseId]);

  const cur = getCourseFull(state.openCourseId);

  useEffect(() => {
    if (cur && cur._detailLoaded && state.draftPlaces === null) {
      patch({ draftPlaces: cur.places.slice() });
    }
  }, [cur && cur._detailLoaded, state.draftPlaces]);

  if (!cur) return null;

  if (!cur._detailLoaded) {
    return (
      <div style={{ animation: 'omFade .22s ease-out' }}>
        <button className="btn btn-ghost" onClick={closeCourseDetail} style={{ marginBottom: 12 }}>
          ← 코스 목록
        </button>
        <div style={{ padding: '54px 20px', textAlign: 'center', border: '1px dashed var(--color-divider)' }}>
          코스 상세를 불러오는 중…
        </div>
      </div>
    );
  }

  const draft = state.draftPlaces || cur.places;
  const pq = state.poolSearch.trim().toLowerCase();
  const poolList = state.places
    .filter((p) => !draft.includes(p.id))
    .filter((p) => {
      if (!pq) return true;
      const rn = (region(p.region_id) || {}).name || '';
      return `${p.name} ${rn} ${p.category}`.toLowerCase().includes(pq);
    });

  const blocked = cur.participants > 0;

  return (
    <div style={{ animation: 'omFade .22s ease-out' }}>
      <button className="btn btn-ghost" onClick={closeCourseDetail} style={{ marginBottom: 12 }}>
        ← 코스 목록
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--color-accent-700)',
              marginBottom: 4
            }}
          >
            GET /admin/courses/{cur.id}
          </div>
          <h2 style={{ margin: 0 }}>{cur.name}</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-neutral-700)' }}>
            {cur.description || '설명이 없습니다'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap', flex: 'none' }}>
          <div className="field">
            <label>status</label>
            <select
              className="input"
              value={cur.status}
              style={{ minWidth: 140 }}
              onChange={(e) =>
                updateCourse(
                  cur.id,
                  { status: e.target.value },
                  'status 를 변경했습니다',
                  `PUT /admin/courses/${cur.id} {status:"${e.target.value}"}`
                )
              }
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="archived">archived</option>
            </select>
          </div>

          <div className="field">
            <label>연결 리워드</label>
            <select
              className="input"
              value={cur.reward_id ? String(cur.reward_id) : ''}
              style={{ minWidth: 190 }}
              onChange={(e) => {
                const v = e.target.value;
                updateCourse(
                  cur.id,
                  { reward_id: v ? parseInt(v, 10) : null },
                  '리워드 연결을 변경했습니다',
                  `PUT /admin/courses/${cur.id} {reward_id:${v || 'null'}}`
                );
              }}
            >
              <option value="">연결 없음</option>
              {state.rewards.map((r) => (
                <option key={r.id} value={String(r.id)}>
                  {r.name} · 재고 {r.stock}
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn btn-secondary"
            onClick={() => deleteCourse(cur)}
            title={blocked ? `참가자 ${num(cur.participants)}명 — status 를 archived 로 전환하세요` : '삭제 가능'}
            style={
              blocked
                ? { opacity: 0.55, color: 'var(--color-neutral-600)', borderStyle: 'dashed' }
                : undefined
            }
          >
            코스 삭제
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 14,
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: 16,
          padding: '12px 14px',
          border: '1px solid var(--color-divider)',
          background: 'var(--color-neutral-100)'
        }}
      >
        <label className="radio" style={{ gap: 9 }}>
          <input
            type="checkbox"
            checked={cur.is_ordered}
            onChange={(e) =>
              updateCourse(
                cur.id,
                { is_ordered: e.target.checked },
                'is_ordered 를 변경했습니다',
                `PUT /admin/courses/${cur.id} {is_ordered:${e.target.checked}}`
              )
            }
          />
          <span className="dot" />
          <span>is_ordered — 방문 순서를 강제</span>
        </label>
        <span style={{ fontSize: 12, color: 'var(--color-neutral-700)', flex: 1, minWidth: 200 }}>
          {cur.is_ordered
            ? 'visit_order 대로 QR 을 찍어야 완주로 인정됩니다.'
            : '순서 없이 모든 Place 를 찍으면 완주로 인정됩니다.'}
        </span>
        {state.dirty && (
          <span className="tag tag-outline" style={{ flex: 'none' }}>
            저장되지 않은 구성 변경
          </span>
        )}
        <button
          className="btn btn-primary"
          onClick={saveCoursePlaces}
          style={state.dirty ? undefined : { opacity: 0.5, cursor: 'not-allowed' }}
        >
          구성 전체 저장
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(380px,1fr))', gap: 20, alignItems: 'start' }}>
        {/* Place 풀 */}
        <div className="card blueprint" style={{ padding: 14, gap: 10 }}>
          <Corners />
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
            <h4 style={{ margin: 0 }}>Place 풀</h4>
            <span style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>{poolList.length}개 선택 가능</span>
          </div>
          <input
            className="input"
            placeholder="이름 · 지역 검색"
            value={state.poolSearch}
            onChange={(e) => patch({ poolSearch: e.target.value })}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 430, overflowY: 'auto' }}>
            {poolList.map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  border: '1px solid var(--color-divider)',
                  background: 'var(--color-bg)'
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>
                    {(region(p.region_id) || {}).name || '—'} · {p.category}
                  </div>
                </div>
                <button className="btn btn-secondary" onClick={() => addDraft(p.id)} style={{ flex: 'none' }}>
                  추가 +
                </button>
              </div>
            ))}
            {poolList.length === 0 && (
              <div
                style={{
                  padding: '22px 10px',
                  textAlign: 'center',
                  fontSize: 13,
                  color: 'var(--color-neutral-600)',
                  border: '1px dashed var(--color-divider)'
                }}
              >
                추가할 수 있는 Place 가 없습니다
              </div>
            )}
          </div>
        </div>

        {/* visit_order */}
        <div className="card blueprint" style={{ padding: 14, gap: 10 }}>
          <Corners />
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
            <h4 style={{ margin: 0 }}>코스 구성 · visit_order</h4>
            <span style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>드래그 또는 ↑↓ 로 정렬</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minHeight: 120 }}>
            {draft.map((pid, i) => {
              const p = place(pid) || { name: '삭제된 Place', category: '—', latitude: 0, longitude: 0, region_id: 0 };
              return (
                <div
                  key={`${pid}-${i}`}
                  draggable
                  onDragStart={() => {
                    dragFrom.current = i;
                  }}
                  onDragOver={(ev) => ev.preventDefault()}
                  onDrop={(ev) => {
                    ev.preventDefault();
                    if (dragFrom.current != null && dragFrom.current !== i) moveDraft(dragFrom.current, i);
                    dragFrom.current = null;
                  }}
                  onDragEnd={() => {
                    dragFrom.current = null;
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    border: '1px solid var(--color-divider)',
                    background: 'var(--color-bg)',
                    cursor: 'default'
                  }}
                >
                  <Svg size={14} stroke="var(--color-neutral-600)" style={{ flex: 'none', cursor: 'grab' }}>
                    <path d={paths.grip} />
                  </Svg>
                  <span
                    style={{
                      flex: 'none',
                      width: 26,
                      height: 26,
                      display: 'grid',
                      placeItems: 'center',
                      background: 'var(--color-accent-900)',
                      color: 'var(--color-bg)',
                      fontFamily: 'var(--font-heading)',
                      fontSize: 13
                    }}
                  >
                    {i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>
                      {(region(p.region_id) || {}).name || '—'} · {coordsOf(p)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flex: 'none' }}>
                    <button className="btn btn-secondary btn-icon" title="위로" onClick={() => moveDraft(i, i - 1)} style={iconBtn}>
                      <Svg size={13}>
                        <path d={paths.chevronUp} />
                      </Svg>
                    </button>
                    <button className="btn btn-secondary btn-icon" title="아래로" onClick={() => moveDraft(i, i + 1)} style={iconBtn}>
                      <Svg size={13}>
                        <path d={paths.chevronDown2} />
                      </Svg>
                    </button>
                    <button className="btn btn-secondary btn-icon" title="제거" onClick={() => removeDraft(i)} style={iconBtn}>
                      <Svg size={13}>
                        <path d={paths.minus} />
                      </Svg>
                    </button>
                  </div>
                </div>
              );
            })}
            {draft.length === 0 && (
              <div
                style={{
                  padding: '34px 10px',
                  textAlign: 'center',
                  fontSize: 13,
                  color: 'var(--color-neutral-600)',
                  border: '1px dashed var(--color-divider)'
                }}
              >
                왼쪽 풀에서 Place 를 추가하세요
              </div>
            )}
          </div>

          <div
            style={{
              borderTop: '1px solid var(--color-divider)',
              paddingTop: 10,
              fontSize: 12,
              color: 'var(--color-neutral-700)',
              fontFamily: 'ui-monospace,Menlo,monospace',
              wordBreak: 'break-all'
            }}
          >
            PUT body → [{draft.map((pid, i) => `{place_id:${pid},visit_order:${i + 1}}`).join(', ')}]
          </div>
        </div>
      </div>
    </div>
  );
}

const iconBtn = { width: 28, height: 28 };
