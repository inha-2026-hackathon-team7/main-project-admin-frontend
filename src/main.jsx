import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/industry.css';
import './index.css';
import App from './App.jsx';
import { AdminProvider } from './state/AdminContext.jsx';

// vite.config.js 의 base 값을 그대로 따라감 — 빌드 시 /admin/, 로컬 dev 시 / (main-project-admin-frontend 참고)
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <AdminProvider>
        <App />
      </AdminProvider>
    </BrowserRouter>
  </React.StrictMode>
);
