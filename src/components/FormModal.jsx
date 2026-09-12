import { useAdmin } from '../state/AdminContext.jsx';
import Corners from './Corners.jsx';
import MapPicker from './MapPicker.jsx';
import { Notice, ErrorBanner } from './Notice.jsx';
import { Svg, paths } from './Icon.jsx';

const REJECT_TEMPLATES = [
  '경유지 좌표가 부정확함',
  '영업 종료된 장소가 포함됨',
  '동선이 과도하게 길어 완주가 어려움'
];

function titleFor(f) {
  const map = {
    region: [f.id ? '지역 수정' : '지역 생성', f.id ? `PUT /admin/regions/${f.id}` : 'POST /admin/regions'],
    place: [f.id ? 'Place 수정' : 'Place 생성', f.id ? `PUT /admin/places/${f.id}` : 'POST /admin/places'],
    reward: [
      f.restock ? '재고 보충' : f.id ? '리워드 수정' : '리워드 생성',
      f.id ? `PUT /admin/rewards/${f.id}` : 'POST /admin/rewards'
    ],
    course: ['코스 생성', 'POST /admin/courses'],
    approve: ['코스 승인', `POST /admin/courses/${f.id}/approve`],
    reject: ['코스 반려', `POST /admin/courses/${f.id}/reject`]
  };
  return map[f.kind] || ['', ''];
}

export default function FormModal() {
  const { state, patch, closeModal, setField, submitForm } = useAdmin();
  const f = state.form || {};
  const [title, endpoint] = titleFor(f);

  const field = (k) => (ev) => setField(k, ev);
  const regionOptions = state.regions.map((r) => ({ value: String(r.id), label: `${r.name} (${r.type})` }));
  const rewardOptions = state.rewards.map((r) => ({ value: String(r.id), label: `${r.name} · 재고 ${r.stock}` }));

  const submitLabel =
    f.kind === 'approve' ? '승인' : f.kind === 'reject' ? '반려 제출' : f.id ? '저장' : '생성';

  return (
    <div className="dialog-backdrop" onClick={closeModal} style={{ zIndex: 40 }}>
      <div
        className="dialog blueprint elev-lg"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(520px,100%)',
          background: 'var(--color-bg)',
          maxHeight: '88vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingInline: 'calc(var(--space-4) + 6px)'
        }}
      >
        <Corners />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 10,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--color-accent-700)'
              }}
            >
              {endpoint}
            </div>
            <div className="dialog-title">{title}</div>
          </div>
          <button className="btn btn-secondary btn-icon" onClick={closeModal} title="닫기">
            <Svg size={15}>
              <path d={paths.close} />
            </Svg>
          </button>
        </div>

        {f.kind === 'region' && (
          <div style={{ display: 'grid', gap: 12 }}>
            <div className="field">
              <label>name *</label>
              <input className="input" value={f.name || ''} onChange={field('name')} placeholder="예: 성수·서울숲" />
            </div>
            <div className="field">
              <label>type</label>
              <select className="input" value={f.type || '도심'} onChange={field('type')}>
                {['도심', '문화', '해안', '자연', '상권'].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {f.kind === 'place' && (
          <div style={{ display: 'grid', gap: 12 }}>
            <div className="field">
              <label>name *</label>
              <input className="input" value={f.name || ''} onChange={field('name')} placeholder="예: 언더스탠드에비뉴" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="field">
                <label>region_id *</label>
                <select className="input" value={f.region_id || ''} onChange={field('region_id')}>
                  {regionOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>category</label>
                <input className="input" value={f.category || ''} onChange={field('category')} placeholder="카페 · 명소 · 전망" />
              </div>
            </div>

            <MapPicker />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="field">
                <label>latitude *</label>
                <input className="input" value={f.latitude || ''} onChange={field('latitude')} placeholder="지도 클릭 시 자동 입력" />
              </div>
              <div className="field">
                <label>longitude *</label>
                <input className="input" value={f.longitude || ''} onChange={field('longitude')} placeholder="지도 클릭 시 자동 입력" />
              </div>
            </div>
            <div className="field">
              <label>image_url</label>
              <input className="input" value={f.image_url || ''} onChange={field('image_url')} placeholder="https://…" />
            </div>
            <Notice>qrcode_string 은 서버가 UUID 로 자동 발급합니다 — 관리자가 입력하는 값이 아닙니다.</Notice>
          </div>
        )}

        {f.kind === 'reward' && (
          <div style={{ display: 'grid', gap: 12 }}>
            <div className="field">
              <label>name *</label>
              <input className="input" value={f.name || ''} onChange={field('name')} placeholder="예: 성수 로컬 포인트" />
            </div>
            <div className="field">
              <label>유형{f.id ? ' — 생성 후에는 변경할 수 없습니다 (API 스펙)' : ''}</label>
              <select
                className="input"
                value={f.kindOf || '포인트'}
                disabled={!!f.id}
                onChange={(e) => setField('kindOf', e)}
              >
                <option value="포인트">포인트</option>
                <option value="쿠폰">쿠폰·바우처</option>
              </select>
            </div>
            <div className="field">
              <label>description{f.id ? ' — 수정 API 미지원, 표시만 됩니다' : ''}</label>
              <textarea
                className="input"
                value={f.description || ''}
                onChange={field('description')}
                placeholder="사용 조건, 사용처 등"
                disabled={!!f.id}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="field">
                <label>stock *</label>
                <input className="input" value={f.stock || ''} onChange={field('stock')} placeholder="1000" />
              </div>
              <div className="field">
                <label>valid_until</label>
                <input className="input" value={f.valid_until || ''} onChange={field('valid_until')} placeholder="2026-12-31" />
              </div>
            </div>
          </div>
        )}

        {f.kind === 'course' && (
          <div style={{ display: 'grid', gap: 12 }}>
            <div className="field">
              <label>name *</label>
              <input className="input" value={f.name || ''} onChange={field('name')} placeholder="예: 성수 로컬 크래프트 투어" />
            </div>
            <div className="field">
              <label>description</label>
              <textarea className="input" value={f.description || ''} onChange={field('description')} />
            </div>
            <div className="field">
              <label>reward_id</label>
              <select className="input" value={f.reward_id || ''} onChange={field('reward_id')}>
                <option value="">연결 없음</option>
                {rewardOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <label className="radio" style={{ gap: 9 }}>
              <input type="checkbox" checked={!!f.is_ordered} onChange={field('is_ordered')} />
              <span className="dot" />
              <span>is_ordered — 순서대로 방문해야 완주 처리</span>
            </label>
            <Notice>
              관리자 생성 코스는 type=official · status=draft 로 만들어지고, 구성 Place 는 생성 후 상세 화면에서
              지정합니다.
            </Notice>
          </div>
        )}

        {f.kind === 'reject' && (
          <div style={{ display: 'grid', gap: 12 }}>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-neutral-700)' }}>
              {f.subject} 을 반려합니다. 사유는 제출자에게 그대로 전달됩니다.
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {REJECT_TEMPLATES.map((t) => (
                <button
                  key={t}
                  className="btn btn-secondary"
                  style={{ fontSize: 12 }}
                  onClick={() => patch((s) => ({ form: { ...s.form, reason: t, error: '' } }))}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="field">
              <label>reason</label>
              <textarea className="input" value={f.reason || ''} onChange={field('reason')} placeholder="반려 사유를 입력하세요" />
            </div>
          </div>
        )}

        {f.kind === 'approve' && (
          <div style={{ display: 'grid', gap: 12 }}>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-neutral-700)' }}>
              {f.subject} 을 승인하면 status=published 로 전환되고 코스 관리 목록에 편입됩니다.
            </p>
            <div className="field">
              <label>bonus_reward_id (선택)</label>
              <select className="input" value={f.bonus_reward_id || ''} onChange={field('bonus_reward_id')}>
                <option value="">보너스 없음</option>
                {rewardOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {f.error && <ErrorBanner>{f.error}</ErrorBanner>}

        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={closeModal}>
            취소
          </button>
          <button className="btn btn-primary" onClick={submitForm}>
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
