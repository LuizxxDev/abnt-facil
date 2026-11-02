import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import usePageMeta from './hooks/usePageMeta';
import { AppProvider } from './contexts/AppContext';
import PageLoader from './components/common/PageLoader';
import TermsGate from './components/common/TermsGate';

// Área logada (painel e editor): só é baixada quando o usuário sai da landing page.
// Cada tela vira um arquivo próprio — o painel não carrega o editor e vice-versa.
const Dashboard = lazy(() => import('./views/Dashboard'));
const Editor = lazy(() => import('./views/Editor'));

export default function AppShell() {
  const { pathname } = useLocation();
  // Painel e editor não entram na busca (noindex): são telas de trabalho de cada pessoa
  usePageMeta(pathname.startsWith('/editor') ? '/editor' : '/dashboard');
  return (
    <AppProvider>
      {/* Painel e editor só abrem depois do aceite dos termos */}
      <TermsGate>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="editor/:id" element={<Editor />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </TermsGate>
    </AppProvider>
  );
}
