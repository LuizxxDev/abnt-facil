import React from 'react';

const isDarkTheme = () => {
  try {
    return JSON.parse(localStorage.getItem('ifpa_app_settings') || '{}').theme === 'dark';
  } catch {
    return false;
  }
};

// Tela de carregamento leve (sem ícones nem bibliotecas): a folha com margem, no tema do usuário
export default function PageLoader() {
  const dark = isDarkTheme();
  return (
    <div className={`flex h-dvh items-center justify-center ${dark ? 'bg-slate-950' : 'bg-slate-50'}`} role="status" aria-label="Carregando">
      <span className="relative block aspect-[210/297] w-10 animate-pulse rounded-[2px] bg-white shadow-[0_8px_24px_-16px_rgb(28_27_25/0.4)] ring-1 ring-black/5" />
    </div>
  );
}
