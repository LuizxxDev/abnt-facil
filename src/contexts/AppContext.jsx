import React, { createContext, useState, useEffect, useContext } from 'react';
import { generateId } from '../utils/helpers';
import { DEFAULT_CHECKLIST, EXAMPLE_PROJECT, PROJECT_TYPES } from '../utils/constants';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [projects, setProjects] = useState([]);
  
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('ifpa_app_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    // Adicionado userName padrão e avatarId
    return { 
        theme: 'light', 
        autoSave: true, 
        defaultFont: 'Arial', 
        avatarId: 'user',
        userName: '' 
    };
  });

  useEffect(() => {
    const saved = localStorage.getItem('ifpa_projects_final_v6');
    if (saved) setProjects(JSON.parse(saved));
  }, []);

  useEffect(() => {
      localStorage.setItem('ifpa_app_settings', JSON.stringify(settings));
      if (settings.theme === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
  }, [settings]);

  const saveAndSet = (newList) => {
    setProjects(newList);
    localStorage.setItem('ifpa_projects_final_v6', JSON.stringify(newList));
  };

  const importAllProjects = (importedProjects) => {
    try {
      const existingIds = new Set(projects.map(p => p.id));
      const newOnes = importedProjects.filter(p => !existingIds.has(p.id));
      const combined = [...newOnes, ...projects];
      saveAndSet(combined);
      return newOnes.length;
    } catch (e) {
      console.error("Erro na importação:", e);
      return 0;
    }
  };

  const createNewProject = (title) => {
    const newId = generateId(); 
    const newProj = {
      id: newId, 
      title, 
      updatedAt: new Date().toISOString(), 
      createdAt: new Date().toISOString(), 
      authors: [''], 
      checklist: DEFAULT_CHECKLIST, 
      deleted: false, 
      favorite: false,
      data: { 
        instituicao: 'INSTITUTO FEDERAL DE EDUCAÇÃO, CIÊNCIA E TECNOLOGIA DO PARÁ', 
        curso: '', 
        titulo: '', 
        subtitulo: '', 
        naturezaTrabalho: 'Trabalho de Conclusão de Curso...', 
        orientadores: [''], 
        cidade: 'Belém', 
        estado: 'PA', 
        ano: new Date().getFullYear().toString(), 
        resumoPt: '', 
        palavrasChavePt: '', 
        resumoEn: '', 
        palavrasChaveEn: '', 
        dedicatoria: '', 
        epigrafe: '', 
        secoes: [
          { id: generateId(), titulo: 'INTRODUÇÃO', conteudo: '', level: 1 }, 
          { id: generateId(), titulo: 'REFERENCIAL TEÓRICO', conteudo: '', level: 1 }
        ], 
        referencias: '' 
      }
    };
    saveAndSet([newProj, ...projects]);
    return newId;
  };

  const createFromModel = (modelKey) => {
    const model = PROJECT_TYPES[modelKey];
    const newId = generateId();
    const newProj = {
      id: newId,
      title: `${model.label} - ${new Date().toLocaleDateString()}`,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      authors: [''],
      checklist: DEFAULT_CHECKLIST,
      deleted: false,
      favorite: false,
      data: {
        instituicao: 'INSTITUTO FEDERAL DE EDUCAÇÃO, CIÊNCIA E TECNOLOGIA DO PARÁ',
        curso: '',
        titulo: model.label.toUpperCase(),
        subtitulo: '',
        naturezaTrabalho: `${model.label} apresentado ao Instituto Federal do Pará.`,
        orientadores: [''], 
        cidade: 'Belém',
        estado: 'PA',
        ano: new Date().getFullYear().toString(),
        resumoPt: '',
        palavrasChavePt: '',
        resumoEn: '',
        palavrasChaveEn: '',
        dedicatoria: '',
        epigrafe: '',
        secoes: model.sections.map(s => ({ ...s, id: generateId() })),
        referencias: ''
      }
    };
    saveAndSet([newProj, ...projects]);
    return newId;
  };

  const createFromExample = () => {
    const newId = generateId();
    const newProj = {
        id: newId,
        title: 'Meu TCC (Baseado no Modelo)',
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        authors: [''],
        checklist: DEFAULT_CHECKLIST,
        deleted: false,
        favorite: false,
        data: {
            ...EXAMPLE_PROJECT.data,
            curso: '', 
            orientadores: EXAMPLE_PROJECT.data.orientador ? [EXAMPLE_PROJECT.data.orientador] : [''], 
            resumoPt: '', 
            resumoEn: '', 
            dedicatoria: '', 
            epigrafe: '',
            secoes: EXAMPLE_PROJECT.data.secoes.map(s => ({...s, id: generateId(), conteudo: ''}))
        }
    };
    saveAndSet([newProj, ...projects]);
    return newId;
  };

  const duplicateProject = (id, suffix = " (Cópia)") => {
    const original = projects.find(p => p.id === id);
    if (!original) return null;
    const newId = generateId();
    const newProj = { 
        ...original, 
        id: newId, 
        title: original.title + suffix, 
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
    };
    saveAndSet([newProj, ...projects]);
    return newId;
  };

  const duplicateAsTemplate = (id) => {
    const original = projects.find(p => p.id === id);
    if (!original) return null;
    const newId = generateId();
    const newProj = { 
        ...original, 
        id: newId, 
        title: original.title + " (Modelo)", 
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        authors: [''], 
        data: {
            ...original.data,
            resumoPt: '', 
            resumoEn: '', 
            dedicatoria: '', 
            epigrafe: '',
            secoes: original.data.secoes.map(s => ({...s, id: generateId(), conteudo: ''})) 
        }
    };
    saveAndSet([newProj, ...projects]);
    return newId;
  };

  const deleteProject = (id, permanent = false) => {
      if (permanent) {
        saveAndSet(projects.filter(p => p.id !== id));
      } else {
        saveAndSet(projects.map(p => p.id === id ? { ...p, deleted: true } : p));
      }
  };

  const updateProject = (id, updates) => {
    saveAndSet(projects.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p));
  };

  const restoreProject = (id) => {
    updateProject(id, { deleted: false });
  };

  return (
    <AppContext.Provider value={{
      activeProjectId, 
      setActiveProjectId,
      projects, 
      setProjects,
      settings, 
      setSettings,
      createNewProject, 
      createFromExample, 
      createFromModel,
      duplicateProject, 
      duplicateAsTemplate,
      updateProject, 
      deleteProject, 
      restoreProject,
      importAllProjects
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);