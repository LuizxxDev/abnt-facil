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
      {/* Configuração global do Toast com classes para Ocultar na Impressão/PDF */}
      <Toaster 
        position="top-right" 
        toastOptions={{ duration: 3000 }} 
        containerClassName="print:hidden print-hidden"
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