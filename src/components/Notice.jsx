import { InfoIcon, Svg, paths } from './Icon.jsx';

/** 강조 배경의 안내 박스 */
export function Notice({ children, style }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        alignItems: 'flex-start',
        padding: '10px 12px',
        background: 'var(--color-accent-100)',
        fontSize: 12,
        color: 'var(--color-accent-800)',
        ...style
      }}
    >
      <InfoIcon style={{ flex: 'none', marginTop: 2 }} />
      <span>{children}</span>
    </div>
  );
}

/** 본문 하단의 작은 설명 문단 */
export function Hint({ children, maxWidth = 640 }) {
  return (
    <p
      style={{
        margin: '14px 0 0',
        fontSize: 12,
        color: 'var(--color-neutral-700)',
        display: 'flex',
        gap: 7,
        alignItems: 'flex-start',
        maxWidth
      }}
    >
      <InfoIcon style={{ flex: 'none', marginTop: 2 }} />
      <span>{children}</span>
    </p>
  );
}

/** 오류 배너 (반전 배경) */
export function ErrorBanner({ children }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        alignItems: 'flex-start',
        padding: '10px 12px',
        background: 'var(--color-accent-900)',
        color: 'var(--color-bg)',
        fontSize: 12
      }}
    >
      <Svg size={14} style={{ flex: 'none', marginTop: 2 }}>
        <path d={paths.warnBody} />
        <path d={paths.warnDot} />
        <circle cx="12" cy="12" r="9" />
      </Svg>
      <span>{children}</span>
    </div>
  );
}

/** 화면 상단 제목 블록 */
export function PageHead({ kicker, title, desc, children, marginBottom = 20 }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 16,
        flexWrap: 'wrap',
        marginBottom
      }}
    >
      <div style={{ flex: 1, minWidth: 240 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--color-accent-700)',
            marginBottom: 4
          }}
        >
          {kicker}
        </div>
        <h2 style={{ margin: 0 }}>{title}</h2>
        {desc && (
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-neutral-700)' }}>{desc}</p>
        )}
      </div>
      {children}
    </div>
  );
}
