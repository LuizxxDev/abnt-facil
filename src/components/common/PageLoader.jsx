import React from 'react';

const isDarkTheme = () => {
  try {
    return JSON.parse(localStorage.getItem('ifpa_app_settings') || '{}').theme === 'dark';
  } catch {
    return false;
  }
};

// Tela de carregamento leve (sem ícones nem bibliotecas), no tema escolhido pelo usuário
export default function PageLoader() {
  const dark = isDarkTheme();
  return (
    <div className={`flex h-dvh items-center justify-center ${dark ? 'bg-slate-950' : 'bg-slate-50'}`} role="status" aria-label="Carregando">
      <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-green-600/25 border-t-green-600" />
    </div>
  );
}
