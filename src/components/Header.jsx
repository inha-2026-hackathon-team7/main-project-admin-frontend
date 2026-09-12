import { useEffect, useState } from 'react';
import { useAdmin } from '../state/AdminContext.jsx';
import { Svg, Icon, PinIcon, paths } from './Icon.jsx';

export default function Header() {
  const { state, patch, toast, session, logout, reloadAll } = useAdmin();
  const org = session || { org_name: '조직', admin_name: '—', admin_email: '', role: 'organization', initials: '?' };

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  const clock = `${now.toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })} KST`;

  const closeMenu = () => patch({ menuOpen: false });

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '0 20px',
        height: 56,
        flex: 'none',
        background: 'var(--color-neutral-100)',
        borderBottom: '1px solid var(--color-divider)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 'auto', minWidth: 0 }}>
        <PinIcon />
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
            fontSize: 19,
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap'
          }}
        >
          {org.org_name}
        </span>
        <span className="tag tag-outline" style={{ flex: 'none' }}>
          organization
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          color: 'var(--color-neutral-700)',
          whiteSpace: 'nowrap'
        }}
      >
        <Svg size={14}>
          <circle cx="12" cy="12" r="9" />
          <path d={paths.clock} />
        </Svg>
        <span>{clock}</span>
      </div>

      <button
        className="btn btn-secondary"
        title="목록을 다시 불러옵니다"
        onClick={() => {
          reloadAll();
          toast('info', '새로고침했습니다', 'GET /admin/regions · places · courses · rewards · courses/pending');
        }}
      >
        새로고침
      </button>

      <button
        className="btn btn-secondary btn-icon"
        title="알림"
        style={{ position: 'relative' }}
        onClick={() => {
          const soldOut = state.rewards.filter((r) => r.stock === 0).length;
          const low = state.rewards.filter((r) => r.stock > 0 && r.stock <= 50).length;
          toast(
            'info',
            `알림 ${state.pending.length + soldOut + low}건`,
            `검수 대기 ${state.pending.length}건 · 리워드 품절 ${soldOut}건 · 재고 임박 ${low}건`
          );
        }}
      >
        <Svg size={17}>
          <path d={paths.bell} />
          <path d={paths.bellClapper} />
        </Svg>
        <span
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 6,
            height: 6,
            background: 'var(--color-accent)'
          }}
        />
      </button>

      <div style={{ width: 1, height: 28, background: 'var(--color-divider)' }} />

      <div style={{ position: 'relative' }}>
        <div
          className="om-hoverable"
          onClick={() => patch((s) => ({ menuOpen: !s.menuOpen }))}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            padding: '5px 8px',
            cursor: 'pointer',
            border: '1px solid var(--color-divider)'
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              flex: 'none',
              display: 'grid',
              placeItems: 'center',
              background: 'var(--color-accent-900)',
              color: 'var(--color-bg)',
              fontFamily: 'var(--font-heading)',
              fontSize: 13,
              letterSpacing: '0.04em'
            }}
          >
            {org.initials}
          </div>
          <div style={{ lineHeight: 1.2, whiteSpace: 'nowrap' }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{org.admin_name}</div>
            <div style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>
              {org.role} · {org.admin_email}
            </div>
          </div>
          <Icon
            d={paths.chevronDown}
            size={14}
            stroke="var(--color-neutral-600)"
            style={{ flex: 'none', marginLeft: 2 }}
          />
        </div>

        {state.menuOpen && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 7px)',
              width: 246,
              zIndex: 70,
              background: 'var(--color-bg)',
              border: '1px solid var(--color-divider)',
              boxShadow: 'var(--shadow-lg)',
              animation: 'omFade .14s ease-out'
            }}
          >
            <div style={{ padding: '11px 13px', borderBottom: '1px solid var(--color-divider)' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16 }}>{org.admin_name}</div>
              <div style={{ fontSize: 11, color: 'var(--color-neutral-600)', marginTop: 1 }}>
                {org.admin_email}
              </div>
              <div style={{ display: 'flex', gap: 5, marginTop: 7 }}>
                <span className="tag tag-accent">{org.role}</span>
                <span className="tag tag-neutral">{org.org_name}</span>
              </div>
            </div>

            <div className="om-menu-item" onClick={closeMenu} style={menuRow}>
              <Svg size={15}>
                <path d={paths.user} />
                <circle cx="12" cy="7" r="4" />
              </Svg>
              프로필 설정
            </div>

            <div
              className="om-menu-item"
              onClick={closeMenu}
              style={{ ...menuRow, borderBottom: '1px solid var(--color-divider)' }}
            >
              <Svg size={15}>
                <path d={paths.building} />
                <path d={paths.buildingDoor} />
              </Svg>
              조직 · 멤버 관리
            </div>

            <div
              className="om-menu-logout"
              onClick={logout}
              style={{ ...menuRow, padding: '10px 13px', color: 'var(--color-accent-800)' }}
            >
              <Svg size={15}>
                <path d={paths.logout} />
                <path d={paths.logoutArrow} />
                <path d={paths.logoutBar} />
              </Svg>
              로그아웃
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

const menuRow = {
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  padding: '9px 13px',
  fontSize: 13,
  cursor: 'pointer'
};
