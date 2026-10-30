import { defineConfig, createServer } from 'vite'
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

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
      const assets = Object.keys(bundle).filter((f) => /\.(js|css|woff2?)$/.test(f)).map((f) => `/${f}`);
      const version = createHash('sha256').update(assets.join()).digest('hex').slice(0, 10);
      const file = join(outDir, 'sw.js');
      const sw = readFileSync(file, 'utf8')
        .replace("const VERSION = 'v2';", `const VERSION = '${version}';`)
        .replace('const BUILD_ASSETS = [];', `const BUILD_ASSETS = ${JSON.stringify(assets)};`);
      writeFileSync(file, sw);
    },
  };
};

// Depois do build, renderiza a página inicial em HTML (index.html) e guarda uma cópia
// vazia (app.html) para as rotas do aplicativo, que continuam renderizadas no navegador.
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
        const shell = readFileSync(file, 'utf8');
        writeFileSync(join(outDir, 'app.html'), shell);
        writeFileSync(file, shell.replace('<div id="root"></div>', `<div id="root">${render('/')}</div>`));
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
