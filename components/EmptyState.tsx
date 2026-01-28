import React from 'react';
import { Calendar, Music, Plus } from 'lucide-react';

interface EmptyStateProps {
  onAddClick: () => void;
  message?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onAddClick, message }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center select-none">
      <div className="bg-[#24272D] border border-[#31333B] rounded-3xl p-8 mb-6 max-w-md">
        <div className="bg-[#3057F2]/10 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
          <Calendar className="w-12 h-12 text-[#3057F2]" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2 select-none">
          {message || 'Nenhum show cadastrado ainda'}
        </h3>
        <p className="text-white/60 text-sm mb-6 select-none">
          Comece organizando seus shows e eventos. Adicione seu primeiro compromisso!
        </p>
        <button
          onClick={onAddClick}
          className="w-full px-6 py-3 bg-[#3057F2] hover:bg-[#2545D9] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#3057F2]/20 select-none"
        >
          <Plus size={20} />
          Criar Primeiro Show
        </button>
      </div>
      <div className="flex flex-wrap gap-4 justify-center text-sm text-white/40 select-none">
        <div className="flex items-center gap-2">
          <Music size={16} />
          <span>Organize seus eventos</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={16} />
          <span>Controle financeiro</span>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;
