import { useAdmin } from '../state/AdminContext.jsx';
import Corners from '../components/Corners.jsx';
import { Notice, ErrorBanner } from '../components/Notice.jsx';

const ORG_TYPES = [
  { value: 'government', label: '지자체·공공기관' },
  { value: 'company', label: '민간기업' },
  { value: 'facility', label: '시설·재단' }
];

export default function Register() {
  const { state, patch, submitRegister } = useAdmin();
  const g = state.regForm;

  const set = (k) => (e) => {
    const v = e.target.value;
    patch((s) => ({ regForm: { ...s.regForm, [k]: v, error: '' } }));
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        overflowY: 'auto',
        background: 'var(--color-bg)',
        padding: '36px 28px'
      }}
    >
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <button className="btn btn-ghost" onClick={() => patch({ auth: 'login' })} style={{ marginBottom: 14 }}>
          ← 로그인으로
        </button>

        <div className="card blueprint" style={{ padding: 26, gap: 15, background: 'var(--color-bg)' }}>
          <Corners />
          <div>
            <h3 style={{ margin: 0 }}>조직 가입</h3>
            <p style={{ margin: '5px 0 0', fontSize: 13, color: 'var(--color-neutral-700)' }}>
              조직과 관리자 계정이 함께 만들어지고, 가입하면 바로 로그인돼요.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 13 }}>
            <div className="field">
              <label>조직 이름 *</label>
              <input className="input" value={g.organization_name} onChange={set('organization_name')} placeholder="예: 성수문화재단" />
            </div>
            <div className="field">
              <label>조직 유형</label>
              <select className="input" value={g.organization_type} onChange={set('organization_type')}>
                {ORG_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>담당자 이름 *</label>
              <input className="input" value={g.admin_name} onChange={set('admin_name')} placeholder="담당자 이름" />
            </div>
            <div className="field">
              <label>담당자 이메일 *</label>
              <input className="input" value={g.admin_email} onChange={set('admin_email')} placeholder="admin@organization.kr" />
            </div>
          </div>

          <div className="field">
            <label>비밀번호 * — 8자 이상</label>
            <input
              className="input"
              type="password"
              value={g.admin_password}
              onChange={set('admin_password')}
              placeholder="••••••••"
            />
          </div>

          <Notice>가입하면 별도 로그인 없이 바로 어드민 화면으로 들어갈 수 있어요.</Notice>

          {g.error && <ErrorBanner>{g.error}</ErrorBanner>}

          <button
            className="btn btn-primary btn-block"
            onClick={submitRegister}
            disabled={g.loading}
            style={g.loading ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
          >
            {g.loading ? '생성 중…' : '조직 생성하고 시작하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
