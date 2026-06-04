import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppLayout } from './components/AppLayout';
import './index.css';

// Lazy load pages eventually, but we can import direct for now
import Dashboard from './pages/Dashboard';
import MediaDetail from './pages/MediaDetail';
import ShareBuilder from './pages/ShareBuilder';
import Analytics from './pages/Analytics';
import Viewer from './pages/Viewer';
import GlobalAnalytics from './pages/GlobalAnalytics';
import SettingsPage from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Toaster theme="dark" position="top-right" />
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/upload" replace />} />
          <Route path="upload" element={<Dashboard />} />
          <Route path="media" element={<Navigate to="/upload" replace />} />
          <Route path="media/:mediaId" element={<MediaDetail />} />
          <Route path="media/:mediaId/share" element={<ShareBuilder />} />
          <Route path="media/:mediaId/analytics" element={<Analytics />} />
          <Route path="analytics" element={<GlobalAnalytics />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="/view/:slug" element={<Viewer />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')!).render(
//   <React.StrictMode>
    <App />
//   </React.StrictMode>,
);
