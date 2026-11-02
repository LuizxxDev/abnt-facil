import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
// Fontes hospedadas no próprio site (sem pedir nada ao Google em cada visita)
import '@fontsource-variable/libre-franklin'
import '@fontsource-variable/source-serif-4/opsz.css'
import '@fontsource-variable/source-serif-4/opsz-italic.css'
import './index.css'
import App from './App.jsx'

const root = document.getElementById('root')
const app = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)

// A página inicial já vem pronta do build (index.html); as demais rotas usam app.html, vazio
if (root.hasChildNodes() && window.location.pathname === '/') hydrateRoot(root, app)
else {
  root.replaceChildren()
  createRoot(root).render(app)
}

// Modo offline: só no build de produção (no desenvolvimento o cache atrapalharia o Vite)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => console.error('Service worker não registrado:', err))
  })
}
