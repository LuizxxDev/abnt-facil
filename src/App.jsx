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
      {/* UI/UX POLISH: Toaster posicionado no topo-centro (campo de visão) e com formato mais quadrado */}
      {/* A classe containerClassName garante que os alertas nunca fiquem no PDF gerado */}
      <Toaster 
        position="top-center" 
        containerClassName="print:hidden print-hidden"
        toastOptions={{ 
          duration: 3000,
          // O className permite que o toast obedeça ao .dark do HTML dinamicamente
          className: 'dark:bg-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-2xl',
          style: {
            borderRadius: '6px', // Estilo Quadrado / Profissional
            padding: '16px 24px',
            fontWeight: '600',
            fontSize: '14px',
            marginTop: '32px' // Desce a notificação um pouco mais para o centro do olhar
          },
          success: {
            iconTheme: {
              primary: '#16a34a', // text-green-600
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444', // text-red-500
              secondary: '#fff',
            },
          },
        }} 
      />
      
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/*" element={<Suspense fallback={<PageLoader />}><AppShell /></Suspense>} />
      </Routes>
    </>
  );
}