
import React, { useState } from 'react';
import { X, Cloud, RefreshCw, ShieldCheck, Database, Download, BrainCircuit, Loader2, Info, Copy, Check, Hash, ArrowRight } from 'lucide-react';
import { syncService } from '../services/syncService';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  syncId: string;
  onSetSyncId: (id: string) => void;
  lastSync: number;
  onCloudSync: () => void;
  onImportCloud: (id: string) => void;
  isSyncing: boolean;
  onExportBackup: () => void;
  onGenerateInsights: () => void;
  isAnalyzing: boolean;
  insights: string;
}

const SideMenu: React.FC<SideMenuProps> = ({
  isOpen, onClose, syncId, onSetSyncId, lastSync, onCloudSync, onImportCloud, isSyncing, 
  onExportBackup, onGenerateInsights, isAnalyzing, insights
}) => {
  const [inputPin, setInputPin] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerateId = async () => {
    const newId = syncService.generateNumericId();
    onSetSyncId(newId);
  };

  const copyId = () => {
    navigator.clipboard.writeText(syncId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-[340px] bg-slate-900 border-r border-slate-800 h-full flex flex-col animate-in slide-in-from-left duration-300 shadow-2xl">
        <div className="p-6 border-b border-slate-800 bg-slate-950/40">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Painel Pro</h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Menu de Ferramentas</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-10">
          {/* Cloud Sync Section */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Cloud size={14} className="text-indigo-500" /> Sincronização em Nuvem
            </h3>
            
            {syncId ? (
              <div className="space-y-3">
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4">
                  <p className="text-[9px] font-bold text-indigo-400 uppercase mb-2 tracking-widest">Seu ID de Sincronização</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-white tracking-[0.2em]">{syncId}</span>
                    <button onClick={copyId} className="p-2 hover:bg-white/10 rounded-lg text-indigo-400 transition-colors">
                      {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>
                
                <button 
                  onClick={onCloudSync}
                  disabled={isSyncing}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSyncing ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                  Sincronizar Agora
                </button>
                
                {lastSync > 0 && (
                  <p className="text-[9px] text-slate-500 text-center italic">
                    Último envio: {new Date(lastSync).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-2xl">
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                    Sincronize seus dados entre dispositivos usando um ID numérico simples.
                  </p>
                  <button 
                    onClick={handleGenerateId}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl text-xs font-bold transition-all"
                  >
                    Gerar Novo ID
                  </button>
                </div>
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
                    <Hash size={14} />
                  </div>
                  <input 
                    type="text"
                    placeholder="Já tem um ID? Digite aqui"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-12 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                    value={inputPin}
                    onChange={e => setInputPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                  <button 
                    onClick={() => onImportCloud(inputPin)}
                    disabled={inputPin.length < 6 || isSyncing}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
                  >
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Backup */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Database size={14} className="text-indigo-500" /> Backup Local
            </h3>
            <button onClick={onExportBackup} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-4 rounded-2xl flex items-center justify-center gap-3 border border-slate-700 transition-all active:scale-95">
              <Download size={18} className="text-emerald-400" /> Baixar Cópia (JSON)
            </button>
          </section>

          {/* AI Section */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <BrainCircuit size={14} className="text-indigo-500" /> GigTrack AI
            </h3>
            <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-3xl p-6">
               <button onClick={onGenerateInsights} disabled={isAnalyzing} className="w-full bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-200 border border-indigo-500/30 py-4 rounded-2xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                {isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <BrainCircuit size={18} />}
                {isAnalyzing ? 'Analisando...' : 'Insights Financeiros'}
              </button>
              {insights && (
                <div className="mt-5 bg-slate-950/60 rounded-2xl p-5 border border-indigo-500/10 text-[11px] leading-relaxed text-slate-300 whitespace-pre-line animate-in fade-in duration-700">
                  <div className="flex items-center gap-2 mb-3 text-indigo-400 font-black uppercase tracking-widest text-[8px]">
                    <Info size={10} /> Relatório Inteligente
                  </div>
                  {insights}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="p-8 border-t border-slate-800 text-center bg-slate-950/30">
          <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em]">GIGTRACK PRO v3.0</p>
        </div>
      </div>
    </div>
  );
};

export default SideMenu;
