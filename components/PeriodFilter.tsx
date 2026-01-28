
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
    <div className={`bg-[#24272D] border transition-all duration-300 rounded-2xl p-5 shadow-xl select-none ${isActive ? 'border-[#3057F2] ring-1 ring-[#3057F2]/20' : 'border-[#31333B]'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2 select-none">
          <Search size={14} className="text-white" />
          Filtrar Período
        </h3>
        {isActive && (
          <button 
            onClick={onClear}
            className="text-[10px] font-bold text-rose-500 hover:text-rose-400 uppercase flex items-center gap-1 transition-colors select-none"
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
            className="px-3 py-2 bg-[#1E1F25] hover:bg-[#24272D] text-white text-xs font-semibold rounded-xl transition-all border border-[#31333B] select-none"
          >
            Esta Semana
          </button>
          <button
            onClick={() => onQuickFilter('month')}
            className="px-3 py-2 bg-[#1E1F25] hover:bg-[#24272D] text-white text-xs font-semibold rounded-xl transition-all border border-[#31333B] select-none"
          >
            Mês Atual
          </button>
          <button
            onClick={() => onQuickFilter('year')}
            className="px-3 py-2 bg-[#1E1F25] hover:bg-[#24272D] text-white text-xs font-semibold rounded-xl transition-all border border-[#31333B] select-none"
          >
            Ano Atual
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-white uppercase ml-1 select-none">Início</span>
            <div className="relative">
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => onStartChange(e.target.value)}
                className="w-full bg-[#1E1F25] border border-[#31333B] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3057F2] transition-colors appearance-none"
              />
              <CalendarIcon size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
            </div>
          </div>
          
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-white uppercase ml-1 select-none">Fim</span>
            <div className="relative">
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => onEndChange(e.target.value)}
                className="w-full bg-[#1E1F25] border border-[#31333B] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3057F2] transition-colors appearance-none"
              />
              <CalendarIcon size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
            </div>
          </div>
        </div>
        
        {isActive ? (
          <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="bg-[#1E1F25] border border-[#31333B] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#31333B] pb-2">
                <span className="text-[10px] font-bold text-white uppercase select-none">Resultado do Período</span>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#24272D] rounded-full">
                  <Music size={10} className="text-white" />
                  <span className="text-[10px] font-black text-white select-none">{gigCount} SHOWS</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-bold text-white uppercase select-none">Total Bruto</span>
                  <span className="text-lg font-bold text-white tracking-tight transition-all duration-300 select-none">
                    {formatCurrency(stats.overallTotal)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="bg-[#24272D] rounded-lg p-2 border border-[#31333B]">
                    <div className="flex items-center gap-1 mb-1">
                      <CheckCircle2 size={10} className="text-emerald-500" />
                      <span className="text-[8px] font-bold text-white uppercase select-none">Recebido</span>
                    </div>
                    <div className="text-xs font-bold text-emerald-400 truncate transition-all duration-300 select-none">
                      {formatCurrency(stats.totalReceived)}
                    </div>
                  </div>
                  <div className="bg-[#24272D] rounded-lg p-2 border border-[#31333B]">
                    <div className="flex items-center gap-1 mb-1">
                      <Clock size={10} className="text-amber-500" />
                      <span className="text-[8px] font-bold text-white uppercase select-none">Pendente</span>
                    </div>
                    <div className="text-xs font-bold text-amber-400 truncate transition-all duration-300 select-none">
                      {formatCurrency(stats.totalPending)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (startDate || endDate) ? (
          <p className="text-[10px] text-white text-center italic mt-2 select-none">
            Selecione ambas as datas para ver o resumo.
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default PeriodFilter;
