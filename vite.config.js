import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 운영 배포 시 리버스 프록시가 이 앱을 /admin 하위 경로로 서빙합니다 (main-project-admin-frontend).
// 로컬 개발(npm run dev)은 그대로 루트에서 띄우고, 빌드 산출물만 /admin/ 기준 절대경로로 생성합니다.
// BrowserRouter 의 basename 은 import.meta.env.BASE_URL 로 이 값을 그대로 따라갑니다 (main.jsx 참고).
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/admin/' : '/',
  plugins: [react()],
  server: { port: 5173 }
}));
