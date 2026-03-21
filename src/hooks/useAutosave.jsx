import { useState, useEffect } from 'react';

export const useAutosave = (data, authors, checklist, activeProjectId, projects, setProjects, settings, isReadOnly) => {
    const [isSaving, setIsSaving] = useState(false);
    const [forceSaveCounter, setForceSaveCounter] = useState(0);

    const triggerManualSave = () => setForceSaveCounter(c => c + 1);

    useEffect(() => {
        if (!activeProjectId || isReadOnly) return;
        
        const saveToStorage = () => {
            setProjects(prev => {
                const updated = prev.map(p => p.id === activeProjectId ? { ...p, updatedAt: new Date().toISOString(), data, authors, checklist } : p);
                localStorage.setItem('ifpa_projects_final_v6', JSON.stringify(updated));
                return updated;
            });
            setIsSaving(false);
        };
    
        if (settings.autoSave) {
            setIsSaving(true);
            const timeout = setTimeout(saveToStorage, 800);
            return () => clearTimeout(timeout);
        } else if (forceSaveCounter > 0) {
            setIsSaving(true);
            saveToStorage();
        }
        
    }, [data, authors, checklist, activeProjectId, settings.autoSave, forceSaveCounter, isReadOnly]); // Removido setProjects e projects das dependências para evitar loop, mas idealmente usa-se callback no setState

    return { isSaving, triggerManualSave };
};