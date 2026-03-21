import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../contexts/AppContext';

export const useAutosave = (data, authors, checklist, id, projects, setProjects, settings, isReadOnly) => {
    const [isSaving, setIsSaving] = useState(false);
    const { user } = useAppContext(); // Verificamos se há um utilizador logado

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

        const updatedProjects = projects.map(p => {
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

        setProjects(updatedProjects);
        localStorage.setItem('ifpa_projects_final_v6', JSON.stringify(updatedProjects));
    }, [id, isReadOnly, projects, setProjects]);

    // Lógica de Autosave com Timer
    useEffect(() => {
        if (!settings.autoSave || isReadOnly || !data) return;

        const timer = setTimeout(async () => {
            setIsSaving(true);
            
            if (user) {
                // Se logado, salva na nuvem
                await saveToCloud(data, authors, checklist);
            } else {
                // Se não logado, salva no local
                saveToLocal(data, authors, checklist);
            }

            // Simula um pequeno delay para o utilizador ver o feedback visual de "Salvo"
            setTimeout(() => setIsSaving(false), 500);
        }, 1500); // Aguarda 1.5s após a última alteração para salvar

        return () => clearTimeout(timer);
    }, [data, authors, checklist, settings.autoSave, isReadOnly, user, saveToCloud, saveToLocal]);

    // Função para salvamento manual (ex: clicar no botão salvar ou Ctrl+S)
    const triggerManualSave = async () => {
        if (isReadOnly) return;
        setIsSaving(true);
        
        if (user) {
            await saveToCloud(data, authors, checklist);
        } else {
            saveToLocal(data, authors, checklist);
        }
        
        setTimeout(() => setIsSaving(false), 500);
    };

    return { isSaving, triggerManualSave };
};