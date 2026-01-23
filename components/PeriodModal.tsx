import React, { useState } from 'react';
import { X, Calendar as CalendarIcon } from 'lucide-react';

interface PeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (startDate: string, endDate: string) => void;
  currentStartDate?: string;
  currentEndDate?: string;
}

const PeriodModal: React.FC<PeriodModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentStartDate = '',
  currentEndDate = ''
}) => {
  const [startDate, setStartDate] = useState(currentStartDate);
  const [endDate, setEndDate] = useState(currentEndDate);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (startDate && endDate) {
      if (startDate > endDate) {
        alert('A data de início deve ser anterior à data de fim.');
        return;
      }
      onConfirm(startDate, endDate);
      onClose();
    } else {
      alert('Por favor, selecione ambas as datas.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#24272D] border border-[#31333B] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-[#31333B] flex justify-between items-center bg-[#24272D]">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarIcon size={20} />
            Período Personalizado
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-[#1E1F25] rounded-full text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-white uppercase flex items-center gap-1">
                <CalendarIcon size={12} /> Data Início
              </label>
              <input 
                required
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#1E1F25] border border-[#31333B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3057F2] transition-colors text-sm"
                style={{
                  colorScheme: 'dark',
                  WebkitAppearance: 'none',
                  appearance: 'none',
                  fontSize: '16px' // Prevents zoom on iOS
                }}
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-white uppercase flex items-center gap-1">
                <CalendarIcon size={12} /> Data Fim
              </label>
              <input 
                required
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-[#1E1F25] border border-[#31333B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3057F2] transition-colors text-sm"
                style={{
                  colorScheme: 'dark',
                  WebkitAppearance: 'none',
                  appearance: 'none',
                  fontSize: '16px' // Prevents zoom on iOS
                }}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-[#31333B] text-white font-semibold hover:bg-[#1E1F25] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 rounded-xl bg-[#3057F2] text-white font-bold hover:bg-[#2545D9] shadow-lg shadow-[#3057F2]/20 transition-all active:scale-95"
            >
              Filtrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PeriodModal;
