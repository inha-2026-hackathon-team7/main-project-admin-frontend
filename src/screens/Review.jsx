import { useAdmin } from '../state/AdminContext.jsx';
import Corners from '../components/Corners.jsx';
import { PageHead } from '../components/Notice.jsx';

export default function Review() {
  const { state, patch } = useAdmin();

  const queue = state.pending;

  return (
    <div style={{ animation: 'omFade .22s ease-out' }}>
      <PageHead
        kicker="P1 · REVIEW QUEUE"
        title="사용자 코스 검수"
        desc="이용자가 직접 만들어 이미 공개한 코스를 확인하고, 승인하며 마음에 드는 코스에는 보너스 리워드를 함께 줄 수 있어요"
        marginBottom={18}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1000 }}>
        {queue.map((p) => (
          <div key={p.id} className="card blueprint" style={{ padding: 16, gap: 12 }}>
            <Corners />
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span className="tag tag-neutral">사용자 제작</span>
                  <span style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>{p.created_at}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 21, lineHeight: 1.2 }}>{p.name}</div>
                <div style={{ fontSize: 13, color: 'var(--color-neutral-700)', marginTop: 3 }}>
                  만든 사람 {p.creator} · {p.place_count}개 경유지
                </div>
              </div>
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
                이미 사용자에게 공개된 코스예요. 승인하면 보너스 리워드를 연결할 수 있고, 반려하면 목록에서 숨겨져요.
              </span>
            </div>
          </div>
        ))}

        {queue.length === 0 && (
          <div style={{ padding: '54px 20px', textAlign: 'center', border: '1px dashed var(--color-divider)' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20 }}>대기 중인 코스가 없습니다</div>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--color-neutral-700)' }}>
              검수를 마친 코스는 코스 관리 화면에서 확인할 수 있어요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
