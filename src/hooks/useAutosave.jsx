import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../contexts/AppContext';

export const useAutosave = (data, authors, checklist, id, projects, setProjects, settings, isReadOnly) => {
    const [isSaving, setIsSaving] = useState(false);
    const { user } = useAppContext();
    
    // PROTEÇÃO CRÍTICA: Memoriza a última versão exata que foi guardada.
    const lastSavedStringRef = useRef(null); 

    const saveToCloud = useCallback(async (currentData, currentAuthors, currentChecklist) => {
        if (!id || isReadOnly || !user) return;
        try {
            const now = new Date().toISOString();
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
        } catch (error) {
            console.error('Erro ao salvar na nuvem:', error);
        }
    }, [id, isReadOnly, user]);

    const saveToLocal = useCallback((currentData, currentAuthors, currentChecklist) => {
        if (!id || isReadOnly) return;

        // Atualização funcional: não depende do array 'projects' para evitar loops
        setProjects(prevProjects => {
            const updatedProjects = prevProjects.map(p => {
                if (p.id === id) {
                    return {
                        ...p,
                        data: currentData,
                        authors: currentAuthors,
                        checklist: currentChecklist,
                        updatedAt: new Date().toISOString()
                    };
                }
                return p;
            });
            localStorage.setItem('ifpa_projects_final_v6', JSON.stringify(updatedProjects));
            return updatedProjects;
        });
    }, [id, isReadOnly, setProjects]);

    useEffect(() => {
        if (!settings.autoSave || isReadOnly || !data) return;

        const currentString = JSON.stringify({ data, authors, checklist });
        
        // Se for a primeira vez que o hook corre, armazena o estado inicial e aborta
        if (lastSavedStringRef.current === null) {
            lastSavedStringRef.current = currentString;
            return;
        }

        // Se nada mudou desde a última gravação, aborta a gravação! Fim do loop.
        if (lastSavedStringRef.current === currentString) {
            return; 
        }

        const timer = setTimeout(async () => {
            setIsSaving(true);
            
            if (user) {
                await saveToCloud(data, authors, checklist);
            } else {
                saveToLocal(data, authors, checklist);
            }

            // Atualiza o estado salvo após a gravação
            lastSavedStringRef.current = currentString;
            
            setTimeout(() => setIsSaving(false), 500);
        }, 1500);

        return () => clearTimeout(timer);
    }, [data, authors, checklist, settings.autoSave, isReadOnly, user, saveToCloud, saveToLocal]);

    const triggerManualSave = async () => {
        if (isReadOnly) return;
        setIsSaving(true);
        
        const currentString = JSON.stringify({ data, authors, checklist });
        lastSavedStringRef.current = currentString;

        if (user) {
            await saveToCloud(data, authors, checklist);
        } else {
            saveToLocal(data, authors, checklist);
        }
        
        setTimeout(() => setIsSaving(false), 500);
    };

    return { isSaving, triggerManualSave };
};