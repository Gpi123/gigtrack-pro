
import React from 'react';
import { X, BrainCircuit, Loader2, Info } from 'lucide-react';

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
  isOpen, onClose, 
  onGenerateInsights, isAnalyzing, insights
}) => {

  if (!isOpen) return null;

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
