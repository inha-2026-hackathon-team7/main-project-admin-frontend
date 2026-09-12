import { useAdmin } from '../state/AdminContext.jsx';
import Corners from './Corners.jsx';

const SPAN_LAT = 0.05;
const SPAN_LNG = 0.062;

/**
 * 좌표 픽커 — 실제 서비스에서는 react-kakao-maps-sdk 의 <Map onClick> 으로 교체하세요.
 * onClick 이 반환하는 latlng 를 그대로 form.latitude / form.longitude 에 넣으면 됩니다.
 */
export default function MapPicker() {
  const { state, patch } = useAdmin();
  const f = state.form || {};

  const pickRegionId = parseInt(f.region_id, 10);
  const ref = state.places.filter((p) => p.region_id === pickRegionId && p.id !== f.id);
  const base = ref.length
    ? {
        lat: ref.reduce((a, p) => a + p.latitude, 0) / ref.length,
        lng: ref.reduce((a, p) => a + p.longitude, 0) / ref.length
      }
    : { lat: 37.5665, lng: 126.978 };

  const pickedLat = parseFloat(f.latitude);
  const pickedLng = parseFloat(f.longitude);
  const hasPick = !Number.isNaN(pickedLat) && !Number.isNaN(pickedLng);
  const center = hasPick ? { lat: pickedLat, lng: pickedLng } : base;

  const toXY = (lat, lng) => ({
    x: ((lng - (center.lng - SPAN_LNG / 2)) / SPAN_LNG) * 100,
    y: (1 - (lat - (center.lat - SPAN_LAT / 2)) / SPAN_LAT) * 100
  });

  const onPick = (ev) => {
    const r = ev.currentTarget.getBoundingClientRect();
    const fx = (ev.clientX - r.left) / r.width;
    const fy = (ev.clientY - r.top) / r.height;
    const lat = center.lat + (0.5 - fy) * SPAN_LAT;
    const lng = center.lng + (fx - 0.5) * SPAN_LNG;
    patch((s) => ({
      form: { ...s.form, latitude: lat.toFixed(6), longitude: lng.toFixed(6), error: '' }
    }));
  };

  const onClear = () =>
    patch((s) => ({ form: { ...s.form, latitude: '', longitude: '' } }));

  return (
    <>
      <div className="field">
        <label>위치 * — 지도를 클릭해 좌표를 지정하세요</label>
        <div
          className="blueprint"
          onClick={onPick}
          style={{
            position: 'relative',
            height: 216,
            background: 'var(--color-neutral-100)',
            cursor: 'crosshair',
            backgroundImage:
              'repeating-linear-gradient(to right,color-mix(in srgb,var(--color-text) 7%,transparent) 0 1px,transparent 1px 12.5%),repeating-linear-gradient(to bottom,color-mix(in srgb,var(--color-text) 7%,transparent) 0 1px,transparent 1px 12.5%)'
          }}
        >
          <Corners />
          {ref.map((p) => {
            const xy = toXY(p.latitude, p.longitude);
            return (
              <div
                key={p.id}
                title={p.name}
                style={{
                  position: 'absolute',
                  left: `${xy.x.toFixed(2)}%`,
                  top: `${xy.y.toFixed(2)}%`,
                  width: 9,
                  height: 9,
                  margin: '-4.5px 0 0 -4.5px',
                  border: '1.5px solid var(--color-accent-600)',
                  pointerEvents: 'none'
                }}
              />
            );
          })}
          {hasPick && (
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 15,
                height: 15,
                margin: '-7.5px 0 0 -7.5px',
                background: 'var(--color-accent)',
                border: '1.5px solid var(--color-accent-800)',
                boxShadow: '0 0 0 6px color-mix(in srgb,var(--color-accent) 22%,transparent)',
                pointerEvents: 'none'
              }}
            />
          )}
          <div
            style={{
              position: 'absolute',
              left: 8,
              top: 8,
              padding: '3px 7px',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-divider)',
              fontSize: 10,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--color-neutral-700)'
            }}
          >
            react-kakao-maps-sdk · Map onClick
          </div>
          <div
            style={{
              position: 'absolute',
              left: 8,
              bottom: 8,
              fontSize: 10,
              fontFamily: 'ui-monospace,Menlo,monospace',
              color: 'var(--color-neutral-700)'
            }}
          >
            center {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
          fontSize: 12,
          color: 'var(--color-neutral-700)'
        }}
      >
        <span style={{ flex: 1, minWidth: 180 }}>
          {hasPick
            ? `선택 좌표 ${pickedLat.toFixed(6)}, ${pickedLng.toFixed(6)}`
            : '지도를 클릭하면 latitude / longitude 가 채워집니다'}
        </span>
        <button className="btn btn-secondary" onClick={onClear} style={{ flex: 'none' }}>
          좌표 초기화
        </button>
      </div>
    </>
  );
}
