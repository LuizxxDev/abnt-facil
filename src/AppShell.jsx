import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import PageLoader from './components/common/PageLoader';

// Área logada (painel e editor): só é baixada quando o usuário sai da landing page.
// Cada tela vira um arquivo próprio — o painel não carrega o editor e vice-versa.
const Dashboard = lazy(() => import('./views/Dashboard'));
const Editor = lazy(() => import('./views/Editor'));

export default function AppShell() {
  return (
    <AppProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="editor/:id" element={<Editor />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppProvider>
  );
}
