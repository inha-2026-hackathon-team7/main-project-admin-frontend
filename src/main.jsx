import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/industry.css';
import './index.css';
import App from './App.jsx';
import { AdminProvider } from './state/AdminContext.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AdminProvider>
      <App />
    </AdminProvider>
  </React.StrictMode>
);
