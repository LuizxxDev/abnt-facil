import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../contexts/AppContext';

export const useAutosave = (data, authors, checklist, id, projects, setProjects, settings, isReadOnly) => {
    const [isSaving, setIsSaving] = useState(false);
    const { user } = useAppContext();
    
    // Rastreador mutável: capta a versão exata sem engatilhar cálculos de diff caros
    const latestDataRef = useRef({ data, authors, checklist });
    const timerRef = useRef(null);

    // Atualiza apenas as referências de memória. Muito mais rápido que JSON.stringify no Main Thread.
    useEffect(() => {
        latestDataRef.current = { data, authors, checklist };
    }, [data, authors, checklist]);

    const executeSave = useCallback(async (currentData, currentAuthors, currentChecklist) => {
        if (!id || isReadOnly) return;
        setIsSaving(true);
        
        const now = new Date().toISOString();

        try {
            if (user) {
                const { error } = await supabase
                    .from('projects')
                    .update({
                        data: currentData,
                        authors: currentAuthors,
                        checklist: currentChecklist,
                        updated_at: now
                    })
                    .eq('id', id);

                if (error) throw error;
            }

            // Atualização funcional local para evitar loops infinitos ou dependência do array completo
            setProjects(prevProjects => {
                const updatedProjects = prevProjects.map(p => 
                    p.id === id ? { ...p, data: currentData, authors: currentAuthors, checklist: currentChecklist, updatedAt: now } : p
                );
                
                if (!user) {
                    localStorage.setItem('ifpa_projects_final_v6', JSON.stringify(updatedProjects));
                }
                return updatedProjects;
            });
            
        } catch (error) {
            console.error('Falha crítica no autosave:', error);
        } finally {
            setTimeout(() => setIsSaving(false), 500);
        }
    }, [id, isReadOnly, user, setProjects]);

    useEffect(() => {
        if (!settings.autoSave || isReadOnly || !data) return;

        // Limpa a fila do debounce se o usuário continuou escrevendo ativamente
        if (timerRef.current) clearTimeout(timerRef.current);

        // Agendamento isolado para o salvamento (Debounce de 1.5s)
        timerRef.current = setTimeout(() => {
            const current = latestDataRef.current;
            executeSave(current.data, current.authors, current.checklist);
        }, 1500);

        return () => clearTimeout(timerRef.current);
    }, [data, authors, checklist, settings.autoSave, isReadOnly, executeSave]);

    const triggerManualSave = async () => {
        if (isReadOnly) return;
        
        // Se houver um save pendente na fila, limpa para evitar duplicidade na execução
        if (timerRef.current) clearTimeout(timerRef.current);
        
        const current = latestDataRef.current;
        await executeSave(current.data, current.authors, current.checklist);
    };

    return { isSaving, triggerManualSave };
};