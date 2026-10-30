// Equações em LaTeX → MathML (Temml). A biblioteca e a fonte matemática só são baixadas
// quando o documento tem alguma [EQUAÇÃO]; a mesma fonte é usada no PDF do servidor.
import { useEffect, useState } from 'react';

export const MATH_FONT_URL = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Math&display=block';

let temml = null;
let loading = null;

const escapeHtml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const loadFont = () => new Promise((resolve) => {
    if (document.querySelector(`link[href="${MATH_FONT_URL}"]`)) return resolve();
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = MATH_FONT_URL;
    link.onload = () => (document.fonts?.load('1em "Noto Sans Math"') || Promise.resolve()).then(resolve, resolve);
    link.onerror = resolve;
    document.head.appendChild(link);
});

export const loadMath = () => {
    if (!loading) {
        loading = Promise.all([import('temml').then(m => { temml = m.default || m; }), loadFont()]);
    }
    return loading;
};

// HTML (MathML) da equação; enquanto a biblioteca carrega, mostra o código LaTeX
export const renderMath = (latex) => {
    const source = (latex || '').trim();
    if (!temml) return `<code>${escapeHtml(source)}</code>`;
    try {
        return temml.renderToString(source, { displayMode: true, throwOnError: false });
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
