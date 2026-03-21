import { useState } from 'react';
import toast from 'react-hot-toast';

export const useExport = (data, authors, fontFamily) => {
    const [isExporting, setIsExporting] = useState(false);

    // FUNÇÃO DE PDF NATIVA (Otimizada para ABNT via Browser)
    const handleExportPDF = () => {
        setIsExporting(true);
        toast.success("A preparar documento para PDF...", { duration: 2000 });
        
        setTimeout(() => {
            setIsExporting(false);
            toast.success("Dica: No menu de impressão, escolha 'Guardar como PDF' como destino.", { 
                duration: 6000, 
                icon: '🖨️' 
            });
            window.print();
        }, 800);
    };

    return { isExporting, handleExportPDF };
};