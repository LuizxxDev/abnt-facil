import React from 'react';
import { Sun, Moon, Eraser, LogOut } from 'lucide-react';
import { DOCUMENT_TYPES } from '../../utils/documentTypes';
import { ESTADOS_BR } from '../../utils/constants';
import Dialog from './Dialog';
import { btnPrimary, btnGhost, btnSecondary, field, fieldBase, label, help } from './ui';

const GoogleIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
);
export { GoogleIcon };

// Controle segmentado (duas opções lado a lado)
const Segmented = ({ value, options, onChange, name }) => (
    <div role="radiogroup" aria-label={name} className="grid grid-cols-2 gap-1 rounded-[var(--radius-control)] bg-surface-2 p-1">
        {options.map(o => (
            <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}
                className={`flex h-9 items-center justify-center gap-2 rounded-[4px] text-sm font-semibold transition-[background-color,color] duration-150 ${value === o.value ? 'bg-surface text-ink shadow-[0_1px_2px_rgb(28_27_25/0.12)]' : 'text-ink-2 hover:text-ink'} ${o.className || ''}`}>
                {o.icon}{o.label}
            </button>
        ))}
    </div>
);

export const TitleModal = ({ isOpen, onClose, title, setTitle, typeKey, setTypeKey, onConfirm }) => {
    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm();
        setTitle('');
        onClose();
    };
    const handleClose = () => { setTitle(''); onClose(); };

    return (
        <Dialog open={isOpen} onClose={handleClose} title="Novo documento"
            footer={<>
                <button type="button" onClick={handleClose} className={btnGhost}>Cancelar</button>
                <button type="submit" form="novo-documento" className={btnPrimary}>Criar documento</button>
            </>}>
            <form id="novo-documento" onSubmit={handleSubmit} className="space-y-5 pt-2">
                <div>
                    <label htmlFor="novo-titulo" className={label}>Título do trabalho</label>
                    <input id="novo-titulo" data-autofocus type="text" name="titulo" autoComplete="off" className={field}
                        placeholder="Ex.: Inteligência artificial na educação básica…" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                {setTypeKey && (
                    <div>
                        <label htmlFor="novo-tipo" className={label}>Tipo de documento</label>
                        <select id="novo-tipo" className={field} value={typeKey} onChange={(e) => setTypeKey(e.target.value)}>
                            {Object.entries(DOCUMENT_TYPES).map(([key, t]) => (
                                <option key={key} value={key}>{t.label} ({t.norma})</option>
                            ))}
                        </select>
                    </div>
                )}
            </form>
        </Dialog>
    );
};

export const SettingsModal = ({ isOpen, onClose, settings, setSettings, onDeleteAll, user, loginWithGoogle, logout }) => {
    const setPerfil = (key, value) => setSettings({ ...settings, perfil: { ...settings.perfil, [key]: value } });

    return (
        <Dialog open={isOpen} onClose={onClose} title="Configurações"
            footer={<button type="button" onClick={onClose} className={btnPrimary}>Salvar e fechar</button>}>
            <div className="space-y-8 pt-2">
                <section aria-labelledby="cfg-conta">
                    <h3 id="cfg-conta" className="mb-3 text-sm font-semibold">Conta</h3>
                    {user ? (
                        <div className="flex items-center gap-3 rounded-[var(--radius-control)] bg-surface-2 p-3">
                            {user.user_metadata?.avatar_url
                                ? <img src={user.user_metadata.avatar_url} alt="" width="40" height="40" className="size-10 rounded-full" />
                                : <span className="flex size-10 items-center justify-center rounded-full bg-accent-soft font-semibold text-accent" aria-hidden="true">{(user.user_metadata?.full_name || 'E')[0]}</span>}
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold">{user.user_metadata?.full_name || 'Estudante'}</p>
                                <p className="truncate text-xs text-ink-3">{user.email} · sincronizado na nuvem</p>
                            </div>
                            <button type="button" onClick={logout} className={btnGhost}><LogOut size={16} aria-hidden="true" /> Sair</button>
                        </div>
                    ) : (
                        <div className="rounded-[var(--radius-control)] bg-surface-2 p-4">
                            <p className="text-sm font-semibold">Modo local</p>
                            <p className="mt-0.5 text-sm text-ink-2">Os documentos ficam só neste navegador. Entre com o Google para guardar uma cópia na nuvem.</p>
                            <button type="button" onClick={loginWithGoogle} className={`${btnSecondary} mt-3 w-full bg-surface hover:bg-surface`}><GoogleIcon /> Entrar com Google</button>
                        </div>
                    )}
                </section>

                {!user && (
                    <div>
                        <label htmlFor="cfg-nome" className={label}>Seu nome</label>
                        <input id="cfg-nome" type="text" name="nome" autoComplete="given-name" placeholder="Como quer ser chamado?" className={field}
                            value={settings.userName || ''} onChange={(e) => setSettings({ ...settings, userName: e.target.value })} />
                    </div>
                )}

                <section aria-labelledby="cfg-perfil">
                    <h3 id="cfg-perfil" className="text-sm font-semibold">Perfil acadêmico</h3>
                    <p className={`${help} mb-3 mt-0.5`}>Preenche sozinho os próximos documentos que você criar.</p>
                    <div className="space-y-2">
                        {[['instituicao', 'Instituição', 'Ex.: Universidade Federal do Pará'], ['curso', 'Curso ou programa', 'Ex.: Engenharia Civil'], ['orientador', 'Orientador(a)', 'Ex.: Prof. Dr. Nome Sobrenome']].map(([key, name, placeholder]) => (
                            <input key={key} type="text" aria-label={name} placeholder={placeholder} autoComplete="off" className={field}
                                value={settings.perfil?.[key] || ''} onChange={(e) => setPerfil(key, e.target.value)} />
                        ))}
                        <div className="flex gap-2">
                            <input type="text" aria-label="Cidade" placeholder="Cidade" autoComplete="address-level2" className={`${field} min-w-0 flex-1`}
                                value={settings.perfil?.cidade || ''} onChange={(e) => setPerfil('cidade', e.target.value)} />
                            <select aria-label="Estado" className={`${fieldBase} w-24 shrink-0`} value={settings.perfil?.estado || 'PA'} onChange={(e) => setPerfil('estado', e.target.value)}>
                                {ESTADOS_BR.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                    </div>
                </section>

                <section aria-labelledby="cfg-aparencia" className="space-y-4">
                    <h3 id="cfg-aparencia" className="text-sm font-semibold">Aparência</h3>
                    <Segmented name="Tema" value={settings.theme === 'dark' ? 'dark' : 'light'} onChange={(v) => setSettings({ ...settings, theme: v })}
                        options={[{ value: 'light', label: 'Claro', icon: <Sun size={15} aria-hidden="true" /> }, { value: 'dark', label: 'Escuro', icon: <Moon size={15} aria-hidden="true" /> }]} />
                    <div>
                        <p className="mb-1.5 text-sm text-ink-2">Fonte padrão do documento</p>
                        <Segmented name="Fonte padrão" value={settings.defaultFont} onChange={(v) => setSettings({ ...settings, defaultFont: v })}
                            options={[{ value: 'Arial', label: 'Arial' }, { value: 'Times New Roman', label: 'Times New Roman' }]} />
                    </div>
                    <label className="flex cursor-pointer items-center justify-between gap-4 py-1">
                        <span>
                            <span className="block text-sm font-semibold">Salvamento automático</span>
                            <span className="block text-xs text-ink-3">Salva o documento enquanto você escreve</span>
                        </span>
                        <input type="checkbox" role="switch" className="peer sr-only" checked={!!settings.autoSave} onChange={() => setSettings({ ...settings, autoSave: !settings.autoSave })} />
                        <span aria-hidden="true" className="relative h-6 w-11 shrink-0 rounded-full bg-line transition-colors duration-150 peer-checked:bg-accent-fill peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform after:duration-150 peer-checked:after:translate-x-5" />
                    </label>
                </section>

                <section aria-labelledby="cfg-perigo" className="border-t border-line pt-6">
                    <h3 id="cfg-perigo" className="text-sm font-semibold text-danger">Apagar dados</h3>
                    <p className={`${help} mb-3 mt-0.5`}>{user ? 'Remove os documentos e imagens da sua conta na nuvem e tudo o que está neste navegador.' : 'Remove todos os documentos e configurações deste navegador.'} <a href="/privacidade" className="underline underline-offset-2">Como pedir a exclusão da conta</a>.</p>
                    <button type="button" onClick={onDeleteAll} className={`${btnGhost} text-danger hover:bg-danger-soft hover:text-danger`}><Eraser size={16} aria-hidden="true" /> Apagar todos os documentos</button>
                </section>
            </div>
        </Dialog>
    );
};
