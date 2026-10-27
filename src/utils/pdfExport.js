// Gera o PDF no servidor a partir das folhas já paginadas da pré-visualização.

// Arimo e Tinos têm as mesmas métricas de Arial e Times New Roman: o servidor (sem essas
// fontes) quebra as linhas exatamente onde a pré-visualização quebrou.
const PDF_FONTS = 'https://fonts.googleapis.com/css2?family=Arimo:ital,wght@0,400;0,700;1,400;1,700&family=Tinos:ital,wght@0,400;0,700;1,400;1,700&display=block';

const collectCss = () => [...document.styleSheets].map(sheet => {
    try {
        return [...sheet.cssRules].map(rule => rule.cssText).join('\n');
    } catch {
        return ''; // folhas de outra origem (Google Fonts da interface) não são necessárias
    }
}).join('\n')
    .replace(/Arial, sans-serif/g, 'Arial, Arimo, sans-serif')
    .replace(/"Times New Roman", Times, serif/g, '"Times New Roman", Tinos, Times, serif');

export const buildPdfHtml = () => {
    const doc = document.getElementById('abnt-document');
    if (!doc) throw new Error('Pré-visualização não encontrada.');
    return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">`
        + `<link rel="stylesheet" href="${PDF_FONTS}">`
        + `<style>${collectCss()}\nhtml,body{margin:0;padding:0;background:#fff!important}.page{margin:0!important;box-shadow:none!important}</style>`
        + `</head><body><div class="abnt-doc">${doc.innerHTML}</div></body></html>`;
};

const download = (blob, fileName) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
};

export const safeFileName = (title) => (title || 'documento')
    .normalize('NFC').replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, ' ').trim().slice(0, 80) || 'documento';

export async function exportPdf(title) {
    const fileName = safeFileName(title);
    const response = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: buildPdfHtml(), fileName }),
    });
    if (!response.ok || !(response.headers.get('content-type') || '').includes('application/pdf')) {
        const detail = await response.json().catch(() => ({}));
        throw new Error(detail.error || `Erro ${response.status}`);
    }
    download(await response.blob(), `${fileName}.pdf`);
}

export { download };
