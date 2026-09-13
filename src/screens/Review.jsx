import { useAdmin } from '../state/AdminContext.jsx';
import Corners from '../components/Corners.jsx';
import { PageHead } from '../components/Notice.jsx';

export default function Review() {
  const { state, patch } = useAdmin();

  const aiCount = state.pending.filter((p) => p.type === 'ai').length;
  const userCount = state.pending.filter((p) => p.type === 'user').length;
  const queue = state.pending.filter((p) => p.type === state.reviewTab);

  return (
    <div style={{ animation: 'omFade .22s ease-out' }}>
      <PageHead
        kicker="P1 · REVIEW QUEUE"
        title="사용자 / AI 코스 검수"
        desc="GET /admin/courses/pending?type=user|ai · 승인 시 보너스 리워드를 함께 지정할 수 있습니다"
        marginBottom={18}
      >
        <div className="seg" style={{ flex: 'none' }}>
          <label className="seg-opt">
            <input
              type="radio"
              name="omrev"
              checked={state.reviewTab === 'ai'}
              onChange={() => patch({ reviewTab: 'ai' })}
            />
            <span>AI 생성 {aiCount}</span>
          </label>
          <label className="seg-opt">
            <input
              type="radio"
              name="omrev"
              checked={state.reviewTab === 'user'}
              onChange={() => patch({ reviewTab: 'user' })}
            />
            <span>사용자 제출 {userCount}</span>
          </label>
        </div>
      </PageHead>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1000 }}>
        {queue.map((p) => (
          <div key={p.id} className="card blueprint" style={{ padding: 16, gap: 12 }}>
            <Corners />
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span className={`tag ${p.type === 'ai' ? 'tag-accent-2' : 'tag-neutral'}`}>
                    {p.type === 'ai' ? 'AI 생성' : '사용자 제출'}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>{p.created_at}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 21, lineHeight: 1.2 }}>{p.name}</div>
                <div style={{ fontSize: 13, color: 'var(--color-neutral-700)', marginTop: 3 }}>
                  제출자 {p.creator} · {p.place_count}개 경유지
                </div>
              </div>
              {p.type === 'ai' && (
                <div style={{ flex: 'none', textAlign: 'right', minWidth: 120 }}>
                  <div
                    style={{
                      fontSize: 10,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--color-neutral-600)'
                    }}
                  >
                    AI 신뢰도
                  </div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: 30, lineHeight: 1 }}>
                    {p.ai_confidence != null ? p.ai_confidence : '—'}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                className="btn btn-primary"
                onClick={() =>
                  patch({
                    modal: 'form',
                    form: { kind: 'approve', id: p.id, subject: `「${p.name}」`, bonus_reward_id: '' }
                  })
                }
              >
                승인
              </button>
              <button
                className="btn btn-secondary"
                onClick={() =>
                  patch({ modal: 'form', form: { kind: 'reject', id: p.id, subject: `「${p.name}」`, reason: '' } })
                }
              >
                반려
              </button>
              <span style={{ fontSize: 12, color: 'var(--color-neutral-600)' }}>
                {p.type === 'ai' && p.ai_confidence != null && p.ai_confidence < 85
                  ? '신뢰도 85 미만 — 동선과 영업시간을 확인하세요'
                  : p.type === 'user'
                  ? '이미 사용자에게 공개된 코스입니다. 승인하면 보너스 리워드가 연결됩니다.'
                  : '승인 시 status=published 로 전환됩니다'}
              </span>
            </div>
          </div>
        ))}

        {queue.length === 0 && (
          <div style={{ padding: '54px 20px', textAlign: 'center', border: '1px dashed var(--color-divider)' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20 }}>대기 중인 코스가 없습니다</div>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--color-neutral-700)' }}>
              검수를 마친 코스는 코스 관리에서 status 로 확인할 수 있습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
