import { useAdmin } from '../state/AdminContext.jsx';
import { Svg } from './Icon.jsx';

export const NAV = [
  { key: 'dashboard', label: '대시보드', tier: 'P1', icon: 'M3 13h5v8H3zM10 3h4v18h-4zM16 9h5v12h-5z' },
  { key: 'regions', label: '지역 관리', tier: 'P0', icon: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z' },
  { key: 'places', label: 'Place 관리', tier: 'P0', icon: 'M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15' },
  { key: 'courses', label: '코스 관리', tier: 'P0', icon: 'M4 19h4a4 4 0 0 0 0-8H9a4 4 0 0 1 0-8h11M4 19h.01M20 3h.01' },
  { key: 'rewards', label: '리워드 관리', tier: 'P0', icon: 'M4 9h16v12H4zM4 9l2-5h12l2 5M12 4v17' },
  { key: 'review', label: '사용자/AI 코스 검수', tier: 'P1', icon: 'M9 12l2 2 4-4M4 4h16v16H4z' }
];

/** @param {{ showTierBadges?: boolean }} props */
export default function Sidebar({ showTierBadges = false }) {
  const { state, go } = useAdmin();

  return (
    <nav
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        padding: '16px 0',
        background: 'var(--color-neutral-100)',
        borderRight: '1px solid var(--color-divider)',
        overflowY: 'auto'
      }}
    >
      <div
        style={{
          padding: '0 16px 10px',
          fontSize: 10,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--color-neutral-600)'
        }}
      >
        운영 메뉴
      </div>

      {NAV.map((n) => {
        const on = state.screen === n.key;
        const badge = n.key === 'review' && state.pending.length ? String(state.pending.length) : '';
        return (
          <div
            key={n.key}
            className="om-nav-item"
            onClick={() => go(n.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 14px',
              cursor: 'pointer',
              fontFamily: 'var(--font-heading)',
              fontWeight: 600,
              fontSize: 15,
              letterSpacing: '0.01em',
              borderLeft: `2px solid ${on ? 'var(--color-accent)' : 'transparent'}`,
              background: on ? 'var(--color-accent-100)' : 'transparent',
              color: on ? 'var(--color-accent-800)' : 'var(--color-text)'
            }}
          >
            <Svg size={17} style={{ flex: 'none' }}>
              <path d={n.icon} />
            </Svg>
            <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{n.label}</span>
            {badge && (
              <span
                style={{
                  flex: 'none',
                  minWidth: 19,
                  padding: '1px 5px',
                  textAlign: 'center',
                  fontFamily: 'var(--font-body)',
                  fontSize: 11,
                  background: 'var(--color-accent-900)',
                  color: 'var(--color-bg)'
                }}
              >
                {badge}
              </span>
            )}
            {showTierBadges && (
              <span
                style={{
                  flex: 'none',
                  fontFamily: 'var(--font-body)',
                  fontSize: 10,
                  letterSpacing: '0.06em',
                  color: 'var(--color-neutral-500)'
                }}
              >
                {n.tier}
              </span>
            )}
          </div>
        );
      })}

      <div
        style={{
          marginTop: 'auto',
          padding: '16px 16px 0',
          borderTop: '1px solid var(--color-divider)',
          fontSize: 11,
          lineHeight: 1.6,
          color: 'var(--color-neutral-600)'
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 12,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-neutral-700)',
            marginBottom: 4
          }}
        >
          API BASE
        </div>
        <div style={{ fontFamily: 'ui-monospace,Menlo,monospace' }}>/admin/*</div>
        <div style={{ marginTop: 6 }}>access_token · role=organization</div>
      </div>
    </nav>
  );
}
