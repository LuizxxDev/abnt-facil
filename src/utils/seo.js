// Título, descrição e indexação de cada página. Usado no navegador (usePageMeta)
// e no build (vite.config.js), que grava esses dados no HTML de cada rota.
export const SITE_URL = 'https://abnt-facil-home.vercel.app';

export const PAGES = {
    '/': {
        title: 'ABNTFácil — Trabalhos acadêmicos nas normas ABNT',
        description: 'Editor gratuito que formata TCC, artigos, relatórios, projetos de pesquisa e resenhas nas normas ABNT, com capa, sumário, referências e PDF em A4.',
    },
    '/privacidade': {
        title: 'Política de Privacidade · ABNTFácil',
        description: 'Quais dados o ABNTFácil usa, onde ficam guardados, por quanto tempo e como apagá-los. O editor funciona sem cadastro, direto no navegador.',
    },
    '/termos': {
        title: 'Termos de Uso · ABNTFácil',
        description: 'Como o ABNTFácil funciona, o que a ferramenta faz e o que não faz, suas responsabilidades sobre o conteúdo e as regras de uso do editor.',
    },
    '/dashboard': {
        title: 'Seus documentos · ABNTFácil',
        description: 'Seus trabalhos acadêmicos no ABNTFácil: crie, abra e organize documentos nas normas ABNT.',
        noindex: true,
    },
    '/editor': {
        title: 'Editor · ABNTFácil',
        description: 'Escreva o trabalho e veja as folhas em A4 se montarem nas normas ABNT.',
        noindex: true,
    },
    404: {
        title: 'Página não encontrada · ABNTFácil',
        description: 'Esta página não existe ou mudou de endereço. Volte ao início ou abra o editor do ABNTFácil.',
        noindex: true,
    },
};

// Troca título, descrição, canonical e robots no <head> (usado ao navegar entre telas)
export function applyPageMeta(key, path = key) {
    const page = PAGES[key] || PAGES[404];
    document.title = page.title;
    const set = (selector, attr, value, create) => {
        let el = document.head.querySelector(selector);
        if (!el && value != null) { el = create(); document.head.appendChild(el); }
        if (!el) return;
        if (value == null) el.remove(); else el.setAttribute(attr, value);
    };
    const meta = (key, isProperty) => () => { const m = document.createElement('meta'); m.setAttribute(isProperty ? 'property' : 'name', key); return m; };
    set('meta[name="description"]', 'content', page.description, meta('description'));
    set('meta[property="og:title"]', 'content', page.title, meta('og:title', true));
    set('meta[property="og:description"]', 'content', page.description, meta('og:description', true));
    set('meta[name="robots"]', 'content', page.noindex ? 'noindex, nofollow' : null, meta('robots'));
    const canonical = page.noindex ? null : `${SITE_URL}${typeof path === 'string' ? path : '/'}`;
    set('link[rel="canonical"]', 'href', canonical, () => { const l = document.createElement('link'); l.rel = 'canonical'; return l; });
    set('meta[property="og:url"]', 'content', canonical, meta('og:url', true));
}
