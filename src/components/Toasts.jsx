import { useAdmin } from '../state/AdminContext.jsx';
import { Svg, paths } from './Icon.jsx';

const ICONS = {
  warn: `${paths.warnBody}M12 17h.01M10.3 3.9 1.8 18.1A2 2 0 0 0 3.5 21h17a2 2 0 0 0 1.7-2.9L13.7 3.9a2 2 0 0 0-3.4 0Z`,
  info: 'M12 16v-5M12 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  ok: 'm5 13 4 4L19 7'
};

export default function Toasts() {
  const { state, patch } = useAdmin();

  return (
    <div
      style={{
        position: 'fixed',
        right: 20,
        bottom: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        zIndex: 60,
        maxWidth: 400
      }}
    >
      {state.toasts.map((t) => {
        const warn = t.kind === 'warn';
        const info = t.kind === 'info';
        return (
          <div
            key={t.id}
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
              padding: '12px 14px',
              animation: 'omToast .22s ease-out',
              boxShadow: 'var(--shadow-md)',
              border: `1px solid ${warn ? 'var(--color-accent-900)' : info ? 'var(--color-divider)' : 'var(--color-accent)'}`,
              background: warn
                ? 'var(--color-accent-900)'
                : info
                  ? 'var(--color-neutral-100)'
                  : 'var(--color-bg)',
              color: warn ? 'var(--color-bg)' : 'var(--color-text)'
            }}
          >
            <Svg size={16} style={{ flex: 'none', marginTop: 1 }}>
              <path d={warn ? ICONS.warn : info ? ICONS.info : ICONS.ok} />
            </Svg>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, lineHeight: 1.25 }}>
                {t.title}
              </div>
              <div style={{ fontSize: 12, opacity: 0.82, marginTop: 2, wordBreak: 'break-word' }}>
                {t.detail}
              </div>
            </div>
            <button
              className="om-toast-close"
              onClick={() => patch((s) => ({ toasts: s.toasts.filter((x) => x.id !== t.id) }))}
              style={{
                flex: 'none',
                background: 'none',
                border: 0,
                color: 'inherit',
                cursor: 'pointer',
                opacity: 0.7,
                padding: 0,
                lineHeight: 1
              }}
            >
              <Svg size={14}>
                <path d={paths.close} />
              </Svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
