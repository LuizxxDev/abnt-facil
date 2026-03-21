import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // <--- Importar
import { SpeedInsights } from "@vercel/speed-insights/next"
import './index.css'
import './App.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter> {/* <--- Envolver o App */}
      <App />
    </BrowserRouter>
  </StrictMode>,
)