// Gera no build o HTML da página inicial: no celular o conteúdo aparece antes de o JavaScript rodar
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import App from './App.jsx';

export const render = (url) => renderToString(
  <StaticRouter location={url}>
    <App />
  </StaticRouter>
);
