import React, { useState, useEffect, useRef } from 'react';
import { Users, Plus, X, Trash2, Loader2, Check, UserPlus, Copy, CheckCircle, QrCode } from 'lucide-react';
import QRCode from 'react-qr-code';
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
  const [newBandName, setNewBandName] = useState('');
  const [newBandDescription, setNewBandDescription] = useState('');
  const [selectedBand, setSelectedBand] = useState<Band | null>(null);
  const [createdInvite, setCreatedInvite] = useState<{ token: string; email: string; bandName: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  useEffect(() => {
    loadBands();
  }, []);

  // Recarregar bandas quando selectedBandId mudar e a banda não estiver na lista
  useEffect(() => {
    if (selectedBandId) {
      const band = bands.find(b => b.id === selectedBandId);
      if (!band && bands.length > 0) {
        // Se a banda não está na lista, recarregar as bandas
        loadBands();
      }
    }
  }, [selectedBandId]);
  
  // Atualizar selectedBand quando bands ou selectedBandId mudar
  useEffect(() => {
    if (selectedBandId) {
      const band = bands.find(b => b.id === selectedBandId);
      if (band) {
        setSelectedBand(band);
      } else {
        setSelectedBand(null);
      }
    } else {
      setSelectedBand(null);
    }
  }, [bands, selectedBandId]);

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
    if (!selectedBand) return;

    try {
      setLoading(true);
      // Criar convite sem email específico (email genérico para permitir qualquer usuário)
      const invite = await bandService.inviteUser(selectedBand.id, '');
      await loadBandDetails(selectedBand.id);
      
      // Mostrar modal com QR code do convite
      setCreatedInvite({
        token: invite.token,
        email: '',
        bandName: selectedBand.name
      });
      
      toast.success('Convite criado! Compartilhe o QR code.');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar convite');
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = () => {
    if (!createdInvite) return;
    const inviteUrl = `${window.location.origin}?token=${createdInvite.token}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success('Link copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const copyQRCodeImage = async () => {
    if (!qrCodeRef.current || !createdInvite) return;
    
    try {
      // Buscar o elemento SVG dentro do QR code
      const svgElement = qrCodeRef.current.querySelector('svg');
      if (!svgElement) return;

      // Converter SVG para canvas e depois para blob
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) {
              const item = new ClipboardItem({ 'image/png': blob });
              navigator.clipboard.write([item]).then(() => {
                setCopied(true);
                toast.success('QR Code copiado!');
                setTimeout(() => setCopied(false), 2000);
              }).catch(() => {
                // Fallback: copiar URL
                copyInviteLink();
              });
            }
            URL.revokeObjectURL(url);
          });
        }
      };
      
      img.src = url;
    } catch (error) {
      console.error('Erro ao copiar QR code:', error);
      // Fallback: copiar URL
      copyInviteLink();
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
                onClick={handleInviteUser}
                disabled={loading}
                className="flex items-center gap-1 px-2 py-1 bg-[#3057F2] hover:bg-[#2545D9] text-white text-xs rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />} Convidar
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

      {/* Modal com QR Code do Convite */}
      {createdInvite && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setCreatedInvite(null)} />
          <div className="relative bg-[#24272D] border border-[#31333B] rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-2">Convite para {createdInvite.bandName}</h3>
            <p className="text-sm text-white/70 mb-4 text-center">
              Compartilhe este QR Code ou link para convidar alguém
            </p>
            
            {/* QR Code */}
            <div className="bg-white p-4 rounded-xl mb-4 flex items-center justify-center" ref={qrCodeRef}>
              <QRCode
                value={`${window.location.origin}?token=${createdInvite.token}`}
                size={200}
                level="H"
                bgColor="#FFFFFF"
                fgColor="#000000"
              />
            </div>

            {/* Botões de ação */}
            <div className="space-y-2 mb-4">
              <button
                onClick={copyQRCodeImage}
                className="w-full px-4 py-2.5 bg-[#3057F2] hover:bg-[#2545D9] text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <CheckCircle size={18} />
                    QR Code Copiado!
                  </>
                ) : (
                  <>
                    <QrCode size={18} />
                    Copiar QR Code
                  </>
                )}
              </button>
              <button
                onClick={copyInviteLink}
                className="w-full px-4 py-2.5 bg-[#1E1F25] hover:bg-[#31333B] text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Copy size={18} />
                Copiar Link
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-white/60 text-center">
                💡 <strong>Dica:</strong> Escaneie o QR Code ou compartilhe o link. O usuário será redirecionado para fazer login com Google e entrará automaticamente na banda.
              </p>
              <button
                onClick={() => setCreatedInvite(null)}
                className="w-full px-4 py-2 bg-[#31333B] hover:bg-[#1E1F25] text-white rounded-xl font-semibold transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BandManager;
