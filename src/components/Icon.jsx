/** Lucide 스타일 thin-stroke 아이콘 — path 만 바꿔 쓰는 얇은 래퍼 */
export function Svg({ size = 16, children, style, stroke = 'currentColor', fill = 'none' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {children}
    </svg>
  );
}

export const paths = {
  pin: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z',
  clock: 'M12 7v5l3 2',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8',
  bellClapper: 'M10.3 21a1.94 1.94 0 0 0 3.4 0',
  user: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2',
  building: 'M3 21V7l9-4 9 4v14',
  buildingDoor: 'M9 21v-6h6v6',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4',
  logoutArrow: 'm16 17 5-5-5-5',
  logoutBar: 'M21 12H9',
  chevronDown: 'm6 9 6 6 6-6',
  chevronUp: 'm6 14 6-6 6 6',
  chevronDown2: 'm6 10 6 6 6-6',
  plus: 'M12 5v14',
  plusH: 'M5 12h14',
  minus: 'M5 12h14',
  close: 'm6 6 12 12M18 6 6 18',
  search: 'm20 20-3.5-3.5',
  infoBody: 'M12 16v-5',
  infoDot: 'M12 8h.01',
  warnBody: 'M12 9v4',
  warnDot: 'M12 17h.01',
  gift: 'M4 9h16v12H4z',
  giftLid: 'M4 9l2-5h12l2 5M12 4v17',
  grip: 'M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01',
  check: 'm5 13 4 4L19 7',
  triangle: 'M10.3 3.9 1.8 18.1A2 2 0 0 0 3.5 21h17a2 2 0 0 0 1.7-2.9L13.7 3.9a2 2 0 0 0-3.4 0Z'
};

export function Icon({ d, size = 16, style, stroke }) {
  return (
    <Svg size={size} style={style} stroke={stroke}>
      <path d={d} />
    </Svg>
  );
}

export function InfoIcon({ size = 14, style }) {
  return (
    <Svg size={size} style={style}>
      <circle cx="12" cy="12" r="9" />
      <path d={paths.infoBody} />
      <path d={paths.infoDot} />
    </Svg>
  );
}

export function WarnCircleIcon({ size = 15, style, stroke }) {
  return (
    <Svg size={size} style={style} stroke={stroke}>
      <path d={paths.warnBody} />
      <path d={paths.warnDot} />
      <circle cx="12" cy="12" r="9" />
    </Svg>
  );
}

export function PlusIcon({ size = 15 }) {
  return (
    <Svg size={size}>
      <path d={paths.plus} />
      <path d={paths.plusH} />
    </Svg>
  );
}

export function PinIcon({ size = 22, stroke = 'var(--color-accent)' }) {
  return (
    <Svg size={size} stroke={stroke}>
      <path d={paths.pin} />
      <circle cx="12" cy="10" r="3" />
    </Svg>
  );
}
