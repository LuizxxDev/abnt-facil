import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; 
import LandingPage from './views/LandingPage';
import PageLoader from './components/common/PageLoader';

// Supabase, painel e editor ficam fora do arquivo inicial: a landing page abre sem baixá-los
const AppShell = lazy(() => import('./AppShell'));

// Fora da página inicial, baixa o shell e a tela da rota ao mesmo tempo (sem esperar um pelo outro)
if (typeof window !== 'undefined') {
  const path = window.location.pathname;
  if (path !== '/') {
    import('./AppShell');
    if (path.startsWith('/editor')) import('./views/Editor');
    else if (path.startsWith('/dashboard')) import('./views/Dashboard');
  } else {
    // Na página inicial, adianta o painel quando o navegador estiver livre: o clique em "Começar" abre na hora
    const warm = () => { import('./AppShell'); import('./views/Dashboard'); };
    window.addEventListener('load', () => (window.requestIdleCallback ? window.requestIdleCallback(warm, { timeout: 4000 }) : setTimeout(warm, 2000)), { once: true });
  }
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
        <Route path="/*" element={<Suspense fallback={<PageLoader />}><AppShell /></Suspense>} />
      </Routes>
    </>
  );
}