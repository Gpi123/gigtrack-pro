
import React from 'react';
import { X } from 'lucide-react';
import BandManager from './BandManager';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBandId: string | null;
  onBandSelect: (bandId: string | null) => void;
}

const SideMenu: React.FC<SideMenuProps> = ({
  isOpen, onClose,
  selectedBandId, onBandSelect
}) => {

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-[340px] bg-[#24272D] border-r border-[#31333B] h-full flex flex-col animate-in slide-in-from-left duration-300 shadow-2xl">
        <div className="p-6 border-b border-[#31333B] bg-[#1E1F25]">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Painel Pro</h2>
              <p className="text-[10px] text-white uppercase tracking-widest font-bold">Menu de Ferramentas</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-[#1E1F25] rounded-full text-white transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-10">
          {/* Band Manager Section */}
          <section className="space-y-4">
            <BandManager 
              onBandSelect={onBandSelect}
              selectedBandId={selectedBandId}
            />
          </section>
        </div>

        <div className="p-8 border-t border-[#31333B] text-center bg-[#1E1F25]">
          <p className="text-[10px] font-black text-white uppercase tracking-[0.4em]">GIGTRACK PRO v3.0</p>
        </div>
      </div>
    </div>
  );
};

export default SideMenu;
