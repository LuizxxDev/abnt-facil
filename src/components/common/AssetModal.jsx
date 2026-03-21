import React, { useRef } from 'react';
import { X, Eye, ImageIcon, TableIcon, Box, Quote, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { TABLE_PRESETS, TAG_RENDERERS } from '../../utils/constants';
// IMPORTAMOS O CONTEXTO PARA SABER O TEMA
import { useAppContext } from '../../contexts/AppContext';

const AssetModal = ({ isOpen, onClose, assetModal, setAssetModal, onConfirm }) => {
    const fileInputRef = useRef(null);
    // PEGAMOS AS CONFIGURAÇÕES (settings) ONDE ESTÁ O TEMA
    const { settings } = useAppContext();

    if (!isOpen) return null;

    const { type, tableData, rows, cols } = assetModal;
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

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 500 * 1024) {
            toast.error("Imagem muito grande! Máximo 500KB.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            setAssetModal({ ...assetModal, url: event.target.result });
            toast.success("Imagem carregada!");
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className={`${isDark ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-800'} w-full max-w-2xl rounded-3xl p-8 shadow-2xl flex flex-col max-h-[90vh] transition-colors duration-300`}>
            <div className="flex justify-between items-center mb-6 shrink-0">
                <h4 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-700'}`}>Inserir Elemento</h4>
                <button onClick={onClose} className={`hover:scale-110 transition-transform ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}>
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
                  <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">URL ou Upload Local</label>
                      <div className="flex gap-2 mt-1">
                        <input 
                            className={`flex-1 p-3 border rounded-xl text-sm focus:ring-1 focus:ring-green-500 outline-none
                                ${isDark ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 placeholder:text-slate-400'}`} 
                            placeholder="Cole uma URL ou clique no ícone ao lado" 
                            value={assetModal.url} 
                            onChange={e => setAssetModal({...assetModal, url: e.target.value})} 
                        />
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                        <button 
                            onClick={() => fileInputRef.current.click()} 
                            className={`p-3 rounded-xl transition-colors shrink-0 
                                ${isDark ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`} 
                            title="Carregar do computador"
                        >
                            <Upload size={20}/>
                        </button>
                      </div>
                      <p className={`text-[10px] mt-1 italic ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>* Dica: Prefira imagens menores que 500KB para garantir a performance.</p>
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
                    <div className={`p-4 shadow-sm w-full text-sm ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                        {/* A pré-visualização agora herda as cores do fundo, mas mantém a estrutura intacta */}
                        <div className={`${isDark ? 'text-slate-200' : 'text-black'}`}>
                            {type === 'img' && TAG_RENDERERS['IMAGEM'](`${assetModal.title}|${assetModal.source}|${assetModal.url}`, 0)}
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
                    className={`flex-1 py-3 font-bold transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Cancelar
                </button>
                <button 
                    onClick={onConfirm} 
                    className="flex-[2] py-3 bg-green-700 text-white rounded-xl font-bold shadow-lg hover:bg-green-600 transition-colors"
                >
                    Inserir no Texto
                </button>
            </div>
          </div>
        </div>
    );
};

export default AssetModal;