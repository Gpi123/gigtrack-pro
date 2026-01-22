
import React from 'react';
import { Calendar as CalendarIcon, X, Search, Music, DollarSign, CheckCircle2, Clock } from 'lucide-react';
import { FinancialStats } from '../types';

interface PeriodFilterProps {
  startDate: string;
  endDate: string;
  onStartChange: (date: string) => void;
  onEndChange: (date: string) => void;
  onClear: () => void;
  isActive: boolean;
  stats: FinancialStats;
  gigCount: number;
  showValues: boolean;
  onQuickFilter: (type: 'week' | 'month' | 'year') => void;
}

const PeriodFilter: React.FC<PeriodFilterProps> = ({ 
  startDate, 
  endDate, 
  onStartChange, 
  onEndChange, 
  onClear,
  isActive,
  stats,
  gigCount,
  showValues,
  onQuickFilter
}) => {
  const formatCurrency = (val: number) => {
    if (!showValues) return 'R$ ••••';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className={`bg-slate-900 border transition-all duration-300 rounded-2xl p-5 shadow-xl ${isActive ? 'border-slate-600 ring-1 ring-slate-500/20' : 'border-slate-800'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Search size={14} className="text-slate-400" />
          Filtrar Período
        </h3>
        {isActive && (
          <button 
            onClick={onClear}
            className="text-[10px] font-bold text-rose-500 hover:text-rose-400 uppercase flex items-center gap-1 transition-colors"
          >
            <X size={12} /> Limpar
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Quick Filters */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onQuickFilter('week')}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all border border-slate-700"
          >
            Última Semana
          </button>
          <button
            onClick={() => onQuickFilter('month')}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all border border-slate-700"
          >
            Último Mês
          </button>
          <button
            onClick={() => onQuickFilter('year')}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all border border-slate-700"
          >
            Último Ano
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase ml-1">Início</span>
            <div className="relative">
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => onStartChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-slate-600 transition-colors appearance-none"
              />
              <CalendarIcon size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
            </div>
          </div>
          
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase ml-1">Fim</span>
            <div className="relative">
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => onEndChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-slate-600 transition-colors appearance-none"
              />
              <CalendarIcon size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
            </div>
          </div>
        </div>
        
        {isActive ? (
          <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                <span className="text-[10px] font-bold text-slate-300 uppercase">Resultado do Período</span>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-700 rounded-full">
                  <Music size={10} className="text-slate-400" />
                  <span className="text-[10px] font-black text-slate-300">{gigCount} SHOWS</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Total Bruto</span>
                  <span className="text-lg font-bold text-white tracking-tight transition-all duration-300">
                    {formatCurrency(stats.overallTotal)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="bg-slate-950/50 rounded-lg p-2 border border-slate-800">
                    <div className="flex items-center gap-1 mb-1">
                      <CheckCircle2 size={10} className="text-emerald-500" />
                      <span className="text-[8px] font-bold text-slate-500 uppercase">Recebido</span>
                    </div>
                    <div className="text-xs font-bold text-emerald-400 truncate transition-all duration-300">
                      {formatCurrency(stats.totalReceived)}
                    </div>
                  </div>
                  <div className="bg-slate-950/50 rounded-lg p-2 border border-slate-800">
                    <div className="flex items-center gap-1 mb-1">
                      <Clock size={10} className="text-amber-500" />
                      <span className="text-[8px] font-bold text-slate-500 uppercase">Pendente</span>
                    </div>
                    <div className="text-xs font-bold text-amber-400 truncate transition-all duration-300">
                      {formatCurrency(stats.totalPending)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (startDate || endDate) ? (
          <p className="text-[10px] text-slate-500 text-center italic mt-2">
            Selecione ambas as datas para ver o resumo.
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default PeriodFilter;
