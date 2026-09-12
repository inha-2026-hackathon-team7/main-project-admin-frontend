import { useAdmin } from '../state/AdminContext.jsx';
import Corners from '../components/Corners.jsx';
import { Notice, ErrorBanner } from '../components/Notice.jsx';

/** organizations.organization_type — SQL 스키마의 enum 3종 */
const ORG_TYPES = [
  { value: 'government', label: 'government — 지자체·공공' },
  { value: 'company', label: 'company — 민간기업' },
  { value: 'facility', label: 'facility — 시설·재단' }
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
            <div
              style={{
                fontSize: 10,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--color-accent-700)'
              }}
            >
              POST /admin/auth/register
            </div>
            <h3 style={{ margin: '2px 0 0' }}>조직 가입</h3>
            <p style={{ margin: '5px 0 0', fontSize: 13, color: 'var(--color-neutral-700)' }}>
              organizations · users(role=organization) · organization_members(role=owner) 가 하나의 트랜잭션으로
              생성되고, 가입 즉시 로그인 처리됩니다.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 13 }}>
            <div className="field">
              <label>organization_name *</label>
              <input className="input" value={g.organization_name} onChange={set('organization_name')} placeholder="예: 성수문화재단" />
            </div>
            <div className="field">
              <label>organization_type</label>
              <select className="input" value={g.organization_type} onChange={set('organization_type')}>
                {ORG_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>admin_name *</label>
              <input className="input" value={g.admin_name} onChange={set('admin_name')} placeholder="담당자 이름" />
            </div>
            <div className="field">
              <label>admin_email *</label>
              <input className="input" value={g.admin_email} onChange={set('admin_email')} placeholder="admin@organization.kr" />
            </div>
          </div>

          <div className="field">
            <label>admin_password * — 8자 이상</label>
            <input
              className="input"
              type="password"
              value={g.admin_password}
              onChange={set('admin_password')}
              placeholder="••••••••"
            />
          </div>

          <Notice>
            가입 응답으로 organization_id · user_id · access_token 이 함께 내려오므로 별도 로그인 호출 없이 어드민으로
            진입합니다.
          </Notice>

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
