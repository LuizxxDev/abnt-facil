import React, { useRef, useState } from 'react';
import { UploadCloud, ImagePlus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { TABLE_PRESETS, TAG_RENDERERS } from '../../utils/constants';
import { useAppContext } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import Dialog from './Dialog';
import { btnPrimary, btnGhost, field, label } from './ui';

const TITLES = { img: 'Inserir figura', tab: 'Inserir tabela', box: 'Inserir quadro', cit: 'Inserir citação longa' };

const AssetModal = ({ isOpen, onClose, assetModal, setAssetModal, onConfirm }) => {
    const fileInputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    
    const { user } = useAppContext();

    if (!isOpen) return null;

    const { type, tableData, rows, cols, localBase64, url } = assetModal;

    const applyTablePreset = (preset) => {
        setAssetModal({...assetModal, rows: preset.rows, cols: preset.cols, tableData: JSON.parse(JSON.stringify(preset.data))});
    };

    const updateTableGrid = (r, c) => {
        const newRows = parseInt(r) || 1;
        const newCols = parseInt(c) || 1;
        const newData = Array(newRows).fill('').map((_, i) => 
            Array(newCols).fill('').map((_, j) => 
                (tableData[i] && tableData[i][j]) ? tableData[i][j] : (i === 0 ? `Cabeçalho ${j+1}` : 'Dado')
            )
        );
        setAssetModal({ ...assetModal, rows: newRows, cols: newCols, tableData: newData });
    };

    // CORREÇÃO CRÍTICA: Imutabilidade estrita em array 2D para React State
    const handleCellChange = (rowIndex, colIndex, val) => {
        const newData = tableData.map((row, r) => 
            r === rowIndex ? row.map((cell, c) => c === colIndex ? val : cell) : row
        );
        setAssetModal({ ...assetModal, tableData: newData });
    };

    const convertToBase64 = (file) => {
        if (file.size > 500 * 1024) {
            toast.error("Para imagens maiores que 500KB, faça login primeiro.");
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            setAssetModal({ ...assetModal, localBase64: event.target.result, url: '' });
            toast.success("Imagem salva neste aparelho.");
        };
        reader.readAsDataURL(file);
    };

    const processFile = async (file) => {
        if (!file) return;

        // SVG fica de fora: pode conter script
        if (!['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(file.type)) {
            toast.error("Formato não aceito. Use JPG, PNG, GIF ou WebP.");
            return;
        }

        if (user) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("A imagem excede o limite máximo de 5MB da nuvem.");
                return;
            }

            setIsUploading(true);
            const toastId = toast.loading("Enviando a imagem para a nuvem…");

            try {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `${user.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('project-assets')
                    .upload(filePath, file, { cacheControl: '3600', upsert: false });

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage
                    .from('project-assets')
                    .getPublicUrl(filePath);

                setAssetModal({ ...assetModal, url: publicUrlData.publicUrl, localBase64: null });
                toast.success("Imagem salva na nuvem.", { id: toastId });

            } catch (error) {
                console.error("Erro no upload para o Supabase:", error);
                toast.error("A nuvem não respondeu. Salvando neste aparelho…", { id: toastId });
                convertToBase64(file); 
            } finally {
                setIsUploading(false);
            }
        } else {
            convertToBase64(file);
        }
    };

    const handleFileUpload = (e) => processFile(e.target.files[0]);
    const handleDragOver = (e) => { e.preventDefault(); if (!isUploading) setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
    
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (isUploading) return;
        
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    };

    const keyDrop = (e) => { if ((e.key === 'Enter' || e.key === ' ') && !isUploading) { e.preventDefault(); fileInputRef.current.click(); } };

    return (
        <Dialog open={isOpen} onClose={() => !isUploading && onClose()} title={TITLES[type] || 'Inserir elemento'} size="lg"
            footer={<>
                <button type="button" onClick={onClose} disabled={isUploading} className={btnGhost}>Cancelar</button>
                <button type="button" onClick={onConfirm} disabled={isUploading} className={btnPrimary}>{isUploading ? 'Aguarde…' : 'Inserir no texto'}</button>
            </>}>
            <div className="space-y-6 pt-2">
              {type === 'tab' && (
                <div role="group" aria-label="Modelos de tabela" className="grid grid-cols-3 gap-2">
                    {TABLE_PRESETS.map(preset => (
                        <button key={preset.id} type="button" onClick={() => applyTablePreset(preset)} className="flex flex-col items-center gap-2 rounded-[var(--radius-control)] bg-surface-2 p-3 text-ink-2 transition-[background-color,color] duration-150 hover:bg-accent-soft hover:text-accent">
                            <span aria-hidden="true">{preset.icon}</span>
                            <span className="text-xs font-semibold">{preset.label}</span>
                        </button>
                    ))}
                </div>
              )}

              {type !== 'cit' && (
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="asset-titulo" className={label}>Título</label>
                        <input id="asset-titulo" data-autofocus={type !== 'tab' || undefined} autoComplete="off" className={field} value={assetModal.title} onChange={e => setAssetModal({...assetModal, title: e.target.value})} />
                    </div>
                    <div>
                        <label htmlFor="asset-fonte" className={label}>Fonte</label>
                        <input id="asset-fonte" autoComplete="off" placeholder="Ex.: Elaborado pelo autor (2026)" className={field} value={assetModal.source} onChange={e => setAssetModal({...assetModal, source: e.target.value})} />
                    </div>
                </div>
              )}

              {type === 'tab' && (
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="asset-linhas" className={label}>Linhas</label>
                            <input id="asset-linhas" type="number" inputMode="numeric" min="1" max="20" className={field} value={rows} onChange={e => updateTableGrid(e.target.value, cols)} />
                        </div>
                        <div>
                            <label htmlFor="asset-colunas" className={label}>Colunas</label>
                            <input id="asset-colunas" type="number" inputMode="numeric" min="1" max="10" className={field} value={cols} onChange={e => updateTableGrid(rows, e.target.value)} />
                        </div>
                    </div>
                    <div className="max-h-[300px] overflow-auto rounded-[var(--radius-control)] border border-line bg-surface">
                        <table className="w-full text-sm">
                            <tbody>
                                {tableData.map((row, rI) => (
                                    <tr key={rI}>{row.map((cell, cI) => (
                                        <td key={cI} className="border-b border-r border-line p-0">
                                            <input aria-label={`Linha ${rI + 1}, coluna ${cI + 1}`} className={`w-full min-w-24 bg-transparent p-2 text-center text-ink outline-none focus:bg-accent-soft ${rI === 0 ? 'font-semibold' : ''}`} value={cell} onChange={e => handleCellChange(rI, cI, e.target.value)} />
                                        </td>
                                    ))}</tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
              )}

              {type === 'img' && (
                  <div className="space-y-4">
                      <div
                        role="button"
                        tabIndex={isUploading ? -1 : 0}
                        aria-label="Escolher imagem do aparelho"
                        onKeyDown={keyDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => !isUploading && fileInputRef.current.click()}
                        className={`flex w-full flex-col items-center justify-center gap-3 rounded-[var(--radius-panel)] border-2 border-dashed p-8 text-center transition-[background-color,border-color] duration-150 ${isUploading ? 'cursor-not-allowed border-line opacity-60' : 'cursor-pointer'} ${isDragging ? 'border-accent bg-accent-soft' : 'border-line hover:border-accent hover:bg-surface-2'}`}
                      >
                          <input type="file" ref={fileInputRef} className="hidden" accept="image/png,image/jpeg,image/gif,image/webp" onChange={handleFileUpload} disabled={isUploading} />
                          <span className={`rounded-full p-3 ${localBase64 || url ? 'bg-accent-soft text-accent' : 'bg-surface-2 text-ink-2'}`} aria-hidden="true">
                              {isUploading ? <Loader2 size={28} className="animate-spin" /> : isDragging || localBase64 || url ? <ImagePlus size={28} /> : <UploadCloud size={28} />}
                          </span>
                          <span>
                              <span className="block text-sm font-semibold text-ink">{isUploading ? 'Processando a imagem…' : isDragging ? 'Solte a imagem aqui' : localBase64 || url ? 'Imagem carregada. Toque para trocar.' : 'Toque para escolher ou arraste uma imagem'}</span>
                              <span className="mt-1 block text-xs text-ink-3">JPG, PNG, GIF ou WebP · até {user ? '5 MB (nuvem)' : '500 KB (neste aparelho)'}</span>
                          </span>
                      </div>

                      <div>
                        <label htmlFor="asset-url" className={label}>Ou cole o link de uma imagem</label>
                        <input id="asset-url" type="url" inputMode="url" spellCheck={false} disabled={isUploading} className={field} placeholder="https://exemplo.com/imagem.png" value={url} onChange={e => setAssetModal({...assetModal, url: e.target.value, localBase64: null})} />
                      </div>
                  </div>
              )}

              {(type === 'box' || type === 'cit') && (
                <div>
                    <label htmlFor="asset-conteudo" className={label}>{type === 'cit' ? 'Texto da citação' : 'Conteúdo do quadro'}</label>
                    <textarea id="asset-conteudo" data-autofocus={type === 'cit' || undefined} placeholder={type === 'cit' ? 'Cole a citação com mais de três linhas…' : 'Conteúdo…'} className={`${field} h-32 resize-none`} value={assetModal.content} onChange={e => setAssetModal({...assetModal, content: e.target.value})} />
                </div>
              )}

              <div>
                <p className="mb-2 text-sm font-semibold text-ink">Como fica no trabalho</p>
                <div className="rounded-[var(--radius-control)] bg-surface-2 p-4">
                    <div className="w-full overflow-hidden bg-white p-4 text-sm text-black shadow-[var(--shadow-sheet)]">
                        {type === 'img' && TAG_RENDERERS['IMAGEM'](`${assetModal.title}|${assetModal.source}|${localBase64 || url}`, 0)}
                        {type === 'tab' && TAG_RENDERERS['TABELA'](`${assetModal.title}|${assetModal.source}|${JSON.stringify(assetModal.tableData)}`, 0)}
                        {type === 'box' && TAG_RENDERERS['QUADRO'](`${assetModal.title}|${assetModal.source}|${assetModal.content}`, 0)}
                        {type === 'cit' && TAG_RENDERERS['CITAÇÃO'](assetModal.content, 0)}
                    </div>
                </div>
              </div>
            </div>
        </Dialog>
    );
};

export default AssetModal;