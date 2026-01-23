import React, { useState, useEffect } from 'react';
import { Users, Plus, Mail, X, Trash2, Loader2, Check, UserPlus } from 'lucide-react';
import { bandService } from '../services/bandService';
import { Band, BandMember, BandInvite } from '../types';
import { useToast } from './Toast';

interface BandManagerProps {
  onBandSelect: (bandId: string | null) => void;
  selectedBandId: string | null;
}

const BandManager: React.FC<BandManagerProps> = ({ onBandSelect, selectedBandId }) => {
  const [bands, setBands] = useState<Band[]>([]);
  const [members, setMembers] = useState<BandMember[]>([]);
  const [invites, setInvites] = useState<BandInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newBandName, setNewBandName] = useState('');
  const [newBandDescription, setNewBandDescription] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedBand, setSelectedBand] = useState<Band | null>(null);
  const toast = useToast();

  useEffect(() => {
    loadBands();
  }, []);

  useEffect(() => {
    if (selectedBand) {
      loadBandDetails(selectedBand.id);
    }
  }, [selectedBand]);

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

  const loadBandDetails = async (bandId: string) => {
    try {
      const [membersData, invitesData] = await Promise.all([
        bandService.fetchBandMembers(bandId),
        bandService.fetchBandInvites(bandId)
      ]);
      setMembers(membersData);
      setInvites(invitesData);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao carregar detalhes da banda');
    }
  };

  const handleCreateBand = async () => {
    if (!newBandName.trim()) {
      toast.error('Nome da banda é obrigatório');
      return;
    }

    try {
      setLoading(true);
      const band = await bandService.createBand(newBandName.trim(), newBandDescription.trim() || undefined);
      setBands([band, ...bands]);
      setShowCreateModal(false);
      setNewBandName('');
      setNewBandDescription('');
      toast.success('Banda criada com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar banda');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim() || !selectedBand) {
      toast.error('Email é obrigatório');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail.trim())) {
      toast.error('Email inválido');
      return;
    }

    try {
      setLoading(true);
      await bandService.inviteUser(selectedBand.id, inviteEmail.trim());
      await loadBandDetails(selectedBand.id);
      setShowInviteModal(false);
      setInviteEmail('');
      toast.success('Convite enviado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar convite');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedBand) return;
    if (!confirm('Tem certeza que deseja remover este membro?')) return;

    try {
      setLoading(true);
      await bandService.removeMember(selectedBand.id, userId);
      await loadBandDetails(selectedBand.id);
      toast.success('Membro removido com sucesso');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao remover membro');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBand = async () => {
    if (!selectedBand) return;
    if (!confirm('Tem certeza que deseja deletar esta banda? Todos os shows serão mantidos como pessoais.')) return;

    try {
      setLoading(true);
      await bandService.deleteBand(selectedBand.id);
      setBands(bands.filter(b => b.id !== selectedBand.id));
      setSelectedBand(null);
      onBandSelect(null);
      toast.success('Banda deletada com sucesso');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao deletar banda');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] flex items-center gap-2">
          <Users size={14} className="text-white" /> Minhas Bandas
        </h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="p-1.5 hover:bg-[#1E1F25] rounded-lg text-white transition-colors"
          title="Criar nova banda"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Seletor de contexto */}
      <div className="bg-[#1E1F25] border border-[#31333B] rounded-xl p-3 space-y-2">
        <button
          onClick={() => {
            onBandSelect(null);
            setSelectedBand(null);
          }}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
            selectedBandId === null
              ? 'bg-[#3057F2] text-white'
              : 'bg-[#24272D] text-white hover:bg-[#31333B]'
          }`}
        >
          Minha Agenda Pessoal
        </button>
        {bands.map(band => (
          <button
            key={band.id}
            onClick={() => {
              onBandSelect(band.id);
              setSelectedBand(band);
            }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
              selectedBandId === band.id
                ? 'bg-[#3057F2] text-white'
                : 'bg-[#24272D] text-white hover:bg-[#31333B]'
            }`}
          >
            {band.name}
          </button>
        ))}
      </div>

      {/* Detalhes da banda selecionada */}
      {selectedBand && (
        <div className="bg-[#1E1F25] border border-[#31333B] rounded-xl p-4 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm font-bold text-white">{selectedBand.name}</h4>
              {selectedBand.description && (
                <p className="text-xs text-white/70 mt-1">{selectedBand.description}</p>
              )}
            </div>
            <button
              onClick={handleDeleteBand}
              className="p-1.5 hover:bg-red-600/20 text-red-400 rounded-lg transition-colors"
              title="Deletar banda"
            >
              <Trash2 size={14} />
            </button>
          </div>

          {/* Membros */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white uppercase">Membros</span>
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-1 px-2 py-1 bg-[#3057F2] hover:bg-[#2545D9] text-white text-xs rounded-lg transition-colors"
              >
                <UserPlus size={12} /> Convidar
              </button>
            </div>
            <div className="space-y-1">
              {members.map(member => (
                <div key={member.id} className="flex items-center justify-between p-2 bg-[#24272D] rounded-lg">
                  <div className="flex items-center gap-2">
                    {member.profile?.avatar_url ? (
                      <img src={member.profile.avatar_url} alt="" className="w-6 h-6 rounded-full" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[#3057F2] flex items-center justify-center text-white text-xs font-bold">
                        {member.profile?.full_name?.[0] || '?'}
                      </div>
                    )}
                    <span className="text-xs text-white">
                      {member.profile?.full_name || member.profile?.email || 'Usuário'}
                    </span>
                    <span className="text-[10px] text-white/50 uppercase">{member.role}</span>
                  </div>
                  {member.role !== 'owner' && (
                    <button
                      onClick={() => handleRemoveMember(member.user_id)}
                      className="p-1 hover:bg-red-600/20 text-red-400 rounded transition-colors"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Convites pendentes */}
          {invites.length > 0 && (
            <div>
              <span className="text-xs font-bold text-white uppercase">Convites Pendentes</span>
              <div className="mt-2 space-y-1">
                {invites.map(invite => (
                  <div key={invite.id} className="flex items-center justify-between p-2 bg-[#24272D] rounded-lg">
                    <span className="text-xs text-white/70">{invite.email}</span>
                    <span className="text-[10px] text-white/50">Pendente</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Criar Banda */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-[#24272D] border border-[#31333B] rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4">Criar Nova Banda</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-white uppercase mb-1 block">Nome da Banda</label>
                <input
                  type="text"
                  value={newBandName}
                  onChange={(e) => setNewBandName(e.target.value)}
                  placeholder="Ex: Banda XYZ"
                  className="w-full bg-[#1E1F25] border border-[#31333B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3057F2] transition-colors"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-bold text-white uppercase mb-1 block">Descrição (Opcional)</label>
                <textarea
                  value={newBandDescription}
                  onChange={(e) => setNewBandDescription(e.target.value)}
                  placeholder="Descrição da banda..."
                  rows={3}
                  className="w-full bg-[#1E1F25] border border-[#31333B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3057F2] transition-colors resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-[#1E1F25] hover:bg-[#31333B] text-white rounded-xl font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateBand}
                  disabled={loading || !newBandName.trim()}
                  className="flex-1 px-4 py-2 bg-[#3057F2] hover:bg-[#2545D9] text-white rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Criar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Convidar */}
      {showInviteModal && selectedBand && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowInviteModal(false)} />
          <div className="relative bg-[#24272D] border border-[#31333B] rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4">Convidar para {selectedBand.name}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-white uppercase mb-1 block">Email do Google</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="usuario@gmail.com"
                  className="w-full bg-[#1E1F25] border border-[#31333B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3057F2] transition-colors"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 bg-[#1E1F25] hover:bg-[#31333B] text-white rounded-xl font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleInviteUser}
                  disabled={loading || !inviteEmail.trim()}
                  className="flex-1 px-4 py-2 bg-[#3057F2] hover:bg-[#2545D9] text-white rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                  Enviar Convite
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BandManager;
