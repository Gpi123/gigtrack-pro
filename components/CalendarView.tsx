
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Music, DollarSign, MapPin } from 'lucide-react';
import { Gig, GigStatus } from '../types';

interface CalendarViewProps {
  gigs: Gig[];
  selectedDate: string | null;
  onDateSelect: (date: string | null) => void;
  onDateClick: (date: string) => void;
  showValues: boolean;
}

const CalendarView: React.FC<CalendarViewProps> = ({ gigs, selectedDate, onDateSelect, onDateClick, showValues }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long' });

  const days = [];
  const totalDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  const formatDateStr = (d: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  const getGigsForDay = (d: number | string) => {
    const dateStr = typeof d === 'number' ? formatDateStr(d) : d;
    return gigs.filter(g => g.date === dateStr);
  };

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === 0) return 'A definir';
    if (!showValues) return 'R$ ••••';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

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
            // Se não há shows neste dia, abrir modal de novo show
            onDateClick(dateStr);
          } else {
            // Se há shows, apenas selecionar/filtrar
            onDateSelect(isSelected ? null : dateStr);
          }
        }}
        className={`relative h-10 w-10 sm:h-12 sm:w-12 flex flex-col items-center justify-center rounded-xl transition-all hover:bg-slate-800 ${
          isSelected ? 'bg-slate-700 text-white ring-2 ring-slate-500 ring-offset-2 ring-offset-slate-900 shadow-lg' : 
          isToday ? 'bg-slate-800 text-slate-300 font-bold border border-slate-600' : 'text-slate-300'
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

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-slate-200 font-bold capitalize text-lg">{monthName} {year}</h3>
        <div className="flex gap-1.5">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-colors bg-slate-950/50">
            <ChevronLeft size={20} />
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-colors bg-slate-950/50">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(wd => (
          <div key={wd} className="text-[10px] font-bold text-slate-500 text-center uppercase py-1">
            {wd}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>

      {selectedDate && (
        <div className="mt-6 pt-6 border-t border-slate-800 animate-in slide-in-from-top-2">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs text-slate-400 font-medium">Shows em <span className="text-slate-300 font-bold">{new Date(selectedDate).toLocaleDateString('pt-BR')}</span></span>
            <button 
              onClick={() => onDateSelect(null)}
              className="text-[10px] uppercase font-bold text-rose-400 hover:text-rose-300 transition-colors"
            >
              Limpar Filtro
            </button>
          </div>

          <div className="space-y-2">
            {selectedDayGigs.length > 0 ? (
              selectedDayGigs.map(gig => (
                <div key={gig.id} className="bg-slate-950/50 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-sm text-slate-100 leading-tight">{gig.title}</h4>
                    <span className="text-xs font-black text-slate-300 whitespace-nowrap">{formatCurrency(gig.value)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1 font-semibold uppercase tracking-wider">
                      <Music size={10} className="text-slate-400" />
                      {gig.band_name || 'Freelance'}
                    </span>
                    {gig.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={10} />
                        {gig.location}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[11px] text-slate-500 italic text-center py-2">Nenhum evento registrado nesta data.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
