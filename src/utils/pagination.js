// Paginação real das folhas A4: mede cada bloco renderizado num "medidor" invisível
// com a mesma largura da folha e distribui os blocos em páginas de altura fixa.
// Parágrafos que não cabem no fim de uma folha são quebrados por palavra.

const EPS = 0.5; // tolerância de arredondamento (px)

// Divide o HTML de um parágrafo em tags, espaços e palavras
export const tokenizeHtml = (html) => html.match(/<[^>]+>|\s+|[^<\s]+/g) || [];

const openTagsUntil = (tokens, idx) => {
    const stack = [];
    for (let i = 0; i < idx; i++) {
        const m = tokens[i].match(/^<(\/)?(strong|em)>$/);
        if (!m) continue;
        if (m[1]) stack.pop();
        else stack.push(m[2]);
    }
    return stack;
};

// Recorta tokens[start, end) mantendo <strong>/<em> balanceados nas duas pontas
export const sliceHtml = (tokens, start, end) => {
    const before = openTagsUntil(tokens, start);
    const after = openTagsUntil(tokens, end);
    return before.map(t => `<${t}>`).join('')
        + tokens.slice(start, end).join('')
        + [...after].reverse().map(t => `</${t}>`).join('');
};

// Palavras mais largas que uma linha (URLs, DOIs, sequências sem espaço) já são quebradas
// pelo navegador em várias linhas; para poder cortá-las entre folhas, viram tokens de 1 caractere.
// Abaixo de ~30 caracteres nenhuma palavra em 12pt ocupa a largura útil de 16cm, então nem se mede.
const LONG_WORD_MIN_CHARS = 30;
const explodeLongWords = (tokens, probeHeight) => {
    let lineH = null;
    return tokens.flatMap(t => {
        if (t.length < LONG_WORD_MIN_CHARS || t.startsWith('<') || /^\s+$/.test(t)) return [t];
        if (lineH === null) lineH = probeHeight('x', true);
        if (probeHeight(t, true) <= lineH * 1.5) return [t];
        return t.match(/&[^;\s]+;|[\s\S]/gu); // mantém entidades HTML (&amp; ...) inteiras
    });
};

const isBlankToken =(t) => /^\s+$/.test(t) || /^<br\s*\/?>$/i.test(t);

const outerHeight = (el) => {
    const cs = getComputedStyle(el);
    return el.getBoundingClientRect().height + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom);
};

/**
 * @param flows    [{ key, items: [{ key, kind, keepWithNext?, html? }] }]
 * @param measurer elemento que contém: [data-page-probe] (uma .page vazia),
 *                 [data-p-probe] (um <p class="abnt-p">) e um nó [data-mkey] por item
 * @returns        { [flowKey]: Array<Array<item>> }  (páginas de cada fluxo),
 *                 ou null se o medidor ainda não tem layout (ex.: oculto)
 */
export const paginateFlows = (flows, measurer) => {
    const pageEl = measurer.querySelector('[data-page-probe]');
    const pageCs = getComputedStyle(pageEl);
    const pageH = pageEl.getBoundingClientRect().height - parseFloat(pageCs.paddingTop) - parseFloat(pageCs.paddingBottom);
    if (!(pageH > 0)) return null;

    const probe = measurer.querySelector('[data-p-probe]');
    const probeHeight = (html, cont) => {
        probe.style.textIndent = cont ? '0' : '';
        probe.innerHTML = html;
        return outerHeight(probe);
    };

    const result = {};
    flows.forEach(flow => {
        const pages = [[]];
        let used = 0;
        const current = () => pages[pages.length - 1];

        const newPage = () => {
            // Títulos não podem ficar sozinhos no fim da folha: levam-se para a próxima
            const cur = current();
            const carried = [];
            while (cur.length > 1 && cur[cur.length - 1].keepWithNext) carried.unshift(cur.pop());
            pages.push(carried);
            used = carried.reduce((sum, it) => sum + it._h, 0);
        };

        const place = (item, h) => {
            current().push({ ...item, _h: h });
            used += h;
        };

        flow.items.forEach(item => {
            const el = measurer.querySelector(`[data-mkey="${CSS.escape(item.key)}"]`);
            if (!el) return;
            const h = outerHeight(el);

            if (used + h <= pageH + EPS) { place(item, h); return; }

            if (item.kind !== 'p') {
                // Bloco indivisível (título, citação, figura, tabela, referência)
                if (current().length > 0) newPage();
                place(item, h);
                return;
            }

            // Parágrafo: preenche o resto da folha e continua na seguinte
            const tokens = explodeLongWords(tokenizeHtml(item.html), probeHeight);
            let start = 0;
            let cont = false;
            for (;;) {
                const restHtml = sliceHtml(tokens, start, tokens.length);
                const restH = cont ? probeHeight(restHtml, true) : h;
                if (used + restH <= pageH + EPS) {
                    place({ ...item, key: `${item.key}@${start}`, html: restHtml, cont }, restH);
                    break;
                }

                const room = pageH - used + EPS;
                let lo = start + 1, hi = tokens.length - 1, best = -1, bestH = 0;
                while (lo <= hi) {
                    const mid = (lo + hi) >> 1;
                    const mh = probeHeight(sliceHtml(tokens, start, mid), cont);
                    if (mh <= room) { best = mid; bestH = mh; lo = mid + 1; } else { hi = mid - 1; }
                }

                if (best === -1) {
                    if (current().length > 0) { newPage(); continue; }
                    best = start + 1; // nem uma palavra cabe numa folha vazia: força avanço
                    bestH = probeHeight(sliceHtml(tokens, start, best), cont);
                }

                place({ ...item, key: `${item.key}@${start}`, html: sliceHtml(tokens, start, best), cont, split: true }, bestH);
                newPage();
                start = best;
                while (start < tokens.length && isBlankToken(tokens[start])) start++;
                if (start >= tokens.length) break;
                cont = true;
            }
        });

        // Remove páginas vazias deixadas por um corte exatamente no fim
        result[flow.key] = pages.filter((p, i) => p.length > 0 || i === 0);
    });
    return result;
};
