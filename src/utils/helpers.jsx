export const generateId = () => (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substr(2);

export const timeAgo = (dateString) => {
    if (!dateString) return "Desconhecido";
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " anos atrás";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " meses atrás";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " dias atrás";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " h atrás";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " min atrás";
    return "Agora mesmo";
};

export const calculateProgress = (data) => {
    let score = 0;
    if (data.titulo?.length > 5) score += 10;
    if (data.orientador?.length > 3) score += 10;
    if (data.resumoPt?.length > 50) score += 15;
    if (data.secoes?.length >= 3) score += 40; else if (data.secoes?.length >= 1) score += 20;
    if (data.referencias?.length > 10) score += 25;
    let status = 'gray', label = 'Rascunho';
    if (score > 20) { status = 'yellow'; label = 'Em Andamento'; }
    if (score > 80) { status = 'green'; label = 'Quase Pronto'; }
    if (score === 100) { status = 'blue'; label = 'Completo'; }
    return { percent: score, status, label };
};

// FUNÇÃO ATUALIZADA: Mais robusta para evitar o erro de 'html2pdf is not defined'
export const loadHtml2Pdf = () => {
    return new Promise((resolve, reject) => {
        if (window.html2pdf) {
            resolve(window.html2pdf);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.async = true;
        script.onload = () => {
            if (window.html2pdf) resolve(window.html2pdf);
            else reject(new Error("Biblioteca carregada, mas objeto html2pdf não encontrado."));
        };
        script.onerror = () => reject(new Error("Erro ao carregar a biblioteca de PDF."));
        document.head.appendChild(script);
    });
};