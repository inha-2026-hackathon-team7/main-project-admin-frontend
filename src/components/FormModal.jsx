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
    region: f.id ? '지역 수정' : '지역 추가',
    place: f.id ? '장소 수정' : '장소 추가',
    reward: f.restock ? '재고 보충' : f.id ? '리워드 수정' : '리워드 추가',
    course: '코스 만들기',
    approve: '코스 승인',
    reject: '코스 반려'
  };
  return map[f.kind] || '';
}

export default function FormModal() {
  const { state, patch, closeModal, setField, submitForm } = useAdmin();
  const f = state.form || {};
  const title = titleFor(f);

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
              <label>지역 이름 *</label>
              <input className="input" value={f.name || ''} onChange={field('name')} placeholder="예: 성수·서울숲" />
            </div>
            <div className="field">
              <label>지역 유형</label>
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
              <label>장소 이름 *</label>
              <input className="input" value={f.name || ''} onChange={field('name')} placeholder="예: 언더스탠드에비뉴" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="field">
                <label>소속 지역 *</label>
                <select className="input" value={f.region_id || ''} onChange={field('region_id')}>
                  {regionOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>분류</label>
                <input className="input" value={f.category || ''} onChange={field('category')} placeholder="카페 · 명소 · 전망" />
              </div>
            </div>

            <MapPicker />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="field">
                <label>위도 *</label>
                <input className="input" value={f.latitude || ''} onChange={field('latitude')} placeholder="지도 클릭 시 자동 입력" />
              </div>
              <div className="field">
                <label>경도 *</label>
                <input className="input" value={f.longitude || ''} onChange={field('longitude')} placeholder="지도 클릭 시 자동 입력" />
              </div>
            </div>
            <div className="field">
              <label>대표 사진 링크</label>
              <input className="input" value={f.image_url || ''} onChange={field('image_url')} placeholder="https://…" />
            </div>
            <Notice>QR 코드는 저장하면 시스템이 자동으로 만들어줘요 — 직접 입력하지 않아도 됩니다.</Notice>
          </div>
        )}

        {f.kind === 'reward' && (
          <div style={{ display: 'grid', gap: 12 }}>
            <div className="field">
              <label>리워드 이름 *</label>
              <input className="input" value={f.name || ''} onChange={field('name')} placeholder="예: 성수 로컬 포인트" />
            </div>
            <div className="field">
              <label>유형{f.id ? ' — 한번 정하면 나중에 바꿀 수 없어요' : ''}</label>
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
              <label>설명{f.id ? ' — 등록할 때만 입력할 수 있고, 이후에는 수정할 수 없어요' : ''}</label>
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
                <label>재고 수량 *</label>
                <input className="input" value={f.stock || ''} onChange={field('stock')} placeholder="1000" />
              </div>
              <div className="field">
                <label>사용 기한</label>
                <input className="input" value={f.valid_until || ''} onChange={field('valid_until')} placeholder="2026-12-31" />
              </div>
            </div>
          </div>
        )}

        {f.kind === 'course' && (
          <div style={{ display: 'grid', gap: 12 }}>
            <div className="field">
              <label>코스 이름 *</label>
              <input className="input" value={f.name || ''} onChange={field('name')} placeholder="예: 성수 로컬 크래프트 투어" />
            </div>
            <div className="field">
              <label>코스 소개</label>
              <textarea className="input" value={f.description || ''} onChange={field('description')} />
            </div>
            <div className="field">
              <label>연결할 리워드</label>
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
              <span>정해진 순서대로 방문해야 완주로 인정</span>
            </label>
            <Notice>
              이렇게 만든 코스는 공식 코스로 등록되고, 아직 준비중 상태예요. 코스에 포함할 장소는 만든 뒤
              상세 화면에서 정할 수 있어요.
            </Notice>
          </div>
        )}

        {f.kind === 'reject' && (
          <div style={{ display: 'grid', gap: 12 }}>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-neutral-700)' }}>
              {f.subject} 을 반려합니다. 반려하면 이 코스는 더 이상 사용자에게 보이지 않고, 사유는 만든
              사람에게 그대로 전달됩니다.
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
              <label>반려 사유</label>
              <textarea className="input" value={f.reason || ''} onChange={field('reason')} placeholder="반려 사유를 입력하세요" />
            </div>
          </div>
        )}

        {f.kind === 'approve' && (
          <div style={{ display: 'grid', gap: 12 }}>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-neutral-700)' }}>
              {f.subject} 은 이미 사용자에게 공개돼 있어요. 승인하면 코스 관리 목록에 반영되고, 마음에
              든다면 보너스 리워드를 함께 연결할 수 있어요.
            </p>
            <div className="field">
              <label>보너스 리워드 (선택)</label>
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
