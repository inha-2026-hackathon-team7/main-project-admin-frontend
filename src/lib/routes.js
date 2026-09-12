/** state.screen ↔ URL 경로 매핑. App.jsx 의 화면 분기는 그대로 두고, 경로만 이 매핑을 따릅니다. */
export const SCREEN_PATHS = {
  dashboard: '/dashboard',
  regions: '/regions',
  places: '/places',
  courses: '/courses',
  rewards: '/rewards',
  review: '/review'
};

export function pathForScreen(screen, openCourseId) {
  if (screen === 'courses' && openCourseId != null) return `/courses/${openCourseId}`;
  return SCREEN_PATHS[screen] || '/dashboard';
}

/** 알 수 없는 경로면 null 을 반환합니다. */
export function parseAppPath(pathname) {
  const courseMatch = pathname.match(/^\/courses\/(\d+)$/);
  if (courseMatch) return { screen: 'courses', openCourseId: parseInt(courseMatch[1], 10) };
  const entry = Object.entries(SCREEN_PATHS).find(([, p]) => p === pathname);
  return entry ? { screen: entry[0], openCourseId: null } : null;
}
