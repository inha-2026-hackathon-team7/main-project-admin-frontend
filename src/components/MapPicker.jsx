import { useEffect, useRef, useState } from 'react';
import { useAdmin } from '../state/AdminContext.jsx';
import Corners from './Corners.jsx';
import { loadKakaoMaps } from '../lib/kakaoMaps.js';

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }; // 서울시청 — 참고할 Place 가 없을 때 기본 중심

export default function MapPicker() {
  const { state, patch } = useAdmin();
  const f = state.form || {};

  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const refMarkersRef = useRef([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');

  const pickRegionId = parseInt(f.region_id, 10);
  const ref = state.places.filter((p) => p.region_id === pickRegionId && p.id !== f.id);
  const refKey = ref.map((p) => p.id).join(',');

  const pickedLat = parseFloat(f.latitude);
  const pickedLng = parseFloat(f.longitude);
  const hasPick = !Number.isNaN(pickedLat) && !Number.isNaN(pickedLng);

  const regionCenter = () =>
    ref.length
      ? {
          lat: ref.reduce((a, p) => a + p.latitude, 0) / ref.length,
          lng: ref.reduce((a, p) => a + p.longitude, 0) / ref.length
        }
      : DEFAULT_CENTER;

  /** 지도 인스턴스 생성 — 마운트 시 1회 */
  useEffect(() => {
    let cancelled = false;
    loadKakaoMaps()
      .then((kakao) => {
        if (cancelled || !mapElRef.current) return;
        const start = hasPick ? { lat: pickedLat, lng: pickedLng } : regionCenter();
        const map = new kakao.maps.Map(mapElRef.current, {
          center: new kakao.maps.LatLng(start.lat, start.lng),
          level: 4
        });
        mapRef.current = map;

        kakao.maps.event.addListener(map, 'click', (mouseEvent) => {
          const latlng = mouseEvent.latLng;
          patch((s) => ({
            form: {
              ...s.form,
              latitude: latlng.getLat().toFixed(6),
              longitude: latlng.getLng().toFixed(6),
              error: ''
            }
          }));
        });

        setStatus('ready');
        // 모달 애니메이션 중 컨테이너 크기가 0이었을 수 있어 다음 틱에 재계산
        setTimeout(() => map.relayout(), 0);
      })
      .catch((e) => {
        if (!cancelled) {
          setStatus('error');
          setError(e.message);
        }
      });
    return () => {
      cancelled = true;
    };
    // 마운트 시 1회만 — 이후 좌표/참조 갱신은 아래 별도 effect 가 담당
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 선택 좌표 마커 표시/이동 */
  useEffect(() => {
    if (status !== 'ready' || !window.kakao || !mapRef.current) return;
    const kakao = window.kakao;
    const map = mapRef.current;
    if (hasPick) {
      const pos = new kakao.maps.LatLng(pickedLat, pickedLng);
      if (!markerRef.current) {
        markerRef.current = new kakao.maps.Marker({ position: pos, map });
      } else {
        markerRef.current.setPosition(pos);
        markerRef.current.setMap(map);
      }
      map.panTo(pos);
    } else if (markerRef.current) {
      markerRef.current.setMap(null);
    }
  }, [status, hasPick, pickedLat, pickedLng]);

  /** 같은 지역의 다른 Place 를 참고 마커로 표시 */
  useEffect(() => {
    if (status !== 'ready' || !window.kakao || !mapRef.current) return;
    const kakao = window.kakao;
    const map = mapRef.current;
    refMarkersRef.current.forEach((m) => m.setMap(null));
    refMarkersRef.current = ref.map(
      (p) =>
        new kakao.maps.Marker({
          position: new kakao.maps.LatLng(p.latitude, p.longitude),
          map,
          opacity: 0.55
        })
    );
    if (!hasPick && ref.length) {
      const c = regionCenter();
      map.setCenter(new kakao.maps.LatLng(c.lat, c.lng));
    }
    return () => {
      refMarkersRef.current.forEach((m) => m.setMap(null));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, refKey]);

  const onClear = () => patch((s) => ({ form: { ...s.form, latitude: '', longitude: '' } }));

  return (
    <>
      <div className="field">
        <label>위치 * — 지도를 클릭해 좌표를 지정하세요</label>
        <div
          className="blueprint"
          style={{ position: 'relative', height: 216, background: 'var(--color-neutral-100)' }}
        >
          <Corners />
          {status !== 'ready' && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'grid',
                placeItems: 'center',
                padding: 16,
                textAlign: 'center',
                fontSize: 12,
                color: status === 'error' ? 'var(--color-accent-800)' : 'var(--color-neutral-600)'
              }}
            >
              {status === 'error' ? error : '지도를 불러오는 중…'}
            </div>
          )}
          <div
            ref={mapElRef}
            style={{ width: '100%', height: '100%', visibility: status === 'ready' ? 'visible' : 'hidden' }}
          />
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
