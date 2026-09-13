import { useAdmin } from '../state/AdminContext.jsx';
import Corners from './Corners.jsx';
import { Svg, InfoIcon, paths } from './Icon.jsx';

export default function AlertModal() {
  const { state, closeModal, runAction } = useAdmin();
  const a = state.alert || {};
  const block = a.severity === 'block';
  const items = a.items || [];

  return (
    <div className="dialog-backdrop" onClick={closeModal} style={{ zIndex: 45 }}>
      <div
        className="dialog blueprint elev-lg"
        onClick={(e) => e.stopPropagation()}
        style={{ width: 'min(500px,100%)', background: 'var(--color-bg)' }}
      >
        <Corners />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div
            style={{
              flex: 'none',
              width: 34,
              height: 34,
              display: 'grid',
              placeItems: 'center',
              background: block ? 'var(--color-accent-900)' : 'var(--color-accent-100)',
              color: block ? 'var(--color-bg)' : 'var(--color-accent-800)'
            }}
          >
            <Svg size={18}>
              <path d={paths.warnBody} />
              <path d={paths.warnDot} />
              <path d={paths.triangle} />
            </Svg>
          </div>
          <div style={{ flex: 1 }}>
            <div className="dialog-title">{a.title}</div>
          </div>
        </div>

        <div className="dialog-body">{a.message}</div>

        {items.length > 0 && (
          <div style={{ border: '1px solid var(--color-divider)', background: 'var(--color-neutral-100)' }}>
            <div
              style={{
                padding: '7px 12px',
                fontSize: 10,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--color-neutral-700)',
                borderBottom: '1px solid var(--color-divider)'
              }}
            >
              {a.itemsLabel}
            </div>
            {items.map((it, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 12px',
                  fontSize: 13,
                  borderBottom: '1px solid color-mix(in srgb,var(--color-text) 7%,transparent)'
                }}
              >
                <span style={{ width: 5, height: 5, background: 'var(--color-accent)', flex: 'none' }} />
                <span style={{ flex: 1, minWidth: 0 }}>{it.name}</span>
                <span style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>{it.note}</span>
              </div>
            ))}
          </div>
        )}

        {a.hint && (
          <div
            style={{
              fontSize: 12,
              color: 'var(--color-neutral-700)',
              display: 'flex',
              gap: 7,
              alignItems: 'flex-start'
            }}
          >
            <InfoIcon style={{ flex: 'none', marginTop: 2 }} />
            <span>{a.hint}</span>
          </div>
        )}

        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={closeModal}>
            {block ? '닫기' : '취소'}
          </button>
          {a.action && (
            <button className="btn btn-primary" onClick={() => runAction(a.action)}>
              {a.actionLabel || '확인'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
