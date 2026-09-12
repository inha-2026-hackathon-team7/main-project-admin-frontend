import { useAdmin } from '../state/AdminContext.jsx';
import Corners from '../components/Corners.jsx';
import { PageHead } from '../components/Notice.jsx';
import { PlusIcon } from '../components/Icon.jsx';
import { num, blockedBtn } from '../lib/format.js';

export default function Rewards() {
  const { state, coursesUsingReward, openRewardForm, deleteReward } = useAdmin();

  return (
    <div style={{ animation: 'omFade .22s ease-out' }}>
      <PageHead
        kicker="P0 · REWARDS"
        title="리워드 관리"
        desc="포인트 · 쿠폰/바우처 · 재고 보충은 PUT /admin/rewards/{id}"
      >
        <button className="btn btn-primary" onClick={() => openRewardForm(null, false)} style={{ flex: 'none' }}>
          <PlusIcon />
          리워드 생성
        </button>
      </PageHead>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(272px,1fr))', gap: 20 }}>
        {state.rewards.map((r) => {
          const used = coursesUsingReward(r.id).length;
          const stockTag = r.stock === 0 ? '품절' : r.stock <= 50 ? '재고 임박' : '정상';
          return (
            <div key={r.id} className="card blueprint" style={{ padding: 16, gap: 9 }}>
              <Corners />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`tag ${r.kind === '포인트' ? 'tag-accent' : 'tag-accent-2'}`}>{r.kind}</span>
                <span className="tag tag-neutral" style={{ marginLeft: 'auto' }}>
                  {stockTag}
                </span>
              </div>
              <div className="card-title">{r.name}</div>
              <p className="card-body">{r.description || '설명이 없습니다'}</p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                  padding: '9px 0',
                  borderTop: '1px solid var(--color-divider)',
                  borderBottom: '1px solid var(--color-divider)'
                }}
              >
                <div>
                  <div style={statLabel}>stock</div>
                  <div style={statValue}>{num(r.stock)}</div>
                </div>
                <div>
                  <div style={statLabel}>valid_until</div>
                  <div style={statValue}>{r.valid_until || '무기한'}</div>
                </div>
              </div>

              <div style={{ fontSize: 12, color: 'var(--color-neutral-700)' }}>
                {used ? `연결 코스 ${used}개 — 삭제하려면 연결을 먼저 해제하세요` : '연결된 코스 없음 — 삭제 가능'}
              </div>

              <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                <button className="btn btn-secondary" onClick={() => openRewardForm(r, true)}>
                  재고 보충
                </button>
                <button className="btn btn-secondary" onClick={() => openRewardForm(r, false)}>
                  수정
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => deleteReward(r)}
                  title={used ? `코스 ${used}개가 연결 중 — 삭제 불가` : '삭제 가능'}
                  style={blockedBtn(used > 0)}
                >
                  삭제
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const statLabel = {
  fontSize: 10,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--color-neutral-600)'
};
const statValue = { fontFamily: 'var(--font-heading)', fontSize: 20, lineHeight: 1.2 };
