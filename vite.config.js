import { defineConfig } from 'vite'
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

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    localApi(),
    serviceWorkerManifest(),
  ],
})
