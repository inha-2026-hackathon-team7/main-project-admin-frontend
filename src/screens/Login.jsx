import { useAdmin } from '../state/AdminContext.jsx';
import Corners from '../components/Corners.jsx';
import { ErrorBanner } from '../components/Notice.jsx';
import { PinIcon } from '../components/Icon.jsx';

export default function Login() {
  const { state, patch, submitLogin } = useAdmin();
  const lf = state.loginForm;

  const set = (k) => (e) => {
    const v = e.target.value;
    patch((s) => ({ loginForm: { ...s.loginForm, [k]: v, error: '' } }));
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))',
        background: 'var(--color-bg)'
      }}
    >
      <div
        style={{
          background: 'var(--color-accent-900)',
          color: 'var(--color-bg)',
          padding: '44px 40px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <PinIcon size={24} stroke="currentColor" />
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 21 }}>지역 코스 어드민</span>
        </div>
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
            fontSize: 40,
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            marginTop: 'auto',
            wordBreak: 'keep-all',
            textWrap: 'pretty'
          }}
        >
          지역 · Place · 코스 · 리워드를 한 곳에서 운영합니다
        </div>
        <p style={{ margin: 0, fontSize: 14, opacity: 0.82, maxWidth: 380, textWrap: 'pretty' }}>
          조직 단위로 지역과 Place 를 등록하고, QR 체크인으로 완주를 판정하고, 리워드 재고까지 같은 콘솔에서
          관리합니다.
        </p>
        <div style={{ display: 'flex', gap: 26, marginTop: 12, flexWrap: 'wrap' }}>
          {[
            [state.places.length, 'PLACES'],
            [state.courses.length, 'COURSES'],
            [state.rewards.length, 'REWARDS']
          ].map(([n, label]) => (
            <div key={label}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 26 }}>{n}</div>
              <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.7 }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', placeItems: 'center', padding: '40px 32px', overflowY: 'auto' }}>
        <div
          className="card blueprint"
          style={{ width: 'min(380px,100%)', padding: 26, gap: 15, background: 'var(--color-bg)' }}
        >
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
              POST /auth/login
            </div>
            <h3 style={{ margin: '2px 0 0' }}>관리자 로그인</h3>
            <p style={{ margin: '5px 0 0', fontSize: 13, color: 'var(--color-neutral-700)' }}>
              role=organization 계정만 어드민 라우트로 진입합니다.
            </p>
          </div>

          <div className="field">
            <label>email</label>
            <input className="input" value={lf.email} onChange={set('email')} placeholder="admin@organization.kr" />
          </div>
          <div className="field">
            <label>password</label>
            <input
              className="input"
              type="password"
              value={lf.password}
              onChange={set('password')}
              placeholder="••••••••"
              onKeyDown={(e) => e.key === 'Enter' && submitLogin()}
            />
          </div>

          {lf.error && <ErrorBanner>{lf.error}</ErrorBanner>}

          <button
            className="btn btn-primary btn-block"
            onClick={submitLogin}
            disabled={lf.loading}
            style={lf.loading ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
          >
            {lf.loading ? '로그인 중…' : '로그인'}
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              borderTop: '1px solid var(--color-divider)',
              paddingTop: 12,
              fontSize: 13
            }}
          >
            <span style={{ color: 'var(--color-neutral-700)' }}>조직이 아직 없나요?</span>
            <button className="btn btn-ghost" onClick={() => patch({ auth: 'register' })}>
              조직 가입 →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
