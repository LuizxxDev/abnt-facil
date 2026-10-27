import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

export const useExport = (data, authors, fontFamily) => {
    const [isExporting, setIsExporting] = useState(false);

    // Plano B: impressão do navegador (sem internet ou se o servidor falhar)
    const printFallback = useCallback(() => {
        toast("Na tela de impressão, escolha \"Salvar como PDF\" e desmarque \"Cabeçalhos e rodapés\".", { duration: 8000, icon: '🖨️' });
        setTimeout(() => window.print(), 600);
    }, []);

    const handleExportPDF = useCallback(async () => {
        setIsExporting(true);
        const toastId = toast.loading('Gerando o PDF...');
        try {
            const { exportPdf } = await import('../utils/pdfExport');
            await exportPdf(data?.titulo);
            toast.success('PDF baixado', { id: toastId });
        } catch (error) {
            console.error('Falha no PDF direto:', error);
            toast.error('Não foi possível gerar o PDF direto. Abrindo a impressão do navegador.', { id: toastId, duration: 5000 });
            printFallback();
        } finally {
            setIsExporting(false);
        }
    }, [data?.titulo, printFallback]);

    const handleExportDocx = useCallback(async () => {
        setIsExporting(true);
        const toastId = toast.loading('Gerando o arquivo do Word...');
        try {
            const { exportDocx } = await import('../utils/docxExport');
            // Total de folhas da pré-visualização (sem capa e sem o verso), usado na ficha catalográfica
            const folhas = document.querySelectorAll('#abnt-document .page:not([data-role="capa"]):not([data-role="ficha"])').length || undefined;
            const { warnings } = await exportDocx(data, authors, fontFamily, { folhas });
            toast.success('Arquivo .docx baixado. Ao abrir no Word, aceite atualizar os campos para gerar o sumário.', { id: toastId, duration: 7000 });
            if (warnings.length) toast(warnings.join('\n'), { duration: 8000, icon: '⚠️' });
        } catch (error) {
            console.error('Falha ao gerar DOCX:', error);
            toast.error('Não foi possível gerar o arquivo do Word.', { id: toastId });
        } finally {
            setIsExporting(false);
        }
    }, [data, authors, fontFamily]);

    return { isExporting, handleExportPDF, handleExportDocx };
};
