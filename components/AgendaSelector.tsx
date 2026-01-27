import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, ChevronDown, Users, User, Plus, UserPlus, X, Loader2 } from 'lucide-react';
import { bandService } from '../services/bandService';
import { Band } from '../types';
import { useToast } from './Toast';
import BandManager from './BandManager';

interface AgendaSelectorProps {
  selectedBandId: string | null;
  onBandSelect: (bandId: string | null) => void;
  isPeriodActive: boolean;
  selectedCalendarDate: string | null;
}

const AgendaSelector: React.FC<AgendaSelectorProps> = ({
  selectedBandId,
  onBandSelect,
  isPeriodActive,
  selectedCalendarDate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [bands, setBands] = useState<Band[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newBandName, setNewBandName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  useEffect(() => {
    loadBands();
  }, []);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const loadBands = async () => {
    try {
      setLoading(true);
      const userBands = await bandService.fetchUserBands();
      setBands(userBands);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao carregar bandas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBand = async () => {
    if (!newBandName.trim()) {
      toast.error('Nome da banda é obrigatório');
      return;
    }

    try {
      setLoading(true);
      const band = await bandService.createBand(newBandName.trim());
      await loadBands(); // Recarregar lista completa de bandas
      setShowCreateModal(false);
      setNewBandName('');
      onBandSelect(band.id);
      toast.success('Banda criada com sucesso!');
      setIsOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar banda');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentAgendaName = () => {
    if (isPeriodActive) return 'Filtro de Período';
    if (selectedCalendarDate) return 'Data Selecionada';
    if (selectedBandId) {
      const band = bands.find(b => b.id === selectedBandId);
      return band ? band.name : 'Banda';
    }
    return 'Minha Agenda';
  };

  const selectedBand = bands.find(b => b.id === selectedBandId);

  return (
    <>
      <div className="relative flex items-center gap-3" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 text-2xl font-bold text-white hover:opacity-80 transition-opacity"
        >
          <LayoutDashboard size={24} className="text-white flex-shrink-0" />
          <span className="whitespace-nowrap">{getCurrentAgendaName()}</span>
          <ChevronDown 
            size={20} 
            className={`text-white/60 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Botão de Convidar - aparece apenas quando uma banda está selecionada */}
        {selectedBandId && selectedBand && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3057F2] hover:bg-[#2545D9] text-white text-sm font-semibold rounded-lg transition-colors"
            title="Convidar para banda"
          >
            <UserPlus size={16} />
            <span>Convidar para banda</span>
          </button>
        )}

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-80 bg-[#24272D] border border-[#31333B] rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="p-4 border-b border-[#31333B]">
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Selecionar Agenda</h3>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {/* Agenda Pessoal */}
              <button
                onClick={() => {
                  onBandSelect(null);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-[#1E1F25] transition-colors ${
                  selectedBandId === null ? 'bg-[#3057F2]/10 border-l-2 border-[#3057F2]' : ''
                }`}
              >
                <User size={20} className={selectedBandId === null ? 'text-[#3057F2]' : 'text-white/60'} />
                <span className={`font-semibold ${selectedBandId === null ? 'text-[#3057F2]' : 'text-white'}`}>
                  Agenda Pessoal
                </span>
                {selectedBandId === null && (
                  <div className="ml-auto w-2 h-2 bg-[#3057F2] rounded-full" />
                )}
              </button>

              {/* Bandas */}
              {bands.length > 0 && (
                <div className="border-t border-[#31333B]">
                  <div className="px-4 py-2">
                    <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Bandas</h4>
                  </div>
                  {bands.map((band) => (
                    <button
                      key={band.id}
                      onClick={() => {
                        onBandSelect(band.id);
                        setIsOpen(false);
                      }}
                      className={`w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-[#1E1F25] transition-colors ${
                        selectedBandId === band.id ? 'bg-[#3057F2]/10 border-l-2 border-[#3057F2]' : ''
                      }`}
                    >
                      <Users size={20} className={selectedBandId === band.id ? 'text-[#3057F2]' : 'text-white/60'} />
                      <span className={`font-semibold flex-1 ${selectedBandId === band.id ? 'text-[#3057F2]' : 'text-white'}`}>
                        {band.name}
                      </span>
                      {selectedBandId === band.id && (
                        <div className="w-2 h-2 bg-[#3057F2] rounded-full" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Ações */}
              <div className="border-t border-[#31333B] p-2 space-y-1">
                <button
                  onClick={() => {
                    setShowCreateModal(true);
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-[#1E1F25] rounded-lg transition-colors text-white"
                >
                  <Plus size={18} className="text-[#3057F2]" />
                  <span className="font-medium">Criar Banda</span>
                </button>

                {selectedBand && (
                  <button
                    onClick={() => {
                      setShowInviteModal(true);
                      setIsOpen(false);
                    }}
                    className="w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-[#1E1F25] rounded-lg transition-colors text-white"
                  >
                    <UserPlus size={18} className="text-[#3057F2]" />
                    <span className="font-medium">Convidar Usuários</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Criar Banda */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="bg-[#24272D] border border-[#31333B] rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Criar Nova Banda</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewBandName('');
                }}
                className="p-2 hover:bg-[#1E1F25] rounded-lg transition-colors"
              >
                <X size={20} className="text-white/60" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Nome da Banda *
                </label>
                <input
                  type="text"
                  value={newBandName}
                  onChange={(e) => setNewBandName(e.target.value)}
                  placeholder="Ex: Minha Banda"
                  className="w-full px-4 py-2.5 bg-[#1E1F25] border border-[#31333B] rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#3057F2] transition-colors"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateBand();
                    }
                  }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewBandName('');
                  }}
                  className="flex-1 px-4 py-2.5 bg-[#1E1F25] border border-[#31333B] text-white rounded-xl font-semibold hover:bg-[#31333B] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateBand}
                  disabled={loading || !newBandName.trim()}
                  className="flex-1 px-4 py-2.5 bg-[#3057F2] hover:bg-[#2545D9] text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Convidar Usuários (usando BandManager) */}
      {showInviteModal && selectedBand && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="bg-[#24272D] border border-[#31333B] rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Gerenciar Banda: {selectedBand.name}</h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-2 hover:bg-[#1E1F25] rounded-lg transition-colors"
              >
                <X size={20} className="text-white/60" />
              </button>
            </div>

            <BandManager
              key={selectedBand.id} // Forçar re-render quando a banda mudar
              onBandSelect={onBandSelect}
              selectedBandId={selectedBandId}
              hideBandSelector={true}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default AgendaSelector;
