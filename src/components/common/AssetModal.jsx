import React, { useRef, useState } from 'react';
import { X, Eye, ImageIcon, TableIcon, Box, Quote, UploadCloud, ImagePlus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { TABLE_PRESETS, TAG_RENDERERS } from '../../utils/constants';
import { useAppContext } from '../../contexts/AppContext';

// IMPORTAMOS O CLIENTE SUPABASE PARA O UPLOAD DE IMAGENS
import { supabase } from '../../lib/supabase';

const AssetModal = ({ isOpen, onClose, assetModal, setAssetModal, onConfirm }) => {
    const fileInputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    
    // PEGAMOS AS CONFIGURAÇÕES (TEMA) E O USER PARA SABER SE PODEMOS USAR A NUVEM
    const { settings, user } = useAppContext();

    if (!isOpen) return null;

    const { type, tableData, rows, cols, localBase64, url } = assetModal;
    const isDark = settings.theme === 'dark';

    const applyTablePreset = (preset) => {
        setAssetModal({...assetModal, rows: preset.rows, cols: preset.cols, tableData: JSON.parse(JSON.stringify(preset.data))});
    };

    const updateTableGrid = (r, c) => {
        const newData = Array(parseInt(r)||1).fill('').map((_, i) => Array(parseInt(c)||1).fill('').map((_, j) => (tableData[i]&&tableData[i][j]) ? tableData[i][j] : (i===0?`Cabeçalho ${j+1}`:'Dado')));
        setAssetModal({ ...assetModal, rows: parseInt(r)||1, cols: parseInt(c)||1, tableData: newData });
    };

    const handleCellChange = (r, c, val) => { 
        const newData = [...tableData]; 
        newData[r][c] = val; 
        setAssetModal({ ...assetModal, tableData: newData }); 
    };

    // FUNÇÃO DE CONVERSÃO LOCAL (FALLBACK OFFLINE)
    const convertToBase64 = (file) => {
        if (file.size > 500 * 1024) {
            toast.error("Para imagens maiores que 500KB, faça login primeiro.");
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            setAssetModal({ ...assetModal, localBase64: event.target.result, url: '' });
            toast.success("Imagem guardada localmente!");
        };
        reader.readAsDataURL(file);
    };

    // FUNÇÃO CENTRALIZADA DE PROCESSAMENTO DE IMAGEM (NUVEM VS LOCAL)
    const processFile = async (file) => {
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error("Formato inválido. Por favor, seleciona uma imagem.");
            return;
        }

        // Se o utilizador estiver logado, fazemos upload para o Supabase Storage
        if (user) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("A imagem excede o limite máximo de 5MB da nuvem.");
                return;
            }

            setIsUploading(true);
            const toastId = toast.loading("A enviar imagem para a nuvem...");

            try {
                // Cria um nome de ficheiro único para evitar conflitos
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `${user.id}/${fileName}`;

                // Faz o upload para o bucket 'project-assets' (Certifica-te que criaste este bucket no Supabase)
                const { error: uploadError } = await supabase.storage
                    .from('project-assets')
                    .upload(filePath, file, { cacheControl: '3600', upsert: false });

                if (uploadError) throw uploadError;

                // Obtém a URL pública permanente da imagem
                const { data: publicUrlData } = supabase.storage
                    .from('project-assets')
                    .getPublicUrl(filePath);

                setAssetModal({ ...assetModal, url: publicUrlData.publicUrl, localBase64: null });
                toast.success("Imagem guardada na nuvem em segurança!", { id: toastId });

            } catch (error) {
                console.error("Erro no upload para o Supabase:", error);
                toast.error("A nuvem falhou. A guardar localmente...", { id: toastId });
                convertToBase64(file); // Fallback imediato se a net/banco falhar
            } finally {
                setIsUploading(false);
            }
        } else {
            // Se for modo Visitante/Offline, usa apenas Base64
            convertToBase64(file);
        }
    };

    const handleFileUpload = (e) => {
        processFile(e.target.files[0]);
    };

    // EVENTOS DE DRAG & DROP
    const handleDragOver = (e) => {
        e.preventDefault();
        if (!isUploading) setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (isUploading) return;
        
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className={`${isDark ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-800'} w-full max-w-2xl rounded-3xl p-8 shadow-2xl flex flex-col max-h-[90vh] transition-colors duration-300`}>
            <div className="flex justify-between items-center mb-6 shrink-0">
                <h4 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-700'}`}>Inserir Elemento</h4>
                <button onClick={onClose} disabled={isUploading} className={`hover:scale-110 transition-transform disabled:opacity-50 ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}>
                    <X size={20}/>
                </button>
            </div>
            
            <div className="overflow-y-auto flex-1 pr-2 space-y-6">
              {type === 'tab' && (
                <div className="grid grid-cols-3 gap-3">
                    {TABLE_PRESETS.map(preset => (
                        <button 
                            key={preset.id} 
                            onClick={() => applyTablePreset(preset)} 
                            className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all 
                                ${isDark 
                                    ? 'border-slate-700 hover:border-green-500 hover:bg-green-900/20' 
                                    : 'border-slate-200 hover:border-green-500 hover:bg-green-50'}`}
                        >
                            <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>{preset.icon}</div>
                            <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{preset.label}</span>
                        </button>
                    ))}
                </div>
              )}
              
              {type !== 'cit' && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 md:col-span-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Título</label>
                        <input 
                            autoFocus={type !== 'tab'} 
                            className={`w-full p-3 border rounded-xl text-sm mt-1 focus:ring-1 focus:ring-green-500 outline-none
                                ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`} 
                            value={assetModal.title} 
                            onChange={e => setAssetModal({...assetModal, title: e.target.value})} 
                        />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Fonte</label>
                        <input 
                            className={`w-full p-3 border rounded-xl text-sm mt-1 focus:ring-1 focus:ring-green-500 outline-none
                                ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`} 
                            value={assetModal.source} 
                            onChange={e => setAssetModal({...assetModal, source: e.target.value})} 
                        />
                    </div>
                </div>
              )}
              
              {type === 'tab' && (
                <div className={`p-4 rounded-xl border space-y-4 ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center gap-4">
                        <input 
                            type="number" min="1" max="20" 
                            className={`w-full p-2 border rounded-lg text-sm outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`} 
                            value={rows} 
                            onChange={e => updateTableGrid(e.target.value, cols)} 
                        />
                        <input 
                            type="number" min="1" max="10" 
                            className={`w-full p-2 border rounded-lg text-sm outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`} 
                            value={cols} 
                            onChange={e => updateTableGrid(rows, e.target.value)} 
                        />
                    </div>
                    <div className={`overflow-x-auto border rounded-lg shadow-inner max-h-[300px] ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <table className="w-full text-xs">
                            <tbody>
                                {tableData.map((row, rI) => (
                                    <tr key={rI}>{row.map((cell, cI) => (
                                        <td key={cI} className={`border-b border-r p-0 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                                            <input 
                                                className={`w-full p-2 outline-none text-center bg-transparent ${rI === 0 ? 'font-bold' : ''} ${isDark ? 'text-white' : 'text-slate-800'}`} 
                                                value={cell} 
                                                onChange={e => handleCellChange(rI, cI, e.target.value)} 
                                            />
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
                      <div className="flex justify-between items-end">
                        <label className="text-xs font-bold text-slate-500 uppercase">Upload de Imagem</label>
                        {user ? (
                            <span className="text-[9px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">Modo Nuvem (Até 5MB)</span>
                        ) : (
                            <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">Modo Local (Até 500KB)</span>
                        )}
                      </div>
                      
                      {/* ÁREA DE DRAG AND DROP */}
                      <div 
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => !isUploading && fileInputRef.current.click()}
                        className={`w-full p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 transition-all duration-300 text-center
                            ${isUploading ? 'opacity-50 cursor-not-allowed border-slate-300' : 'cursor-pointer'}
                            ${isDragging 
                                ? 'border-green-500 bg-green-500/10 scale-[1.02]' 
                                : isDark 
                                    ? 'border-slate-700 hover:border-blue-500/50 hover:bg-slate-800/50' 
                                    : 'border-slate-300 hover:border-blue-500/50 hover:bg-slate-50'
                            }`}
                      >
                          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isUploading} />
                          
                          <div className={`p-4 rounded-full transition-colors ${isUploading ? 'bg-blue-500 text-white' : isDragging ? 'bg-green-500 text-white' : localBase64 || url ? 'bg-green-100 text-green-600' : isDark ? 'bg-slate-800 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                              {isUploading ? <Loader2 size={32} className="animate-spin" /> : isDragging || localBase64 || url ? <ImagePlus size={32} /> : <UploadCloud size={32} />}
                          </div>
                          
                          <div>
                              <p className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                                  {isUploading ? 'A processar imagem...' : isDragging ? 'Larga a imagem aqui...' : localBase64 || url ? 'Imagem carregada! Clica para trocar.' : 'Clica para enviar ou arrasta uma imagem'}
                              </p>
                              <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                  Suporta JPG, PNG, GIF
                              </p>
                          </div>
                      </div>

                      {/* INPUT DE URL ALTERNATIVO */}
                      <div className="pt-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Ou usa um link da internet direto (URL)</label>
                        <input 
                            disabled={isUploading}
                            className={`w-full p-3 border rounded-xl text-sm mt-1 focus:ring-1 focus:ring-blue-500 outline-none disabled:opacity-50
                                ${isDark ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 placeholder:text-slate-400'}`} 
                            placeholder="https://exemplo.com/imagem.png" 
                            value={url} 
                            onChange={e => setAssetModal({...assetModal, url: e.target.value, localBase64: null})} 
                        />
                      </div>
                  </div>
              )}

              {(type === 'box' || type === 'cit') && (
                <textarea 
                    placeholder="Conteúdo..." 
                    className={`w-full p-3 border rounded-xl text-sm mt-1 h-32 focus:ring-1 focus:ring-green-500 outline-none resize-none
                        ${isDark ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 placeholder:text-slate-400'}`} 
                    value={assetModal.content} 
                    onChange={e => setAssetModal({...assetModal, content: e.target.value})} 
                />
              )}
              
              <div className={`border-t pt-4 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                <p className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2"><Eye size={12}/> Pré-visualização</p>
                <div className={`p-4 rounded-xl border min-h-[100px] flex items-center justify-center 
                    ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                    <div className={`p-4 shadow-sm w-full text-sm overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                        {/* A pré-visualização herda o base64 se existir, ou o link */}
                        <div className={`${isDark ? 'text-slate-200' : 'text-black'}`}>
                            {type === 'img' && TAG_RENDERERS['IMAGEM'](`${assetModal.title}|${assetModal.source}|${localBase64 || url}`, 0)}
                            {type === 'tab' && TAG_RENDERERS['TABELA'](`${assetModal.title}|${assetModal.source}|${JSON.stringify(assetModal.tableData)}`, 0)}
                            {type === 'box' && TAG_RENDERERS['QUADRO'](`${assetModal.title}|${assetModal.source}|${assetModal.content}`, 0)}
                            {type === 'cit' && TAG_RENDERERS['CITAÇÃO'](assetModal.content, 0)}
                        </div>
                    </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex gap-3 shrink-0">
                <button 
                    onClick={onClose} 
                    disabled={isUploading}
                    className={`flex-1 py-3 font-bold transition-colors rounded-xl disabled:opacity-50 ${isDark ? 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800' : 'bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200'}`}
                >
                    Cancelar
                </button>
                <button 
                    onClick={onConfirm} 
                    disabled={isUploading}
                    className="flex-[2] py-3 bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-900/20 hover:bg-green-600 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
                >
                    {isUploading ? 'Aguarde...' : 'Inserir no Texto'}
                </button>
            </div>
          </div>
        </div>
    );
};

export default AssetModal;