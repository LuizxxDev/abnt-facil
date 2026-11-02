import React, { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; 
import LandingPage from './views/LandingPage';
import PageLoader from './components/common/PageLoader';
import NotFoundPage from './views/NotFoundPage';

// Supabase, painel e editor ficam fora do arquivo inicial: a landing page abre sem baixá-los
const AppShell = lazy(() => import('./AppShell'));
const PrivacyPage = lazy(() => import('./views/PrivacyPage'));
const TermsPage = lazy(() => import('./views/TermsPage'));

const isAppPath = (path) => path === '/dashboard' || path.startsWith('/dashboard/') || path.startsWith('/editor/');

// Fora da página inicial, baixa o shell e a tela da rota ao mesmo tempo (sem esperar um pelo outro)
if (typeof window !== 'undefined') {
  const path = window.location.pathname;
  if (isAppPath(path)) {
    import('./AppShell');
    if (path.startsWith('/editor')) import('./views/Editor');
    else if (path.startsWith('/dashboard')) import('./views/Dashboard');
  } else if (path === '/') {
    // Na página inicial, adianta o painel quando a pessoa mostra intenção (toque, mouse ou foco num link)
    // ou alguns segundos depois de a página assentar: o carregamento inicial fica só com a landing
    let warmed = false;
    const warm = () => { if (warmed) return; warmed = true; import('./AppShell'); import('./views/Dashboard'); };
    ['pointerdown', 'mouseover', 'focusin'].forEach((ev) => window.addEventListener(ev, (e) => { if (e.target.closest?.('a[href^="/dashboard"], a[href^="/editor"]')) warm(); }, { passive: true }));
    window.addEventListener('load', () => setTimeout(() => (window.requestIdleCallback ? window.requestIdleCallback(warm, { timeout: 4000 }) : warm()), 6000), { once: true });
  }
}

// Painel e editor dividem o mesmo AppShell (o estado não reinicia ao trocar de tela)
function AppOrNotFound() {
  const { pathname } = useLocation();
  if (!isAppPath(pathname)) return <NotFoundPage />;
  return <Suspense fallback={<PageLoader />}><AppShell /></Suspense>;
}

export default function App() {
  return (
    <>
      {/* Avisos no topo; containerClassName mantém-nos fora da impressão */}
      <Toaster 
        position="top-center" 
        containerClassName="print:hidden print-hidden"
        toastOptions={{ 
          duration: 3000,
          // Cores pelos tokens do tema (mudam sozinhas com o .dark do <html>)
          className: 'border border-line',
          style: {
            background: 'var(--surface)',
            color: 'var(--ink)',
            borderRadius: '10px',
            padding: '12px 16px',
            fontWeight: '500',
            fontSize: '14px',
            marginTop: 'calc(16px + env(safe-area-inset-top, 0px))',
            boxShadow: '0 12px 32px -12px rgb(28 27 25 / 0.28), 0 2px 6px rgb(28 27 25 / 0.08)'
          },
          success: { iconTheme: { primary: '#1f5b40', secondary: '#fff' } },
          error: { iconTheme: { primary: '#a3302a', secondary: '#fff' } },
        }} 
      />
      
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/privacidade" element={<Suspense fallback={<PageLoader />}><PrivacyPage /></Suspense>} />
        <Route path="/termos" element={<Suspense fallback={<PageLoader />}><TermsPage /></Suspense>} />
        <Route path="/*" element={<AppOrNotFound />} />
      </Routes>
    </>
  );
}