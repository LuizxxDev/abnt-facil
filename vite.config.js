import { defineConfig } from 'vite'
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

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    localApi(),
  ],
})
