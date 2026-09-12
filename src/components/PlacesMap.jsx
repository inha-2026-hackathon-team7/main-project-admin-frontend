import { useEffect, useRef, useState } from 'react';
import { loadKakaoMaps } from '../lib/kakaoMaps.js';

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }; // 서울시청 — 표시할 Place 가 없을 때 기본 중심

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Place 목록을 마커로 보여주는 읽기 전용 미리보기 지도 — 마커/행 클릭 시 onSelect 호출 */
export default function PlacesMap({ places, selectedId, onSelect }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const infoWindowRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');

  const placesKey = places.map((p) => `${p.id}:${p.latitude}:${p.longitude}`).join(',');

  /** 지도 인스턴스 생성 — 마운트 시 1회 */
  useEffect(() => {
    let cancelled = false;
    loadKakaoMaps()
      .then((kakao) => {
        if (cancelled || !elRef.current) return;
        const map = new kakao.maps.Map(elRef.current, {
          center: new kakao.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
          level: 6
        });
        mapRef.current = map;
        infoWindowRef.current = new kakao.maps.InfoWindow({ removable: false, zIndex: 10 });
        setStatus('ready');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Place 목록이 바뀔 때마다 마커 다시 그리고 전체가 보이도록 범위 조정 */
  useEffect(() => {
    if (status !== 'ready' || !window.kakao || !mapRef.current) return;
    const kakao = window.kakao;
    const map = mapRef.current;

    markersRef.current.forEach((m) => m.setMap(null));
    const next = new Map();
    places.forEach((p) => {
      const marker = new kakao.maps.Marker({ position: new kakao.maps.LatLng(p.latitude, p.longitude), map });
      kakao.maps.event.addListener(marker, 'click', () => onSelect(p.id));
      next.set(p.id, marker);
    });
    markersRef.current = next;

    if (places.length) {
      const bounds = new kakao.maps.LatLngBounds();
      places.forEach((p) => bounds.extend(new kakao.maps.LatLng(p.latitude, p.longitude)));
      map.setBounds(bounds, 36);
    } else {
      map.setCenter(new kakao.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, placesKey]);

  /** 선택된 Place 강조 — 정보창 표시 + 중심 이동 */
  useEffect(() => {
    if (status !== 'ready' || !window.kakao || !mapRef.current || !infoWindowRef.current) return;
    const kakao = window.kakao;
    const map = mapRef.current;
    const sel = places.find((p) => p.id === selectedId);
    const marker = selectedId != null ? markersRef.current.get(selectedId) : null;

    if (sel && marker) {
      infoWindowRef.current.setContent(
        `<div style="padding:6px 10px;font-size:12px;white-space:nowrap;">${escapeHtml(sel.name)}</div>`
      );
      infoWindowRef.current.open(map, marker);
      map.panTo(new kakao.maps.LatLng(sel.latitude, sel.longitude));
    } else {
      infoWindowRef.current.close();
    }
  }, [status, selectedId, placesKey]);

  return (
    <div style={{ position: 'relative', aspectRatio: '1/1', background: 'var(--color-neutral-100)' }}>
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
      <div ref={elRef} style={{ width: '100%', height: '100%', visibility: status === 'ready' ? 'visible' : 'hidden' }} />
    </div>
  );
}
