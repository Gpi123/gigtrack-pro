import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isVisible, message = 'Carregando...' }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#24272D] border border-[#31333B] rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-4 min-w-[280px] max-w-[400px] animate-in zoom-in-95 duration-200">
        <Loader2 className="w-12 h-12 text-[#3057F2] animate-spin" />
        <div className="text-center">
          <h3 className="text-lg font-bold text-white mb-1">{message}</h3>
          <p className="text-sm text-white/60">Por favor, aguarde...</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
