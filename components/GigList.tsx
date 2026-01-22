
import React from 'react';
import { Calendar, MapPin, Music, Edit2, Trash2, CheckCircle2, Circle, Square, CheckSquare } from 'lucide-react';
import { Gig, GigStatus } from '../types';

interface GigListProps {
  gigs: Gig[];
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (gig: Gig) => void;
  selectedGigIds: Set<string>;
  onToggleSelect: (id: string) => void;
  showValues: boolean;
}

const GigList: React.FC<GigListProps> = ({ gigs, onToggleStatus, onDelete, onEdit, selectedGigIds, onToggleSelect, showValues }) => {
  const formatCurrency = (val?: number) => {
    if (val === undefined || val === 0) return null;
    if (!showValues) return 'R$ ••••';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const getSafeDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  return (
    <div className="space-y-3">
      {gigs.map((gig) => {
        const dateObj = getSafeDate(gig.date);
        const displayValue = formatCurrency(gig.value);
        const isSelected = selectedGigIds.has(gig.id);
        
        return (
          <div 
            key={gig.id} 
            className={`group bg-[#24272D] border transition-all hover:bg-[#1E1F25] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              isSelected ? 'border-[#3057F2] bg-[#1E1F25]' : 
              gig.status === GigStatus.PAID ? 'border-emerald-500/20 opacity-90' : 'border-[#31333B]'
            }`}
          >
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <button 
                onClick={() => onToggleSelect(gig.id)}
                className={`flex-shrink-0 transition-colors ${isSelected ? 'text-slate-300' : 'text-slate-600 hover:text-slate-400'}`}
              >
                {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
              </button>

              <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl flex-shrink-0 ${gig.status === GigStatus.PAID ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[#1E1F25] text-white'}`}>
                <span className="text-[10px] uppercase font-bold">
                  {dateObj.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                </span>
                <span className="text-xl font-bold leading-none">{dateObj.getDate()}</span>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold text-lg truncate ${gig.status === GigStatus.PAID ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                  {gig.title}
                </h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-white">
                  <span className="flex items-center gap-1">
                    <Music size={14} className="text-white" />
                    {gig.band_name || 'Freelance'}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={14} className="text-white" />
                    {gig.location || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
              <div className="text-right">
                <div className={`text-lg font-bold transition-all duration-300 ${displayValue ? 'text-slate-100' : 'text-slate-500 italic text-sm'}`}>
                  {displayValue || 'A definir'}
                </div>
                <div className={`text-[10px] font-bold uppercase tracking-widest ${gig.status === GigStatus.PAID ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {gig.status === GigStatus.PAID ? 'PAGO' : 'PENDENTE'}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button 
                  onClick={() => onToggleStatus(gig.id)}
                  title={gig.status === GigStatus.PAID ? 'Marcar como pendente' : 'Marcar como pago'}
                  className={`p-2 rounded-lg transition-colors ${gig.status === GigStatus.PAID ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-500 hover:text-emerald-400 hover:bg-emerald-400/10'}`}
                >
                  {gig.status === GigStatus.PAID ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                </button>
                
                <button 
                  onClick={() => onEdit(gig)}
                  className="p-2 text-slate-500 hover:text-white hover:bg-[#24272D] rounded-lg transition-colors"
                >
                  <Edit2 size={20} />
                </button>
                
                <button 
                  onClick={() => onDelete(gig.id)}
                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default GigList;
