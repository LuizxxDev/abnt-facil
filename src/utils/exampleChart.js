// Gráfico de barras horizontal em SVG (data URL), usado como imagem local dos documentos de exemplo.
// Fica dentro do documento: aparece na prévia, no PDF e no .docx sem buscar nada na internet.
export const barChartDataUrl = (rows) => {
    const W = 640, x0 = 250, barW = 330, rowH = 52, top = 24;
    const H = top * 2 + rows.length * rowH;
    const linhas = rows.map(([rotulo, v], i) => {
        const y = top + i * rowH;
        const w = Math.round((v / 100) * barW);
        return `<text x="${x0 - 12}" y="${y + 21}" text-anchor="end" font-size="14">${rotulo}</text>`
            + `<rect x="${x0}" y="${y + 6}" width="${w}" height="22" fill="#4a4a4a"/>`
            + `<text x="${x0 + w + 8}" y="${y + 22}" font-size="14" font-weight="bold">${v}%</text>`;
    }).join('');
    const eixo = `<line x1="${x0}" y1="${top}" x2="${x0}" y2="${top + rows.length * rowH}" stroke="#000" stroke-width="1"/>`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Arial, Helvetica, sans-serif" fill="#000"><rect width="100%" height="100%" fill="#fff"/>${eixo}${linhas}</svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};
