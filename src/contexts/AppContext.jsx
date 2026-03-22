import React, { createContext, useState, useEffect, useContext } from 'react';
import toast from 'react-hot-toast'; 
import { generateId } from '../utils/helpers';
import { DEFAULT_CHECKLIST, EXAMPLE_PROJECT, PROJECT_TYPES } from '../utils/constants';
// Ligação ao Supabase
import { supabase } from '../lib/supabase';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [projects, setProjects] = useState([]);
  
  // ESTADOS DE CONTROLE DE DADOS E AUTH
  const [user, setUser] = useState(null); 
  const [isAuthLoading, setIsAuthLoading] = useState(true); 
  const [isDataLoading, setIsDataLoading] = useState(true);

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('ifpa_app_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return { 
        theme: 'dark', 
        autoSave: true, 
        defaultFont: 'Arial', 
        userName: '' 
    };
  });

  // 1. Escutar Auth: COM INTERCEPTADOR MANUAL DE TOKEN
  useEffect(() => {
    let mounted = true;

    // A. INTERCEPTADOR: Puxa o token à força antes que o React Router o perca
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
        setIsAuthLoading(true);
        toast.loading("A processar a tua entrada...", { id: 'auth-toast' });

        const hashParams = new URLSearchParams(hash.replace('#', ''));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken) {
            supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
            }).then(({ data, error }) => {
                if (error) {
                    console.error("Erro no interceptador:", error);
                    toast.error(`Falha no login: ${error.message}`, { id: 'auth-toast' });
                } else {
                    if (mounted) setUser(data.session?.user ?? null);
                    toast.success("Conta sincronizada com sucesso!", { id: 'auth-toast' });
                    window.history.replaceState(null, '', window.location.pathname);
                }
                if (mounted) setIsAuthLoading(false);
            });
            return; 
        }
    }

    // B. FLUXO NORMAL: Verifica se já estamos logados
    supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error) console.error("Erro getSession:", error);
        if (mounted) {
            setUser(session?.user ?? null);
            setIsAuthLoading(false);
        }
    });

    // C. OUVINTE DE MUDANÇAS
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (mounted) {
            setUser(session?.user ?? null);
            if (!window.location.hash.includes('access_token')) {
                setIsAuthLoading(false);
            }
        }
    });

    return () => {
        mounted = false;
        subscription.unsubscribe();
    };
  }, []);

  // 2. Carregar projetos APENAS depois da Autenticação terminar
  useEffect(() => {
    const loadData = async () => {
      setIsDataLoading(true);

      if (user) {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('updated_at', { ascending: false });
        
        if (error) {
            console.error("Erro ao carregar da nuvem:", error.message);
            toast.error("Erro de sincronização. Usando dados locais.");
            const saved = localStorage.getItem('ifpa_projects_final_v6');
            if (saved) setProjects(JSON.parse(saved));
        } else if (data) {
          const mapped = data.map(p => ({
            ...p,
            createdAt: p.created_at,
            updatedAt: p.updated_at
          }));
          setProjects(mapped);
        }
      } else {
        const saved = localStorage.getItem('ifpa_projects_final_v6');
        if (saved) setProjects(JSON.parse(saved));
        else setProjects([]); 
      }
      
      setIsDataLoading(false); 
    };

    if (!isAuthLoading) {
        loadData();
    }
  }, [user, isAuthLoading]);

  // Sincronizar definições
  useEffect(() => {
      localStorage.setItem('ifpa_app_settings', JSON.stringify(settings));
      if (settings.theme === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
  }, [settings]);

  const saveAndSet = async (newList) => {
    setProjects(newList);
    if (!user) {
      localStorage.setItem('ifpa_projects_final_v6', JSON.stringify(newList));
    }
  };

  // --- FUNÇÕES DE AUTENTICAÇÃO ---
  const loginWithGoogle = async () => {
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { 
                redirectTo: window.location.origin + '/dashboard'
            }
        });

        if (error) {
            toast.error(`Erro ao iniciar sessão: ${error.message}`);
        }
    } catch (err) {
        toast.error("Falha ao comunicar com o servidor.");
    }
  };

  // --- LÓGICA DE LOGOUT REFORÇADA E IMPLACÁVEL ---
  const logout = async () => {
    toast.loading("A encerrar sessão...", { id: 'logout-toast' });
    
    try {
        // Tenta fazer o logout oficial com o Supabase
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            console.warn("Servidor devolveu erro no logout (sessão possivelmente órfã):", error);
            // Destrói o token guardado no navegador à força!
            for (let key in localStorage) {
                if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
                    localStorage.removeItem(key);
                }
            }
        }
    } catch (error) {
        console.error("Falha na comunicação de logout:", error);
    } finally {
        // Este bloco corre SEMPRE, mesmo que a nuvem falhe
        
        setUser(null); // Remove os dados visuais imediatamente
        
        // Puxa os dados locais para não deixar a tela vazia
        const saved = localStorage.getItem('ifpa_projects_final_v6');
        setProjects(saved ? JSON.parse(saved) : []);
        
        toast.success("Sessão terminada.", { id: 'logout-toast' });
        
        // Força um recarregamento limpo da página para limpar a memória RAM e fechar o modal
        setTimeout(() => {
            window.location.reload();
        }, 800);
    }
  };

  // --- GESTÃO DE PROJETOS ---
  const prepareProjectObject = (title, dataOverride = null) => ({
    title, 
    authors: [''], 
    checklist: DEFAULT_CHECKLIST, 
    favorite: false,
    deleted: false,
    data: dataOverride || { 
      instituicao: 'INSTITUTO FEDERAL DE EDUCAÇÃO, CIÊNCIA E TECNOLOGIA DO PARÁ', 
      curso: '', 
      titulo: '', 
      subtitulo: '', 
      naturezaTrabalho: 'Trabalho de Conclusão de Curso...', 
      orientadores: [''], 
      cidade: 'Belém', 
      estado: 'PA', 
      ano: new Date().getFullYear().toString(), 
      dedicatoria: '',
      agradecimentos: '',
      epigrafe: '',
      resumoPt: '', 
      palavrasChavePt: '', 
      resumoEn: '', 
      palavrasChaveEn: '', 
      secoes: [
        { id: generateId(), titulo: 'INTRODUÇÃO', conteudo: '', level: 1 }, 
        { id: generateId(), titulo: 'REFERENCIAL TEÓRICO', conteudo: '', level: 1 }
      ], 
      referencias: '',
      apendices: '',
      anexos: '' 
    }
  });

  const createNewProject = async (title) => {
    const newProj = prepareProjectObject(title);

    if (user) {
      const { data, error } = await supabase.from('projects').insert([{ ...newProj, user_id: user.id }]).select();
      if (!error && data) {
        setProjects([{ ...data[0], createdAt: data[0].created_at, updatedAt: data[0].updated_at }, ...projects]);
        return data[0].id;
      }
    } else {
      const localProj = { ...newProj, id: generateId(), updatedAt: new Date().toISOString(), createdAt: new Date().toISOString() };
      saveAndSet([localProj, ...projects]);
      return localProj.id;
    }
  };

  const createFromModel = async (modelKey) => {
    const model = PROJECT_TYPES[modelKey];
    const title = `${model.label} - ${new Date().toLocaleDateString()}`;
    const customData = {
        instituicao: 'INSTITUTO FEDERAL DE EDUCAÇÃO, CIÊNCIA E TECNOLOGIA DO PARÁ',
        curso: '',
        titulo: model.label.toUpperCase(),
        subtitulo: '',
        naturezaTrabalho: `${model.label} apresentado ao Instituto Federal do Pará.`,
        orientadores: [''], 
        cidade: 'Belém',
        estado: 'PA',
        ano: new Date().getFullYear().toString(),
        dedicatoria: '',
        agradecimentos: '',
        epigrafe: '',
        resumoPt: '',
        palavrasChavePt: '',
        resumoEn: '',
        palavrasChaveEn: '',
        secoes: model.sections.map(s => ({ ...s, id: generateId() })),
        referencias: '',
        apendices: '',
        anexos: ''
    };
    
    const newProj = prepareProjectObject(title, customData);

    if (user) {
      const { data, error } = await supabase.from('projects').insert([{ ...newProj, user_id: user.id }]).select();
      if (!error && data) {
        setProjects([{ ...data[0], createdAt: data[0].created_at, updatedAt: data[0].updated_at }, ...projects]);
        return data[0].id;
      }
    } else {
      const localId = generateId();
      saveAndSet([{ ...newProj, id: localId, updatedAt: new Date().toISOString(), createdAt: new Date().toISOString() }, ...projects]);
      return localId;
    }
  };

  const createFromExample = async () => {
    const title = 'Meu TCC (Baseado no Modelo)';
    const customData = {
        ...EXAMPLE_PROJECT.data,
        curso: '', 
        orientadores: EXAMPLE_PROJECT.data.orientadores ? [...EXAMPLE_PROJECT.data.orientadores] : [''], 
        resumoPt: '', 
        resumoEn: '', 
        dedicatoria: '', 
        agradecimentos: '',
        epigrafe: '',
        apendices: '',
        anexos: '',
        secoes: EXAMPLE_PROJECT.data.secoes.map(s => ({...s, id: generateId(), conteudo: ''}))
    };
    const newProj = prepareProjectObject(title, customData);

    if (user) {
      const { data, error } = await supabase.from('projects').insert([{ ...newProj, user_id: user.id }]).select();
      if (!error && data) {
        setProjects([{ ...data[0], createdAt: data[0].created_at, updatedAt: data[0].updated_at }, ...projects]);
        return data[0].id;
      }
    } else {
      const localId = generateId();
      saveAndSet([{ ...newProj, id: localId, updatedAt: new Date().toISOString(), createdAt: new Date().toISOString() }, ...projects]);
      return localId;
    }
  };

  const duplicateProject = async (id, suffix = " (Cópia)") => {
    const original = projects.find(p => p.id === id);
    if (!original) return null;
    
    const newProj = { 
        ...original, 
        title: original.title + suffix, 
    };
    delete newProj.id; 

    if (user) {
      const { data, error } = await supabase.from('projects').insert([{ ...newProj, user_id: user.id }]).select();
      if (!error && data) {
        setProjects([{ ...data[0], createdAt: data[0].created_at, updatedAt: data[0].updated_at }, ...projects]);
        return data[0].id;
      }
    } else {
      const localId = generateId();
      saveAndSet([{ ...newProj, id: localId, updatedAt: new Date().toISOString(), createdAt: new Date().toISOString() }, ...projects]);
      return localId;
    }
  };

  const duplicateAsTemplate = async (id) => {
    const original = projects.find(p => p.id === id);
    if (!original) return null;
    
    const newProj = { 
        ...original, 
        title: original.title + " (Modelo)", 
        authors: [''], 
        data: {
            ...original.data,
            dedicatoria: '',
            agradecimentos: '',
            epigrafe: '',
            resumoPt: '', 
            resumoEn: '', 
            apendices: '',
            anexos: '',
            secoes: original.data.secoes.map(s => ({...s, id: generateId(), conteudo: ''})) 
        }
    };
    delete newProj.id;

    if (user) {
      const { data, error } = await supabase.from('projects').insert([{ ...newProj, user_id: user.id }]).select();
      if (!error && data) {
        setProjects([{ ...data[0], createdAt: data[0].created_at, updatedAt: data[0].updated_at }, ...projects]);
        return data[0].id;
      }
    } else {
      const localId = generateId();
      saveAndSet([{ ...newProj, id: localId, updatedAt: new Date().toISOString(), createdAt: new Date().toISOString() }, ...projects]);
      return localId;
    }
  };

  const updateProject = async (id, updates) => {
    const now = new Date().toISOString();
    setProjects(projects.map(p => p.id === id ? { ...p, ...updates, updatedAt: now } : p));
    
    if (user) {
      const { error } = await supabase.from('projects').update({ ...updates, updated_at: now }).eq('id', id);
      if (error) toast.error("Erro ao sincronizar alteração com a nuvem.");
    } else {
      const updatedList = projects.map(p => p.id === id ? { ...p, ...updates, updatedAt: now } : p);
      localStorage.setItem('ifpa_projects_final_v6', JSON.stringify(updatedList));
    }
  };

  const deleteProject = async (id, permanent = false) => {
      if (permanent) {
        setProjects(projects.filter(p => p.id !== id));
        if (user) await supabase.from('projects').delete().eq('id', id);
        else {
            const newList = projects.filter(p => p.id !== id);
            localStorage.setItem('ifpa_projects_final_v6', JSON.stringify(newList));
        }
      } else {
        updateProject(id, { deleted: true });
      }
  };

  const restoreProject = (id) => {
    updateProject(id, { deleted: false });
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

  return (
    <AppContext.Provider value={{
      activeProjectId, setActiveProjectId,
      projects, setProjects,
      settings, setSettings,
      user, loginWithGoogle, logout,
      isAuthLoading, isDataLoading, 
      createNewProject, createFromExample, createFromModel,
      duplicateProject, duplicateAsTemplate,
      updateProject, deleteProject, restoreProject,
      importAllProjects
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);