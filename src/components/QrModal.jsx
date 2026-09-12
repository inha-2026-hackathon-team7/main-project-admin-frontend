import { useEffect, useState } from 'react';
import { useAdmin } from '../state/AdminContext.jsx';
import Corners from './Corners.jsx';
import { placesApi } from '../api/endpoints.js';

export default function QrModal() {
  const { state, closeModal, toast, place } = useAdmin();
  const p = place(state.qrId);

  const [qr, setQr] = useState({ loading: true, url: null, error: null });

  useEffect(() => {
    if (!p) return;
    let objectUrl = null;
    setQr({ loading: true, url: null, error: null });
    placesApi
      .qrcode(p.id)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setQr({ loading: false, url: objectUrl, error: null });
      })
      .catch((e) => setQr({ loading: false, url: null, error: e.message }));
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [p && p.id]);

  if (!p) return null;

  return (
    <div className="dialog-backdrop" onClick={closeModal} style={{ zIndex: 45 }}>
      <div
        className="dialog blueprint elev-lg"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(400px,100%)',
          background: 'var(--color-bg)',
          alignItems: 'center',
          textAlign: 'center'
        }}
      >
        <Corners />
        <div
          style={{
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--color-accent-700)'
          }}
        >
          GET /admin/places/{p.id}/qrcode
        </div>
        <div className="dialog-title" style={{ margin: 0 }}>
          {p.name}
        </div>

        <div
          className="duotone blueprint"
          style={{
            width: 168,
            height: 168,
            background: 'var(--color-neutral-100)',
            display: 'grid',
            placeItems: 'center',
            margin: '4px 0'
          }}
        >
          <Corners />
          {qr.loading && <span style={{ fontSize: 12, color: 'var(--color-neutral-600)' }}>불러오는 중…</span>}
          {!qr.loading && qr.error && (
            <span style={{ fontSize: 12, color: 'var(--color-accent-800)', padding: '0 10px' }}>{qr.error}</span>
          )}
          {!qr.loading && qr.url && (
            <img src={qr.url} alt={`${p.name} QR`} width={140} height={140} style={{ objectFit: 'contain' }} />
          )}
        </div>

        <div
          style={{
            fontSize: 11,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--color-neutral-600)'
          }}
        >
          qrcode_string
        </div>
        <div
          style={{
            fontFamily: 'ui-monospace,Menlo,monospace',
            fontSize: 12,
            wordBreak: 'break-all',
            color: 'var(--color-neutral-800)'
          }}
        >
          {p.qrcode_string}
        </div>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-neutral-700)' }}>
          ZXing 으로 즉시 인코딩된 image/png 응답입니다. 현장 부착용 인쇄 시 원본 해상도로 내려받으세요.
        </p>

        <div className="dialog-actions" style={{ justifyContent: 'center', width: '100%' }}>
          <button className="btn btn-secondary" onClick={closeModal}>
            닫기
          </button>
          <button
            className="btn btn-primary"
            disabled={!qr.url}
            style={!qr.url ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            onClick={() => {
              const a = document.createElement('a');
              a.href = qr.url;
              a.download = `${p.name}-qrcode.png`;
              a.click();
              toast('info', 'QR PNG 를 내려받았습니다', `GET /admin/places/${p.id}/qrcode → image/png`);
            }}
          >
            PNG 내려받기
          </button>
        </div>
      </div>
    </div>
  );
}
