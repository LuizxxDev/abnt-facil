import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast'; 
import { generateId } from '../utils/helpers';
import { DEFAULT_CHECKLIST, EXAMPLE_PROJECT, PROJECT_TYPES } from '../utils/constants';
import { supabase } from '../lib/supabase';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [projects, setProjects] = useState([]);
  
  const [user, setUser] = useState(null); 
  const [isAuthLoading, setIsAuthLoading] = useState(true); 
  const [isDataLoading, setIsDataLoading] = useState(true);

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('ifpa_app_settings');
      if (saved) {
        return JSON.parse(saved); 
      }
    } catch (e) { 
      console.error('Erro ao ler settings do localStorage:', e); 
    }
    return { theme: 'dark', autoSave: true, defaultFont: 'Arial', userName: '' };
  });

  useEffect(() => {
    let mounted = true;

    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
        setIsAuthLoading(true);
        toast.loading("A processar a tua entrada...", { id: 'auth-toast' });

        const hashParams = new URLSearchParams(hash.replace('#', ''));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken) {
            supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
            .then(({ data, error }) => {
                if (error) {
                    console.error("Erro no interceptador:", error);
                    toast.error(`Falha no login: ${error.message}`, { id: 'auth-toast' });
                } else {
                    if (mounted) setUser(data.session?.user ?? null);
                    toast.success("Conta sincronizada com sucesso!", { id: 'auth-toast' });
                    window.history.replaceState(null, '', window.location.pathname);
                }
            })
            .catch(err => {
                console.error("Erro inesperado na sessão:", err);
            })
            .finally(() => {
                if (mounted) setIsAuthLoading(false);
            });
            return; 
        }
    }

    supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error) console.error("Erro getSession:", error);
        if (mounted) {
            setUser(session?.user ?? null);
            setIsAuthLoading(false);
        }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (mounted) {
            setUser(session?.user ?? null);
            if (!window.location.hash.includes('access_token')) setIsAuthLoading(false);
        }
    });

    return () => {
        mounted = false;
        subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setIsDataLoading(true);
      try {
          if (user) {
            const { data, error } = await supabase.from('projects').select('*').order('updated_at', { ascending: false });
            
            if (!mounted) return;

            if (error) {
                console.error("Erro ao carregar da nuvem:", error.message);
                toast.error("Erro de sincronização. Usando dados locais.");
                const saved = localStorage.getItem('ifpa_projects_final_v6');
                if (saved) {
                    try {
                        setProjects(JSON.parse(saved));
                    } catch (e) {
                        console.error('Falha ao parsear projetos locais de fallback:', e);
                        setProjects([]);
                    }
                }
            } else if (data) {
              setProjects(data.map(p => ({ ...p, createdAt: p.created_at, updatedAt: p.updated_at })));
            }
          } else {
            const saved = localStorage.getItem('ifpa_projects_final_v6');
            if (saved) {
                try {
                    setProjects(JSON.parse(saved));
                } catch (e) {
                    console.error('Falha ao parsear projetos locais:', e);
                    setProjects([]);
                }
            } else {
                setProjects([]);
            }
          }
      } catch (error) {
          console.error("Erro crítico ao carregar dados:", error);
      } finally {
          if (mounted) setIsDataLoading(false);
      }
    };

    if (!isAuthLoading) {
        loadData();
    }

    return () => {
        mounted = false;
    };
  }, [user, isAuthLoading]);

  useEffect(() => {
      try {
          localStorage.setItem('ifpa_app_settings', JSON.stringify(settings));
      } catch(e) {
          console.error("Falha ao salvar settings:", e);
      }
      if (settings.theme === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
  }, [settings]);

  const loginWithGoogle = useCallback(async () => {
    try {
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/dashboard' }});
        if (error) toast.error(`Erro ao iniciar sessão: ${error.message}`);
    } catch (err) {
        toast.error("Falha ao comunicar com o servidor.");
    }
  }, []);

  const logout = useCallback(async () => {
    toast.loading("A encerrar sessão...", { id: 'logout-toast' });
    try {
        const { error } = await supabase.auth.signOut();
        if (error) {
            for (let key in localStorage) {
                if (key.startsWith('sb-') && key.endsWith('-auth-token')) localStorage.removeItem(key);
            }
        }
    } catch (error) {
        console.error("Falha na comunicação de logout:", error);
    } finally {
        setUser(null); 
        const saved = localStorage.getItem('ifpa_projects_final_v6');
        try {
            setProjects(saved ? JSON.parse(saved) : []);
        } catch(e) {
            setProjects([]);
        }
        toast.success("Sessão terminada.", { id: 'logout-toast' });
        setTimeout(() => window.location.reload(), 800);
    }
  }, []);

  // --- HELPER CENTRAL DE PERSISTÊNCIA ---
  const persistNewProject = useCallback(async (newProjObj) => {
    if (user) {
      const { data, error } = await supabase.from('projects').insert([{ ...newProjObj, user_id: user.id }]).select();
      if (!error && data) {
        const finalProj = { ...data[0], createdAt: data[0].created_at, updatedAt: data[0].updated_at };
        setProjects(prev => [finalProj, ...prev]);
        return data[0].id;
      }
    }
    // Fallback Local
    const localId = newProjObj.id || generateId();
    const localProj = { ...newProjObj, id: localId, updatedAt: new Date().toISOString(), createdAt: new Date().toISOString() };
    setProjects(prev => {
        const newList = [localProj, ...prev];
        if (!user) {
            try {
                localStorage.setItem('ifpa_projects_final_v6', JSON.stringify(newList));
            } catch(e) {
                console.error("Erro ao persistir novo projeto localmente", e);
            }
        }
        return newList;
    });
    return localId;
  }, [user]);

  const prepareProjectObject = useCallback((title, dataOverride = null) => ({
    title, authors: [''], checklist: DEFAULT_CHECKLIST, favorite: false, deleted: false,
    data: dataOverride || { 
      instituicao: 'INSTITUTO FEDERAL DE EDUCAÇÃO, CIÊNCIA E TECNOLOGIA DO PARÁ', 
      curso: '', titulo: '', subtitulo: '', naturezaTrabalho: 'Trabalho de Conclusão de Curso...', 
      orientadores: [''], cidade: 'Belém', estado: 'PA', ano: new Date().getFullYear().toString(), 
      dedicatoria: '', agradecimentos: '', epigrafe: '', resumoPt: '', palavrasChavePt: '', 
      resumoEn: '', palavrasChaveEn: '', 
      secoes: [ { id: generateId(), titulo: 'INTRODUÇÃO', conteudo: '', level: 1 }, { id: generateId(), titulo: 'REFERENCIAL TEÓRICO', conteudo: '', level: 1 } ], 
      referencias: '', apendices: '', anexos: '', assets: {} 
    }
  }), []);

  const createNewProject = useCallback(async (title) => {
      return await persistNewProject(prepareProjectObject(title));
  }, [persistNewProject, prepareProjectObject]);

  const createFromModel = useCallback(async (modelKey) => {
    const model = PROJECT_TYPES[modelKey];
    const customData = {
        instituicao: 'INSTITUTO FEDERAL DE EDUCAÇÃO, CIÊNCIA E TECNOLOGIA DO PARÁ', curso: '',
        titulo: model.label.toUpperCase(), subtitulo: '', naturezaTrabalho: `${model.label} apresentado ao Instituto Federal do Pará.`,
        orientadores: [''], cidade: 'Belém', estado: 'PA', ano: new Date().getFullYear().toString(),
        dedicatoria: '', agradecimentos: '', epigrafe: '', resumoPt: '', palavrasChavePt: '', resumoEn: '', palavrasChaveEn: '',
        secoes: model.sections.map(s => ({ ...s, id: generateId() })), referencias: '', apendices: '', anexos: '', assets: {}
    };
    return await persistNewProject(prepareProjectObject(`${model.label} - ${new Date().toLocaleDateString()}`, customData));
  }, [persistNewProject, prepareProjectObject]);

  const createFromExample = useCallback(async () => {
    const customData = {
        ...EXAMPLE_PROJECT.data, curso: '', orientadores: EXAMPLE_PROJECT.data.orientadores ? [...EXAMPLE_PROJECT.data.orientadores] : [''], 
        resumoPt: '', resumoEn: '', dedicatoria: '', agradecimentos: '', epigrafe: '', apendices: '', anexos: '', assets: {},
        secoes: EXAMPLE_PROJECT.data.secoes.map(s => ({...s, id: generateId(), conteudo: ''}))
    };
    return await persistNewProject(prepareProjectObject('Meu TCC (Baseado no Modelo)', customData));
  }, [persistNewProject, prepareProjectObject]);

  const duplicateProject = useCallback(async (id, suffix = " (Cópia)") => {
    const original = projects.find(p => p.id === id);
    if (!original) return null;
    const { id: _removedId, ...newProj } = original;
    newProj.title += suffix;
    return await persistNewProject(newProj);
  }, [projects, persistNewProject]);

  const duplicateAsTemplate = useCallback(async (id) => {
    const original = projects.find(p => p.id === id);
    if (!original) return null;
    const { id: _removedId, ...newProj } = original;
    newProj.title += " (Modelo)";
    newProj.authors = [''];
    newProj.data = {
        ...original.data, dedicatoria: '', agradecimentos: '', epigrafe: '', resumoPt: '', resumoEn: '', apendices: '', anexos: '',
        secoes: original.data.secoes.map(s => ({...s, id: generateId(), conteudo: ''})) 
    };
    return await persistNewProject(newProj);
  }, [projects, persistNewProject]);

  const updateProject = useCallback(async (id, updates) => {
    const now = new Date().toISOString();
    setProjects(prev => {
        const updatedList = prev.map(p => p.id === id ? { ...p, ...updates, updatedAt: now } : p);
        if (!user) {
            try {
                localStorage.setItem('ifpa_projects_final_v6', JSON.stringify(updatedList));
            } catch(e) {
                console.error("Erro de escrita no storage local", e);
            }
        }
        return updatedList;
    });
    
    if (user) {
      supabase.from('projects').update({ ...updates, updated_at: now }).eq('id', id).then(({error}) => {
          if (error) toast.error("Erro ao sincronizar alteração com a nuvem.");
      });
    }
  }, [user]);

  const deleteProject = useCallback(async (id, permanent = false) => {
      if (permanent) {
        setProjects(prev => {
            const newList = prev.filter(p => p.id !== id);
            if (!user) {
                try {
                    localStorage.setItem('ifpa_projects_final_v6', JSON.stringify(newList));
                } catch(e) {
                    console.error("Erro local", e);
                }
            }
            return newList;
        });
        if (user) await supabase.from('projects').delete().eq('id', id);
      } else {
        updateProject(id, { deleted: true });
      }
  }, [user, updateProject]);

  const restoreProject = useCallback((id) => updateProject(id, { deleted: false }), [updateProject]);

  const importAllProjects = useCallback((importedProjects) => {
    try {
      setProjects(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newOnes = importedProjects.filter(p => !existingIds.has(p.id));
          const combined = [...newOnes, ...prev];
          if (!user) {
              try {
                  localStorage.setItem('ifpa_projects_final_v6', JSON.stringify(combined));
              } catch(e) {
                  console.error("Sem espaço no local storage", e);
              }
          }
          return combined;
      });
      return importedProjects.length; 
    } catch (e) {
      console.error("Erro na importação:", e);
      return 0;
    }
  }, [user]);

  // Envolvendo o contexto atual em useMemo para evitar re-renderizações em massa
  const contextValue = useMemo(() => ({
    activeProjectId, setActiveProjectId, projects, setProjects, settings, setSettings,
    user, loginWithGoogle, logout, isAuthLoading, isDataLoading, 
    createNewProject, createFromExample, createFromModel, duplicateProject, duplicateAsTemplate,
    updateProject, deleteProject, restoreProject, importAllProjects
  }), [
    activeProjectId, projects, settings, user, isAuthLoading, isDataLoading,
    loginWithGoogle, logout, createNewProject, createFromExample, createFromModel,
    duplicateProject, duplicateAsTemplate, updateProject, deleteProject, restoreProject, importAllProjects
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);