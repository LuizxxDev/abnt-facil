import { defineConfig, createServer } from 'vite'
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { SITE_URL, PAGES } from './src/utils/seo.js'

// Em desenvolvimento, serve /api/pdf com a mesma função que roda na Vercel
const localApi = () => ({
  name: 'local-api',
  configureServer(server) {
    server.middlewares.use('/api/pdf', async (req, res, next) => {
      if (req.method !== 'POST') return next();
      try {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        req.body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
        const { default: handler } = await server.ssrLoadModule('/api/pdf.js');
        await handler(req, res);
      } catch (error) {
        next(error);
      }
    });
  },
});

// No build, grava no sw.js a lista de arquivos gerados e uma versão nova:
// o editor inteiro fica disponível offline já na primeira visita.
const serviceWorkerManifest = () => {
  let outDir = 'dist';
  return {
    name: 'sw-manifest',
    apply: 'build',
    configResolved(config) { outDir = config.build.outDir; },
    writeBundle(_options, bundle) {
      // Das fontes, só os subconjuntos latinos (os de cirílico, grego etc. não são usados em português)
      const assets = Object.keys(bundle).filter((f) => /\.(js|css)$/.test(f) || (/\.woff2?$/.test(f) && /latin/.test(f) && !/math/.test(f))).map((f) => `/${f}`);
      const version = createHash('sha256').update(assets.join()).digest('hex').slice(0, 10);
      const file = join(outDir, 'sw.js');
      const sw = readFileSync(file, 'utf8')
        .replace("const VERSION = 'v2';", `const VERSION = '${version}';`)
        .replace('const BUILD_ASSETS = [];', `const BUILD_ASSETS = ${JSON.stringify(assets)};`);
      writeFileSync(file, sw);
    },
  };
};

// Troca título, descrição, canonical e robots do HTML pelos da página (ver src/utils/seo.js)
const escapeAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const withMeta = (html, key, path) => {
  const page = PAGES[key];
  const canonical = page.noindex ? '' : `\n    <link rel="canonical" href="${SITE_URL}${path}" />`;
  const robots = page.noindex ? '\n    <meta name="robots" content="noindex, nofollow" />' : '';
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeAttr(page.title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*"/, `$1${escapeAttr(page.description)}"`)
    .replace(/(<meta property="og:title" content=")[^"]*"/, `$1${escapeAttr(page.title)}"`)
    .replace(/(<meta property="og:description" content=")[^"]*"/, `$1${escapeAttr(page.description)}"`)
    .replace(/(<meta property="og:url" content=")[^"]*"/, `$1${SITE_URL}${path}"`)
    .replace(/\s*<link rel="canonical"[^>]*>/, '')
    .replace('</title>', `</title>${canonical}${robots}`);
};

// Depois do build, renderiza a página inicial (index.html) e a página 404 (404.html) em HTML,
// grava o head certo de /privacidade e /termos, e guarda uma cópia vazia (app.html) para o
// painel e o editor, que continuam renderizados no navegador.
const prerenderLanding = () => {
  let outDir = 'dist';
  return {
    name: 'prerender-landing',
    apply: 'build',
    configResolved(config) { outDir = config.build.outDir; },
    async closeBundle() {
      const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error', configFile: false, plugins: [react()], optimizeDeps: { noDiscovery: true, include: [] } });
      try {
        const { render } = await server.ssrLoadModule('/src/entry-prerender.jsx');
        const file = join(outDir, 'index.html');
        // Pré-carrega as fontes da primeira tela (títulos, texto e rótulos), que senão só são pedidas depois do CSS
        const fonts = readdirSync(join(outDir, 'assets')).filter((f) => /^(libre-franklin-latin-wght-normal|source-serif-4-latin-wght-normal|ibm-plex-mono-latin-500-normal)-.*\.woff2$/.test(f));
        const preload = fonts.map((f) => `<link rel="preload" href="/assets/${f}" as="font" type="font/woff2" crossorigin />`).join('\n    ');
        const shell = readFileSync(file, 'utf8').replace('</head>', `  ${preload}\n  </head>`);
        writeFileSync(join(outDir, 'app.html'), withMeta(shell, '/dashboard', '/dashboard'));
        writeFileSync(join(outDir, 'privacidade.html'), withMeta(shell, '/privacidade', '/privacidade'));
        writeFileSync(join(outDir, 'termos.html'), withMeta(shell, '/termos', '/termos'));
        writeFileSync(join(outDir, '404.html'), withMeta(shell, 404, '/404').replace('<div id="root"></div>', `<div id="root">${render('/pagina-nao-encontrada')}</div>`));
        writeFileSync(file, withMeta(shell, '/', '/').replace('<div id="root"></div>', `<div id="root">${render('/')}</div>`));
      } finally {
        await server.close();
      }
    },
  };
};

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    localApi(),
    serviceWorkerManifest(),
    prerenderLanding(),
  ],
})
