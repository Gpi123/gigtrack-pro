import React, { useState } from 'react';
import { User, Users, Loader2 } from 'lucide-react';
import { useToast } from './Toast';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (choice: 'personal' | 'band', bandName?: string) => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [showBandNameInput, setShowBandNameInput] = useState(false);
  const [bandName, setBandName] = useState('');
  const toast = useToast();

  if (!isOpen) return null;

  const handleChoice = async (choice: 'personal' | 'band') => {
    if (choice === 'band' && !showBandNameInput) {
      // Se escolheu banda, mostrar input para nome
      setShowBandNameInput(true);
      return;
    }

    if (choice === 'band' && !bandName.trim()) {
      toast.error('Por favor, informe o nome da banda');
      return;
    }

    setLoading(true);
    try {
      await onComplete(choice, choice === 'band' ? bandName.trim() : undefined);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao processar escolha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/80 backdrop-blur-md select-none">
      <div className="bg-[#24272D] border border-[#31333B] rounded-2xl p-8 max-w-2xl w-full mx-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2 select-none">Bem-vindo ao GigTrack Pro!</h2>
          <p className="text-white/70 text-sm select-none">
            Escolha como você quer começar a organizar seus shows
          </p>
        </div>

        {!showBandNameInput ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Opção: Agenda Pessoal */}
            <button
              onClick={() => handleChoice('personal')}
              disabled={loading}
              className="group relative bg-[#1E1F25] border-2 border-[#31333B] hover:border-[#3057F2] rounded-xl p-6 text-left transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-[#3057F2]/20 rounded-full group-hover:bg-[#3057F2]/30 transition-colors">
                  <User size={48} className="text-[#3057F2]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2 select-none">Agenda Pessoal</h3>
                  <p className="text-sm text-white/70 select-none">
                    Organize seus shows pessoais de forma individual. Ideal para músicos solo ou quando você quer manter seus eventos privados.
                  </p>
                </div>
              </div>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#1E1F25]/80 rounded-xl">
                  <Loader2 size={24} className="animate-spin text-[#3057F2]" />
                </div>
              )}
            </button>

            {/* Opção: Criar Banda */}
            <button
              onClick={() => handleChoice('band')}
              disabled={loading}
              className="group relative bg-[#1E1F25] border-2 border-[#31333B] hover:border-[#3057F2] rounded-xl p-6 text-left transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-[#3057F2]/20 rounded-full group-hover:bg-[#3057F2]/30 transition-colors">
                  <Users size={48} className="text-[#3057F2]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2 select-none">Criar uma Banda</h3>
                  <p className="text-sm text-white/70 select-none">
                    Crie uma organização colaborativa onde você e sua equipe podem gerenciar shows juntos. Todos podem adicionar e editar eventos.
                  </p>
                </div>
              </div>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#1E1F25]/80 rounded-xl">
                  <Loader2 size={24} className="animate-spin text-[#3057F2]" />
                </div>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            <div>
              <label className="text-sm font-bold text-white uppercase mb-2 block select-none">
                Nome da Banda
              </label>
              <input
                type="text"
                value={bandName}
                onChange={(e) => setBandName(e.target.value)}
                placeholder="Ex: Banda XYZ, Orquestra ABC..."
                className="w-full bg-[#1E1F25] border border-[#31333B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3057F2] transition-colors"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && bandName.trim()) {
                    handleChoice('band');
                  }
                }}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowBandNameInput(false);
                  setBandName('');
                }}
                className="flex-1 px-4 py-2 bg-[#1E1F25] hover:bg-[#31333B] text-white rounded-xl font-semibold transition-colors select-none"
              >
                Voltar
              </button>
              <button
                onClick={() => handleChoice('band')}
                disabled={loading || !bandName.trim()}
                className="flex-1 px-4 py-2 bg-[#3057F2] hover:bg-[#2545D9] text-white rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 select-none"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Banda'
                )}
              </button>
            </div>
          </div>
        )}

        <p className="text-xs text-white/50 text-center select-none">
          💡 Você pode criar uma agenda pessoal depois, mesmo se escolher criar uma banda agora.
        </p>
      </div>
    </div>
  );
};

export default OnboardingModal;
