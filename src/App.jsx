import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; 
import { AppProvider } from './contexts/AppContext';
import LandingPage from './views/LandingPage';
import Dashboard from './views/Dashboard';
import Editor from './views/Editor';

export default function App() {
  return (
    <AppProvider>
      {/* UI/UX POLISH: Toaster Moderno e Sensível ao Tema */}
      {/* A classe containerClassName garante que os alertas nunca fiquem no PDF gerado */}
      <Toaster 
        position="bottom-center" 
        containerClassName="print:hidden print-hidden"
        toastOptions={{ 
          duration: 3000,
          // O className permite que o toast obedeça ao .dark do HTML dinamicamente
          className: 'dark:bg-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-2xl',
          style: {
            borderRadius: '999px', // Estilo "Pílula" muito moderno (App Feel)
            padding: '12px 24px',
            fontWeight: '700',
            fontSize: '13px',
            letterSpacing: '0.025em'
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
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/editor/:id" element={<Editor />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppProvider>
  );
}