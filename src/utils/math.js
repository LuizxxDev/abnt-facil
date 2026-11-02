// Equações em LaTeX → MathML (Temml). A biblioteca e a fonte matemática só são baixadas
// quando o documento tem alguma [EQUAÇÃO]; a mesma fonte (do Google) é usada no PDF do servidor.
import { useEffect, useState } from 'react';

export const MATH_FONT_URL = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Math&display=block';

let temml = null;
let loading = null;

const escapeHtml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Na tela, a fonte matemática vem do próprio site; o PDF do servidor usa MATH_FONT_URL
const loadFont = () => import('@fontsource/noto-sans-math/400.css')
    .then(() => document.fonts?.load('1em "Noto Sans Math"'))
    .catch(() => {});

export const loadMath = () => {
    if (!loading) {
        loading = Promise.all([
            import('temml').then(m => { temml = m.default || m; }),
            // Estilos do Temml para o que o Chromium não desenha sozinho (\overline, \cancel, \boxed...)
            import('temml/dist/Temml-Local.css'),
            loadFont(),
        ]);
    }
    return loading;
};

// HTML (MathML) da equação; enquanto a biblioteca carrega, mostra o código LaTeX
export const renderMath = (latex) => {
    const source = (latex || '').trim();
    if (!temml) return `<code>${escapeHtml(source)}</code>`;
    try {
        // Acentos de espaçamento (‾ ˆ ˙ ˜) não existem na fonte matemática do servidor:
        // troca-os pelos equivalentes básicos, presentes em qualquer fonte
        return temml.renderToString(source, { displayMode: true, throwOnError: false })
            .replace(/‾/g, '¯').replace(/ˆ/g, '^').replace(/˙/g, '·').replace(/˜/g, '~');
    } catch {
        return `<code>${escapeHtml(source)}</code>`;
    }
};

// true quando as equações já podem ser desenhadas
export const useMathReady = (needed) => {
    const [ready, setReady] = useState(Boolean(temml));
    useEffect(() => {
        if (!needed || ready) return;
        let alive = true;
        loadMath().then(() => alive && setReady(true));
        return () => { alive = false; };
    }, [needed, ready]);
    return ready;
};
