import { useEffect } from 'react';
import { useAdmin } from '../state/AdminContext.jsx';
import Corners from '../components/Corners.jsx';
import { PageHead } from '../components/Notice.jsx';
import { PlusIcon, Svg, paths } from '../components/Icon.jsx';
import PlacesMap from '../components/PlacesMap.jsx';
import { coordsOf, blockedBtn } from '../lib/format.js';

export default function Places() {
  const { state, patch, region, place, coursesUsingPlace, ensurePlaceUsage, openPlaceForm, deletePlace } =
    useAdmin();

  const q = state.placeSearch.trim().toLowerCase();
  const filtered = state.places.filter(
    (p) =>
      (state.regionFilter === 'all' || String(p.region_id) === state.regionFilter) &&
      (!q || p.name.toLowerCase().includes(q))
  );

  const sel = place(state.selectedPlaceId) || filtered[0] || state.places[0];
  const selUsage = sel ? coursesUsingPlace(sel.id) : [];
  const selUsageLoaded = sel ? place(sel.id).referencing_courses !== undefined : false;

  useEffect(() => {
    if (sel) ensurePlaceUsage(sel.id);
  }, [sel && sel.id]);

  return (
    <div style={{ animation: 'omFade .22s ease-out' }}>
      <PageHead
        kicker="P0 · PLACES"
        title="장소 관리"
        desc="지역에 속한 장소들이에요. QR 코드는 등록하면 자동으로 발급돼요."
        marginBottom={18}
      >
        <button className="btn btn-primary" onClick={() => openPlaceForm(null)} style={{ flex: 'none' }}>
          <PlusIcon />
          장소 생성
        </button>
      </PageHead>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 300 }}>
          <input
            className="input"
            placeholder="장소 이름 검색"
            value={state.placeSearch}
            onChange={(e) => patch({ placeSearch: e.target.value })}
            style={{ paddingLeft: 32 }}
          />
          <Svg size={15} stroke="var(--color-neutral-600)" style={{ position: 'absolute', left: 10, top: 11 }}>
            <circle cx="11" cy="11" r="7" />
            <path d={paths.search} />
          </Svg>
        </div>
        <select
          className="input"
          value={state.regionFilter}
          onChange={(e) => patch({ regionFilter: e.target.value })}
          style={{ width: 'auto', minWidth: 170 }}
        >
          <option value="all">전체 지역</option>
          {state.regions.map((r) => (
            <option key={r.id} value={String(r.id)}>
              {r.name} ({r.type})
            </option>
          ))}
        </select>
        <span style={{ fontSize: 12, color: 'var(--color-neutral-600)' }}>
          {filtered.length} / {state.places.length}개
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(380px,1fr))', gap: 20, alignItems: 'start' }}>
        <div className="card blueprint" style={{ padding: 0 }}>
          <Corners />
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ minWidth: 720, whiteSpace: 'nowrap' }}>
              <thead>
                <tr>
                  <th style={{ paddingLeft: 16 }}>장소</th>
                  <th>지역</th>
                  <th>분류</th>
                  <th>좌표</th>
                  <th style={{ textAlign: 'right', paddingRight: 16 }}>작업</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const used = coursesUsingPlace(p.id).length;
                  const on = state.selectedPlaceId === p.id;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => patch({ selectedPlaceId: p.id })}
                      style={{ cursor: 'pointer', background: on ? 'var(--color-accent-100)' : undefined }}
                    >
                      <td style={{ paddingLeft: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              width: 7,
                              height: 7,
                              flex: 'none',
                              background: on ? 'var(--color-accent)' : 'var(--color-neutral-400)'
                            }}
                          />
                          <div>
                            <div style={{ fontWeight: 500 }}>{p.name}</div>
                            <div
                              style={{
                                fontSize: 11,
                                color: 'var(--color-neutral-600)',
                                fontFamily: 'ui-monospace,Menlo,monospace'
                              }}
                            >
                              {p.qrcode_string}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: 13 }}>{(region(p.region_id) || {}).name || '—'}</td>
                      <td>
                        <span className="tag tag-accent">{p.category}</span>
                      </td>
                      <td
                        style={{
                          fontSize: 12,
                          fontFamily: 'ui-monospace,Menlo,monospace',
                          color: 'var(--color-neutral-700)',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {coordsOf(p)}
                      </td>
                      <td style={{ paddingRight: 16 }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-secondary btn-icon"
                            title="QR 코드"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              patch({ modal: 'qr', qrId: p.id });
                            }}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <rect x="3" y="3" width="7" height="7" />
                              <rect x="14" y="3" width="7" height="7" />
                              <rect x="3" y="14" width="7" height="7" />
                              <path d="M14 14h3v3h-3zM20 20h1M17 20h.01M20 17h.01" />
                            </svg>
                          </button>
                          <button
                            className="btn btn-secondary"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              openPlaceForm(p);
                            }}
                          >
                            수정
                          </button>
                          <button
                            className="btn btn-secondary"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              deletePlace(p);
                            }}
                            title={used ? `코스 ${used}개에 포함되어 있어 삭제할 수 없습니다` : '삭제 가능'}
                            style={blockedBtn(used > 0)}
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card blueprint" style={{ padding: 16, gap: 12 }}>
          <Corners />
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
            <h4 style={{ margin: 0, whiteSpace: 'nowrap' }}>위치 미리보기</h4>
            <span style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>위도 · 경도</span>
          </div>

          <div style={{ border: '1px solid var(--color-divider)' }}>
            <PlacesMap
              places={filtered}
              selectedId={sel ? sel.id : null}
              onSelect={(id) => patch({ selectedPlaceId: id })}
            />
          </div>

          <div style={{ borderTop: '1px solid var(--color-divider)', paddingTop: 10 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 17, lineHeight: 1.2 }}>
              {sel ? sel.name : '선택된 장소 없음'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-neutral-700)', marginTop: 2 }}>
              {sel ? `${(region(sel.region_id) || {}).name || '—'} · ${sel.category}` : '—'}
            </div>
            <div
              style={{
                fontSize: 12,
                fontFamily: 'ui-monospace,Menlo,monospace',
                color: 'var(--color-neutral-700)',
                marginTop: 6
              }}
            >
              {sel ? coordsOf(sel) : '—'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-neutral-700)', marginTop: 6 }}>
              {!sel
                ? '—'
                : !selUsageLoaded
                  ? '포함된 코스 확인 중…'
                  : selUsage.length
                    ? `이 장소를 포함한 코스 ${selUsage.length}개: ${selUsage.map((c) => c.name).join(', ')}`
                    : '포함된 코스 없음 — 삭제 가능'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
