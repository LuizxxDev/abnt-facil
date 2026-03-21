import React, { useRef } from 'react';
import { X, Eye, ImageIcon, TableIcon, Box, Quote, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { TABLE_PRESETS, TAG_RENDERERS } from '../../utils/constants';

const AssetModal = ({ isOpen, onClose, assetModal, setAssetModal, onConfirm }) => {
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const { type, tableData, rows, cols } = assetModal;

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
          <div className="bg-white w-full max-w-2xl rounded-3xl p-8 shadow-2xl flex flex-col max-h-[90vh] text-slate-800">
            <div className="flex justify-between items-center mb-6 shrink-0">
                <h4 className="font-bold text-lg text-slate-700">Inserir Elemento</h4>
                <button onClick={onClose}><X size={20}/></button>
            </div>
            
            <div className="overflow-y-auto flex-1 pr-2 space-y-6">
              {type === 'tab' && (
                <div className="grid grid-cols-3 gap-3">
                    {TABLE_PRESETS.map(preset => (
                        <button key={preset.id} onClick={() => applyTablePreset(preset)} className="flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-200 hover:border-green-500 hover:bg-green-50 transition-all">
                            <div className="text-slate-500">{preset.icon}</div>
                            <span className="text-xs font-bold text-slate-700">{preset.label}</span>
                        </button>
                    ))}
                </div>
              )}
              
              {type !== 'cit' && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 md:col-span-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Título</label>
                        <input autoFocus={type !== 'tab'} className="w-full p-3 bg-slate-50 border rounded-xl text-sm mt-1" value={assetModal.title} onChange={e => setAssetModal({...assetModal, title: e.target.value})} />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Fonte</label>
                        <input className="w-full p-3 bg-slate-50 border rounded-xl text-sm mt-1" value={assetModal.source} onChange={e => setAssetModal({...assetModal, source: e.target.value})} />
                    </div>
                </div>
              )}
              
              {type === 'tab' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                    <div className="flex items-center gap-4">
                        <input type="number" min="1" max="20" className="w-full p-2 bg-white border rounded-lg text-sm" value={rows} onChange={e => updateTableGrid(e.target.value, cols)} />
                        <input type="number" min="1" max="10" className="w-full p-2 bg-white border rounded-lg text-sm" value={cols} onChange={e => updateTableGrid(rows, e.target.value)} />
                    </div>
                    <div className="overflow-x-auto border rounded-lg bg-white shadow-inner max-h-[300px]">
                        <table className="w-full text-xs">
                            <tbody>
                                {tableData.map((row, rI) => (
                                    <tr key={rI}>{row.map((cell, cI) => (
                                        <td key={cI} className="border-b border-r p-0">
                                            <input className={`w-full p-2 outline-none text-center ${rI === 0 ? 'font-bold' : ''}`} value={cell} onChange={e => handleCellChange(rI, cI, e.target.value)} />
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
                        <input className="flex-1 p-3 bg-slate-50 border rounded-xl text-sm" placeholder="Cole uma URL ou clique no ícone ao lado" value={assetModal.url} onChange={e => setAssetModal({...assetModal, url: e.target.value})} />
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                        <button onClick={() => fileInputRef.current.click()} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors" title="Carregar do computador">
                            <Upload size={20}/>
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 italic">* Dica: Prefira imagens menores que 500KB para garantir a performance.</p>
                  </div>
              )}

              {(type === 'box' || type === 'cit') && (
                <textarea placeholder="Conteúdo..." className="w-full p-3 bg-slate-50 border rounded-xl text-sm mt-1 h-32" value={assetModal.content} onChange={e => setAssetModal({...assetModal, content: e.target.value})} />
              )}
              
              <div className="border-t pt-4">
                <p className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2"><Eye size={12}/> Pré-visualização</p>
                <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 min-h-[100px] flex items-center justify-center">
                    <div className="bg-white p-4 shadow-sm w-full text-sm">
                        {type === 'img' && TAG_RENDERERS['IMAGEM'](`${assetModal.title}|${assetModal.source}|${assetModal.url}`, 0)}
                        {type === 'tab' && TAG_RENDERERS['TABELA'](`${assetModal.title}|${assetModal.source}|${JSON.stringify(assetModal.tableData)}`, 0)}
                        {type === 'box' && TAG_RENDERERS['QUADRO'](`${assetModal.title}|${assetModal.source}|${assetModal.content}`, 0)}
                        {type === 'cit' && TAG_RENDERERS['CITAÇÃO'](assetModal.content, 0)}
                    </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex gap-3 shrink-0">
                <button onClick={onClose} className="flex-1 py-3 font-bold text-slate-400">Cancelar</button>
                <button onClick={onConfirm} className="flex-[2] py-3 bg-green-700 text-white rounded-xl font-bold shadow-lg hover:bg-green-800 transition-colors">Inserir no Texto</button>
            </div>
          </div>
        </div>
    );
};

export default AssetModal;