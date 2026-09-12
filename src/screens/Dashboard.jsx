import { useEffect } from 'react';
import { useAdmin } from '../state/AdminContext.jsx';
import Corners from '../components/Corners.jsx';
import { Svg, WarnCircleIcon, paths } from '../components/Icon.jsx';
import { num, pct, typeTag, statusTag } from '../lib/format.js';

export default function Dashboard() {
  const { state, patch, go, place, reward, getCourseFull, ensureCourseFull, openCourse, openRewardForm } =
    useAdmin();

  const dashCourseId = state.dashCourseId ?? (state.courses[0] && state.courses[0].id);

  useEffect(() => {
    if (dashCourseId != null) ensureCourseFull(dashCourseId);
  }, [dashCourseId]);

  const dc = dashCourseId != null ? getCourseFull(dashCourseId) : null;
  const rew = dc && dc.reward_id ? reward(dc.reward_id) : null;
  const perDay = dc ? dc.reward_claimed / 30 : 0;

  const stage = (label, v, base, note) => ({
    label,
    note,
    value: num(v),
    pctLabel: `${pct(v, base)}%`,
    width: base ? Math.max(pct(v, base), 1) : 0
  });

  const funnel = dc
    ? [
        stage('조회', dc.view_count, dc.view_count, '코스 상세 진입'),
        stage('참가', dc.participants, dc.view_count, '참가 전환'),
        stage('완주', dc.completed, dc.view_count, '전 구간 체크인'),
        stage('리워드 수령', dc.reward_claimed, dc.view_count, '리워드 지급 완료')
      ]
    : [];

  const ratios = dc
    ? [
        { label: '참가 전환율', value: `${pct(dc.participants, dc.view_count)}%`, note: 'participants / view_count' },
        { label: '완주율', value: `${pct(dc.completed, dc.participants)}%`, note: 'completed / participants' },
        { label: '리워드 수령률', value: `${pct(dc.reward_claimed, dc.completed)}%`, note: 'reward_claimed / completed' },
        { label: '이탈률', value: `${pct(dc.abandoned, dc.participants)}%`, note: 'abandoned / participants' }
      ]
    : [];

  const kpis = dc
    ? [
        { label: 'view_count', value: num(dc.view_count), note: '상세 진입 기준' },
        { label: 'participants', value: num(dc.participants), note: 'course_enrollments' },
        { label: 'completed', value: num(dc.completed), note: `완주율 ${pct(dc.completed, dc.participants)}%` },
        { label: 'abandoned', value: num(dc.abandoned), note: `이탈률 ${pct(dc.abandoned, dc.participants)}%` },
        { label: 'reward_claimed', value: num(dc.reward_claimed), note: `수령률 ${pct(dc.reward_claimed, dc.completed)}%` }
      ]
    : [];

  /** 구간별 통과 추정 — 실제 체크인 로그 API 가 생기면 이 계산을 대체하세요. */
  const stops = dc && dc.places
    ? dc.places.map((pid, i) => {
        const p = place(pid) || { name: '삭제된 Place' };
        const base = dc.participants ? dc.completed / dc.participants || 0.5 : 0;
        const keep = dc.participants
          ? Math.round(dc.participants * Math.pow(base, (i + 1) / dc.places.length))
          : 0;
        const prev =
          i === 0
            ? dc.participants
            : Math.round(dc.participants * Math.pow(base, i / dc.places.length));
        return {
          order: i + 1,
          name: p.name,
          rate: pct(keep, dc.participants),
          value: `${num(keep)}명 통과 · ${pct(keep, dc.participants)}%`,
          dropLabel: `−${num(Math.max(0, prev - keep))}명`
        };
      })
    : [];

  const rewardOutlook = !dc
    ? ''
    : rew
      ? rew.stock === 0
        ? `${rew.name} 재고 0 — 완주자에게 지급이 중단된 상태입니다`
        : perDay > 0
          ? `${rew.name} 재고 ${num(rew.stock)}개 · 최근 30일 수령 속도(${perDay.toFixed(1)}건/일) 기준 약 ${Math.floor(rew.stock / perDay)}일 후 소진`
          : `${rew.name} 재고 ${num(rew.stock)}개 · 최근 수령 기록 없음`
      : '리워드가 연결되지 않아 수령 지표가 집계되지 않습니다';

  const stockAlerts = state.rewards.filter((r) => r.stock <= 50);

  return (
    <div style={{ animation: 'omFade .22s ease-out' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', marginBottom: 22 }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--color-accent-700)',
              marginBottom: 4
            }}
          >
            P1 · COURSE ANALYTICS
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0 }}>{dc ? dc.name : '코스 없음'}</h2>
            {dc && <span className={`tag ${typeTag(dc.type)}`}>{dc.type}</span>}
            {dc && <span className={`tag ${statusTag(dc.status)}`}>{dc.status}</span>}
          </div>
          {dc && (
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-neutral-700)' }}>
              GET /admin/courses/{dc.id}/stats · {dc.place_count}개 Place ·{' '}
              {dc.is_ordered ? 'is_ordered=true' : 'is_ordered=false'} · {rew ? rew.name : '연결된 리워드 없음'}
            </p>
          )}
        </div>
        <div className="seg" style={{ flex: 'none' }}>
          {['30일', '90일', '전체'].map((label, i) => (
            <label className="seg-opt" key={label}>
              <input type="radio" name="omrange" defaultChecked={i === 0} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 코스 선택 */}
      <div style={{ marginBottom: 18 }}>
        <div
          style={{
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--color-neutral-600)',
            marginBottom: 7
          }}
        >
          코스 선택 — 지표는 선택한 코스 기준입니다
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10 }}>
          {state.courses.map((c) => {
            const on = dc && c.id === dc.id;
            return (
              <div
                key={c.id}
                className="om-course-chip"
                onClick={() => patch({ dashCourseId: c.id })}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  padding: '10px 12px',
                  cursor: 'pointer',
                  border: `1px solid ${on ? 'var(--color-accent)' : 'var(--color-divider)'}`,
                  background: on ? 'var(--color-accent-100)' : 'var(--color-bg)'
                }}
              >
                <span className={`tag ${statusTag(c.status)}`} style={{ alignSelf: 'flex-start' }}>
                  {c.status}
                </span>
                <div
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 600,
                    fontSize: 16,
                    lineHeight: 1.2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {c.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>
                  조회 {num(c.view_count)} · {num(c.participants)}명 참가
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(178px,1fr))', gap: 18, marginBottom: 26 }}>
        {kpis.map((k) => (
          <div key={k.label} className="card blueprint" style={{ gap: 6, padding: '15px 16px' }}>
            <Corners />
            <div className="card-kicker">{k.label}</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 34, lineHeight: 1 }}>
              {k.value}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>{k.note}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(380px,1fr))', gap: 20, alignItems: 'start' }}>
        {/* 퍼널 */}
        <div className="card blueprint" style={{ padding: 16, gap: 14 }}>
          <Corners />
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
            <h4 style={{ margin: 0 }}>전환 퍼널</h4>
            <span style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>view_count 대비 비율</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {funnel.map((fn) => (
              <div key={fn.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12, marginBottom: 4 }}>
                  <span>
                    <span style={{ fontWeight: 500 }}>{fn.label}</span>{' '}
                    <span style={{ color: 'var(--color-neutral-600)' }}>{fn.note}</span>
                  </span>
                  <span style={{ flex: 'none', fontVariantNumeric: 'tabular-nums' }}>
                    {fn.value} · {fn.pctLabel}
                  </span>
                </div>
                <div style={{ height: 10, background: 'var(--color-neutral-200)' }}>
                  <div style={{ height: '100%', width: `${fn.width}%`, background: 'var(--color-accent)' }} />
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(118px,1fr))',
              gap: 12,
              borderTop: '1px solid var(--color-divider)',
              paddingTop: 13
            }}
          >
            {ratios.map((rt) => (
              <div key={rt.label}>
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--color-neutral-600)'
                  }}
                >
                  {rt.label}
                </div>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 25, lineHeight: 1.15 }}>
                  {rt.value}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: 'var(--color-neutral-600)',
                    fontFamily: 'ui-monospace,Menlo,monospace'
                  }}
                >
                  {rt.note}
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--color-divider)', paddingTop: 13 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 9 }}>
              <h4 style={{ margin: 0 }}>구간별 통과 · 추정</h4>
              <span className="tag tag-outline">체크인 로그 API 필요</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                fontSize: 10,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--color-neutral-600)',
                marginBottom: 5
              }}
            >
              전 구간 대비 이탈
            </div>
            {dc && !dc.places && (
              <div style={{ fontSize: 12, color: 'var(--color-neutral-600)', padding: '6px 0' }}>불러오는 중…</div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {stops.map((st) => (
                <div key={st.order} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      flex: 'none',
                      width: 22,
                      height: 22,
                      display: 'grid',
                      placeItems: 'center',
                      background: 'var(--color-accent-100)',
                      color: 'var(--color-accent-800)',
                      fontSize: 11
                    }}
                  >
                    {st.order}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, marginBottom: 3 }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{st.name}</span>
                      <span style={{ flex: 'none', color: 'var(--color-neutral-700)' }}>{st.value}</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--color-neutral-200)' }}>
                      <div style={{ height: '100%', width: `${Math.max(st.rate, 1)}%`, background: 'var(--color-accent)' }} />
                    </div>
                  </div>
                  <span style={{ flex: 'none', width: 56, textAlign: 'right', fontSize: 11, color: 'var(--color-accent-800)' }}>
                    {st.dropLabel}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'flex-start',
              padding: '10px 12px',
              background: 'var(--color-accent-100)',
              fontSize: 12,
              color: 'var(--color-accent-800)'
            }}
          >
            <Svg size={14} style={{ flex: 'none', marginTop: 2 }}>
              <path d={paths.gift} />
              <path d={paths.giftLid} />
            </Svg>
            <span>{rewardOutlook}</span>
          </div>

          {dc && (
            <button className="btn btn-secondary" onClick={() => openCourse(dc)} style={{ alignSelf: 'flex-start' }}>
              이 코스 구성 편집 →
            </button>
          )}
        </div>

        {/* 사이드 카드 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card blueprint" style={{ padding: 16 }}>
            <Corners />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <h4 style={{ margin: 0 }}>검수 대기</h4>
              <button className="btn btn-ghost" onClick={() => go('review')}>
                검수 큐 열기 →
              </button>
            </div>
            {state.pending.slice(0, 3).map((p) => (
              <div
                key={p.id}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: '1px solid var(--color-divider)' }}
              >
                <span className={`tag ${p.type === 'ai' ? 'tag-accent-2' : 'tag-neutral'}`} style={{ flex: 'none' }}>
                  {p.type === 'ai' ? 'AI' : 'USER'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>
                    {p.creator} · {p.place_count}개 경유지 · {p.created_at}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card blueprint" style={{ padding: 16 }}>
            <Corners />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <h4 style={{ margin: 0 }}>리워드 재고 경고</h4>
              <button className="btn btn-ghost" onClick={() => go('rewards')}>
                리워드 관리 →
              </button>
            </div>
            {stockAlerts.map((r) => (
              <div
                key={r.id}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: '1px solid var(--color-divider)' }}
              >
                <WarnCircleIcon stroke="var(--color-accent-700)" style={{ flex: 'none' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>
                    {r.stock === 0
                      ? '재고 0 — 사용자단 지급이 중단됩니다'
                      : `재고 ${r.stock}개 남음 · valid_until ${r.valid_until || '무기한'}`}
                  </div>
                </div>
                <button className="btn btn-secondary" onClick={() => openRewardForm(r, true)} style={{ flex: 'none' }}>
                  보충
                </button>
              </div>
            ))}
          </div>

          <div className="card blueprint" style={{ padding: 16 }}>
            <Corners />
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
              <h4 style={{ margin: 0 }}>추가 지표 제안</h4>
              <span style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>현재 스펙에 없는 값</span>
            </div>
            {PROPOSALS.map((pr) => (
              <div key={pr.label} style={{ padding: '9px 0', borderTop: '1px solid var(--color-divider)' }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{pr.label}</div>
                <div style={{ fontSize: 12, color: 'var(--color-neutral-700)', marginTop: 2, textWrap: 'pretty' }}>{pr.why}</div>
                <div
                  style={{
                    fontSize: 11,
                    fontFamily: 'ui-monospace,Menlo,monospace',
                    color: 'var(--color-accent-700)',
                    marginTop: 4
                  }}
                >
                  {pr.api}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const PROPOSALS = [
  {
    label: 'Place별 체크인 타임스탬프',
    why: '이탈이 발생하는 구간과 평균 소요 시간을 알 수 있습니다',
    api: 'GET /admin/courses/{id}/checkins'
  },
  {
    label: '일자별 참가·완주 추이',
    why: '현재는 누적값만 있어 캠페인 효과를 시점으로 끊어볼 수 없습니다',
    api: 'GET /admin/courses/{id}/stats?group_by=day'
  },
  {
    label: '유입 경로 / 재방문 여부',
    why: 'QR 스캔과 앱 내 탐색을 구분하면 오프라인 홍보물 성과를 분리할 수 있습니다',
    api: 'GET /admin/courses/{id}/stats?dimension=source'
  }
];
