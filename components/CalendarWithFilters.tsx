import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Music, CheckCircle2, Clock } from 'lucide-react';
import { Gig, GigStatus, FinancialStats } from '../types';

interface CalendarWithFiltersProps {
  gigs: Gig[];
  selectedDate: string | null;
  startDate: string;
  endDate: string;
  onDateSelect: (date: string | null) => void;
  onDateClick: (date: string) => void;
  onQuickFilter: (type: 'week' | 'month' | 'year') => void;
  onClear: () => void;
  showValues: boolean;
  stats: FinancialStats;
  gigCount: number;
}

const CalendarWithFilters: React.FC<CalendarWithFiltersProps> = ({
  gigs,
  selectedDate,
  startDate,
  endDate,
  onDateSelect,
  onDateClick,
  onQuickFilter,
  onClear,
  showValues,
  stats,
  gigCount
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long' });

  const formatDateStr = (d: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  const getGigsForDay = (d: number | string) => {
    const dateStr = typeof d === 'number' ? formatDateStr(d) : d;
    return gigs.filter(g => g.date === dateStr);
  };

  const formatCurrency = (val: number) => {
    if (!showValues) return 'R$ ••••';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const days = [];
  const totalDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-10 w-10 sm:h-12 sm:w-12" />);
  }

  for (let d = 1; d <= totalDays; d++) {
    const dateStr = formatDateStr(d);
    const dayGigs = getGigsForDay(d);
    const isSelected = selectedDate === dateStr;
    const isToday = new Date().toLocaleDateString('en-CA') === dateStr;

    days.push(
      <button
        key={d}
        onClick={() => {
          if (dayGigs.length === 0) {
            onDateClick(dateStr);
          } else {
            onDateSelect(isSelected ? null : dateStr);
          }
        }}
        className={`relative h-10 w-10 sm:h-12 sm:w-12 flex flex-col items-center justify-center rounded-xl transition-all hover:bg-[#1E1F25] ${
          isSelected ? 'bg-[#1E1F25] text-white ring-2 ring-[#3057F2] ring-offset-2 ring-offset-[#24272D] shadow-lg' : 
          isToday ? 'bg-[#1E1F25] text-white font-bold border border-[#31333B]' : 'text-white'
        }`}
      >
        <span className="text-sm">{d}</span>
        {dayGigs.length > 0 && !isSelected && (
          <div className="absolute bottom-1.5 flex gap-0.5">
            {dayGigs.slice(0, 3).map((g, idx) => (
              <div 
                key={idx} 
                className={`w-1 h-1 rounded-full ${g.status === GigStatus.PAID ? 'bg-emerald-500' : 'bg-amber-500'}`} 
              />
            ))}
          </div>
        )}
      </button>
    );
  }

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const selectedDayGigs = selectedDate ? getGigsForDay(selectedDate) : [];
  
  // Check if we have active filters or selected date
  const isActive = (startDate && endDate) || selectedDate;
  const displayGigs = selectedDate ? selectedDayGigs : (startDate && endDate ? gigs.filter(g => {
    return g.date >= startDate && g.date <= endDate;
  }) : []);
  
  // Calculate stats for displayed gigs
  const displayStats = displayGigs.reduce((acc, gig) => {
    const val = Number(gig.value) || 0;
    if (gig.status === GigStatus.PAID) acc.totalReceived += val;
    else acc.totalPending += val;
    acc.overallTotal += val;
    return acc;
  }, { totalReceived: 0, totalPending: 0, overallTotal: 0 });

  return (
    <div className="bg-[#24272D] border border-[#31333B] rounded-3xl p-5 shadow-xl">
      {/* Calendar */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white font-bold capitalize text-lg">{monthName} {year}</h3>
        <div className="flex gap-1.5">
          <button onClick={prevMonth} className="p-2 hover:bg-[#1E1F25] rounded-xl text-white transition-colors bg-[#1E1F25]">
            <ChevronLeft size={20} />
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-[#1E1F25] rounded-xl text-white transition-colors bg-[#1E1F25]">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(wd => (
          <div key={wd} className="text-[10px] font-bold text-white text-center uppercase py-1">
            {wd}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-6">
        {days}
      </div>

      {/* Quick Filters */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <button
          onClick={() => onQuickFilter('week')}
          className="px-3 py-2 bg-[#1E1F25] hover:bg-[#24272D] text-white text-xs font-semibold rounded-xl transition-all border border-[#31333B]"
        >
          Esta Semana
        </button>
        <button
          onClick={() => onQuickFilter('month')}
          className="px-3 py-2 bg-[#1E1F25] hover:bg-[#24272D] text-white text-xs font-semibold rounded-xl transition-all border border-[#31333B]"
        >
          Mês Atual
        </button>
        <button
          onClick={() => onQuickFilter('year')}
          className="px-3 py-2 bg-[#1E1F25] hover:bg-[#24272D] text-white text-xs font-semibold rounded-xl transition-all border border-[#31333B]"
        >
          Ano Atual
        </button>
      </div>

      {/* Resultado do Período */}
      {isActive && (
        <div className="pt-6 border-t border-[#31333B] animate-in slide-in-from-top-2">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs text-white font-medium">
              {selectedDate 
                ? `Shows em ${new Date(selectedDate).toLocaleDateString('pt-BR')}`
                : 'Resultado do Período'
              }
            </span>
            <button 
              onClick={onClear}
              className="text-[10px] uppercase font-bold text-rose-400 hover:text-rose-300 transition-colors"
            >
              Limpar Filtro
            </button>
          </div>

          <div className="bg-[#1E1F25] border border-[#31333B] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#31333B] pb-2">
              <span className="text-[10px] font-bold text-white uppercase">Resultado do Período</span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#24272D] rounded-full">
                <Music size={10} className="text-white" />
                <span className="text-[10px] font-black text-white">{displayGigs.length} SHOWS</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-white uppercase">Total Bruto</span>
                <span className="text-lg font-bold text-white tracking-tight transition-all duration-300">
                  {formatCurrency(displayStats.overallTotal)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-[#24272D] rounded-lg p-2 border border-[#31333B]">
                  <div className="flex items-center gap-1 mb-1">
                    <CheckCircle2 size={10} className="text-emerald-500" />
                    <span className="text-[8px] font-bold text-white uppercase">Recebido</span>
                  </div>
                  <div className="text-xs font-bold text-emerald-400 truncate transition-all duration-300">
                    {formatCurrency(displayStats.totalReceived)}
                  </div>
                </div>
                <div className="bg-[#24272D] rounded-lg p-2 border border-[#31333B]">
                  <div className="flex items-center gap-1 mb-1">
                    <Clock size={10} className="text-amber-500" />
                    <span className="text-[8px] font-bold text-white uppercase">Pendente</span>
                  </div>
                  <div className="text-xs font-bold text-amber-400 truncate transition-all duration-300">
                    {formatCurrency(displayStats.totalPending)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarWithFilters;
