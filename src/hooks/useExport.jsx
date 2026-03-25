import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

export const useExport = () => {
    const [isExporting, setIsExporting] = useState(false);

    const handleExportPDF = useCallback(() => {
        setIsExporting(true);
        
        // Alerta Crítico para o utilizador desativar o Localhost do Navegador
        toast.error("⚠️ IMPORTANTE: Desmarque a opção 'Cabeçalhos e rodapés' na tela de impressão para remover o localhost e a data!", { 
            duration: 8000, 
            icon: '🚨',
            style: { fontWeight: 'bold', border: '2px solid red' }
        });
        
        setTimeout(() => {
            setIsExporting(false);
            window.print();
        }, 1500);
    }, []);

    return { isExporting, handleExportPDF };
};