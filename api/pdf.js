// Função serverless (Vercel): recebe o HTML das folhas já paginadas pelo editor e devolve o PDF.
// Usa o mesmo motor de renderização do Chrome, sem o diálogo de impressão: nada de cabeçalho
// "localhost/data", escala errada ou papel Carta, e funciona igual no celular.
import puppeteer from 'puppeteer-core';

const MAX_HTML_BYTES = 4 * 1024 * 1024; // limite de corpo da Vercel é 4,5 MB
const ALLOWED_HOSTS = new Set(['fonts.googleapis.com', 'fonts.gstatic.com']);
const PRIVATE_HOST = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.0\.0\.0|\[?::1\]?|metadata)/i;

const LOCAL_CHROME_PATHS = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

let browserPromise = null;

// Reaproveita o navegador entre chamadas enquanto a função estiver "quente"
const getBrowser = async () => {
  if (browserPromise) {
    const browser = await browserPromise.catch(() => null);
    if (browser?.connected) return browser;
  }
  browserPromise = (async () => {
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      const { default: chromium } = await import('@sparticuz/chromium');
      chromium.setGraphicsMode = false;
      return puppeteer.launch({
        args: await puppeteer.defaultArgs({ args: chromium.args, headless: 'shell' }),
        executablePath: await chromium.executablePath(),
        headless: 'shell',
      });
    }
    // Desenvolvimento local: usa o Chrome instalado na máquina
    const { existsSync } = await import('node:fs');
    const executablePath = LOCAL_CHROME_PATHS.find(p => existsSync(p));
    if (!executablePath) throw new Error('Chrome não encontrado. Defina CHROME_PATH.');
    return puppeteer.launch({ executablePath, headless: true });
  })();
  return browserPromise;
};

// Só fontes do Google e imagens HTTPS públicas podem ser baixadas durante a renderização
const isAllowedRequest = (request) => {
  const url = request.url();
  if (url.startsWith('data:') || url.startsWith('blob:')) return true;
  let parsed;
  try { parsed = new URL(url); } catch { return false; }
  if (ALLOWED_HOSTS.has(parsed.hostname)) return true;
  return request.resourceType() === 'image' && parsed.protocol === 'https:' && !PRIVATE_HOST.test(parsed.hostname);
};

const readBody = (req) => {
  if (req.body) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  return null;
};

const fail = (res, status, message) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ error: message }));
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return fail(res, 405, 'Use POST.');

  let body;
  try { body = readBody(req); } catch { return fail(res, 400, 'JSON inválido.'); }
  const html = body?.html;
  if (typeof html !== 'string' || !html.includes('class="page')) return fail(res, 400, 'Documento vazio.');
  if (Buffer.byteLength(html) > MAX_HTML_BYTES) return fail(res, 413, 'Documento grande demais para gerar o PDF no servidor.');

  const safeHtml = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  const fileName = String(body.fileName || 'documento').replace(/[^\p{L}\p{N} ._-]/gu, '').trim().slice(0, 120) || 'documento';

  let page;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', (request) => (isAllowedRequest(request) ? request.continue() : request.abort()));

    await page.setContent(safeHtml, { waitUntil: 'networkidle0', timeout: 25000 });
    await page.evaluate(() => document.fonts.ready);

    const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true, timeout: 25000 });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}.pdf`);
    res.setHeader('Cache-Control', 'no-store');
    res.end(Buffer.from(pdf));
  } catch (error) {
    console.error('Falha ao gerar PDF:', error);
    fail(res, 500, 'Não foi possível gerar o PDF.');
  } finally {
    await page?.close().catch(() => {});
  }
}
