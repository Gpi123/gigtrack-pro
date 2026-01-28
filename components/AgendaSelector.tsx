import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, ChevronDown, Users, User, Plus, UserPlus, X, Loader2, Settings, Trash2, Pencil, AlertTriangle } from 'lucide-react';
import { bandService } from '../services/bandService';
import { Band } from '../types';
import { useToast } from './Toast';
import BandManager from './BandManager';

interface AgendaSelectorProps {
  selectedBandId: string | null;
  onBandSelect: (bandId: string | null) => void;
  isPeriodActive: boolean;
  selectedCalendarDate: string | null;
  selectedBandName?: string | null; // Nome da banda para exibição instantânea
  isSwitching?: boolean; // Indicador de transição
  onBandsCacheUpdate?: () => void; // Callback para atualizar cache no App
}

const AgendaSelector: React.FC<AgendaSelectorProps> = ({
  selectedBandId,
  onBandSelect,
  isPeriodActive,
  selectedCalendarDate,
  selectedBandName,
  isSwitching = false,
  onBandsCacheUpdate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [bands, setBands] = useState<Band[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newBandName, setNewBandName] = useState('');
  const [editBandName, setEditBandName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  useEffect(() => {
    loadBands();
  }, []);

  // Atualizar selectedBand quando bands mudar (após edição)
  useEffect(() => {
    if (selectedBandId) {
      const updatedBand = bands.find(b => b.id === selectedBandId);
      if (updatedBand) {
        // Atualizar o nome no título se a banda foi editada
        // O selectedBand será atualizado automaticamente pelo getCurrentAgendaName
      }
    }
  }, [bands, selectedBandId]);

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
    const startTime = performance.now();
    console.log(`🔍 [PERF] AgendaSelector.loadBands INICIADO`, {
      timestamp: new Date().toISOString()
    });

    try {
      const setLoadingStart = performance.now();
      setLoading(true);
      console.log(`⚡ [PERF] AgendaSelector.setLoading(true) - ${(performance.now() - setLoadingStart).toFixed(2)}ms`);

      const fetchStart = performance.now();
      const userBands = await bandService.fetchUserBands();
      const fetchTime = performance.now() - fetchStart;
      
      console.log(`📦 [PERF] AgendaSelector.fetchUserBands - ${fetchTime.toFixed(2)}ms`, {
        count: userBands.length
      });

      const setBandsStart = performance.now();
      setBands(userBands);
      console.log(`💾 [PERF] AgendaSelector.setBands() - ${(performance.now() - setBandsStart).toFixed(2)}ms`);
      
      // Verificar se a banda selecionada ainda existe
      if (selectedBandId) {
        const checkStart = performance.now();
        const updatedBand = userBands.find(b => b.id === selectedBandId);
        const checkTime = performance.now() - checkStart;
        console.log(`🔍 [PERF] AgendaSelector.verificar banda selecionada - ${checkTime.toFixed(2)}ms`);

        if (!updatedBand) {
          // Banda foi deletada, redirecionar para agenda pessoal
          console.log(`⚠️ [PERF] Banda selecionada não encontrada, redirecionando`);
          onBandSelect(null);
          toast.info('A banda foi excluída. Você foi redirecionado para sua agenda pessoal.');
        }
      }

      const totalTime = performance.now() - startTime;
      console.log(`✅ [PERF] AgendaSelector.loadBands CONCLUÍDO - Total: ${totalTime.toFixed(2)}ms`, {
        breakdown: {
          fetch: `${fetchTime.toFixed(2)}ms`,
          setBands: `${(performance.now() - setBandsStart).toFixed(2)}ms`,
          total: `${totalTime.toFixed(2)}ms`
        },
        bandsCount: userBands.length
      });
    } catch (error: any) {
      const totalTime = performance.now() - startTime;
      console.error(`❌ [PERF] AgendaSelector.loadBands ERRO - Total: ${totalTime.toFixed(2)}ms`, error);
      toast.error(error.message || 'Erro ao carregar bandas');
    } finally {
      const setLoadingStart = performance.now();
      setLoading(false);
      console.log(`⚡ [PERF] AgendaSelector.setLoading(false) - ${(performance.now() - setLoadingStart).toFixed(2)}ms`);
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
      // Atualizar cache no App
      if (onBandsCacheUpdate) {
        onBandsCacheUpdate();
      }
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
      // Priorizar o nome passado como prop (cache) para exibição instantânea
      if (selectedBandName) {
        return selectedBandName;
      }
      // Fallback para buscar no array local
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
          className="flex items-center gap-3 text-2xl font-bold text-white hover:opacity-80 transition-opacity relative"
        >
          <LayoutDashboard size={24} className="text-white flex-shrink-0" />
          <span className="whitespace-nowrap">{getCurrentAgendaName()}</span>
          {isSwitching && (
            <Loader2 size={16} className="text-[#3057F2] animate-spin ml-2" />
          )}
          <ChevronDown 
            size={20} 
            className={`text-white/60 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Botão de Ajustes - aparece apenas quando uma banda está selecionada */}
        {selectedBandId && selectedBand && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3057F2] hover:bg-[#2545D9] text-white text-sm font-semibold rounded-lg transition-colors"
            title="Ajustes da banda"
          >
            <Settings size={16} />
            <span>Ajustes</span>
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

      {/* Modal de Ajustes da Banda */}
      {showInviteModal && selectedBand && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="bg-[#24272D] border border-[#31333B] rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Ajustes da Banda</h2>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setShowEditModal(false);
                  setShowDeleteConfirm(false);
                  setEditBandName('');
                }}
                className="p-2 hover:bg-[#1E1F25] rounded-lg transition-colors"
              >
                <X size={20} className="text-white/60" />
              </button>
            </div>

            {/* Confirmação de Exclusão - dentro do modal */}
            {showDeleteConfirm ? (
              <div className="space-y-6">
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <AlertTriangle size={24} className="text-red-500 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Excluir Banda</h3>
                    <p className="text-sm text-white/70">
                      Tem certeza que deseja excluir a banda "{selectedBand.name}"? Todos os shows serão mantidos como pessoais e os membros convidados serão redirecionados para suas agendas pessoais. Esta ação não pode ser desfeita.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-[#31333B] text-white font-semibold hover:bg-[#1E1F25] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        setLoading(true);
                        await bandService.deleteBand(selectedBand.id);
                        await loadBands();
                        // Atualizar cache no App
                        if (onBandsCacheUpdate) {
                          onBandsCacheUpdate();
                        }
                        onBandSelect(null); // Redirecionar para agenda pessoal
                        setShowInviteModal(false);
                        setShowDeleteConfirm(false);
                        toast.success('Banda excluída com sucesso');
                      } catch (error: any) {
                        toast.error(error.message || 'Erro ao excluir banda');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    className="flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all active:scale-95 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 disabled:opacity-50"
                  >
                    {loading ? 'Excluindo...' : 'Sim, Excluir'}
                  </button>
                </div>
              </div>
            ) : (
              <>

            {/* Seção de Editar Nome */}
            <div className="mb-6 p-4 bg-[#1E1F25] border border-[#31333B] rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white">Nome da Banda</h3>
                {!showEditModal && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={loading}
                    className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 hover:text-red-300 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    Excluir Banda
                  </button>
                )}
              </div>
              
              {showEditModal ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editBandName}
                    onChange={(e) => setEditBandName(e.target.value)}
                    className="w-full px-4 py-2 bg-[#24272D] border border-[#31333B] rounded-lg text-white focus:outline-none focus:border-[#3057F2] transition-colors"
                    placeholder="Nome da banda"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        if (!editBandName.trim()) {
                          toast.error('Nome da banda é obrigatório');
                          return;
                        }
                        try {
                          setLoading(true);
                          await bandService.updateBand(selectedBand.id, { name: editBandName.trim() });
                          await loadBands(); // Recarregar lista para atualizar o nome no dropdown
                          // Atualizar cache no App
                          if (onBandsCacheUpdate) {
                            onBandsCacheUpdate();
                          }
                          setShowEditModal(false);
                          toast.success('Nome da banda atualizado!');
                        } catch (error: any) {
                          toast.error(error.message || 'Erro ao atualizar nome');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading || !editBandName.trim()}
                      className="px-4 py-2 bg-[#3057F2] hover:bg-[#2545D9] text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button
                      onClick={() => {
                        setShowEditModal(false);
                        setEditBandName('');
                      }}
                      className="px-4 py-2 bg-[#24272D] hover:bg-[#31333B] text-white rounded-lg font-semibold text-sm transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-white font-semibold flex-1">
                    {bands.find(b => b.id === selectedBand.id)?.name || selectedBand.name}
                  </p>
                  <button
                    onClick={() => {
                      setEditBandName(selectedBand.name);
                      setShowEditModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-[#24272D] rounded-lg transition-colors"
                    title="Editar nome da banda"
                  >
                    <Pencil size={16} className="text-white/60 hover:text-[#3057F2] transition-colors" />
                    <span className="text-sm text-white/60 hover:text-[#3057F2] transition-colors">Alterar nome</span>
                  </button>
                </div>
              )}
            </div>

            {/* Seção de Convidar Membros */}
            <div className="mb-4">
              <h3 className="text-sm font-bold text-white mb-4">Membros e Convites</h3>
              <BandManager
                key={selectedBand.id} // Forçar re-render quando a banda mudar
                onBandSelect={onBandSelect}
                selectedBandId={selectedBandId}
                hideBandSelector={true}
              />
            </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AgendaSelector;
