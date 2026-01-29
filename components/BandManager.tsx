import React, { useState, useEffect, useRef } from 'react';
import { Users, Plus, X, Trash2, Loader2, Check, UserPlus, Copy, CheckCircle, QrCode } from 'lucide-react';
import QRCode from 'react-qr-code';
import { bandService } from '../services/bandService';
import { Band, BandMember, BandInvite } from '../types';
import { useToast } from './Toast';
import { getCachedUser } from '../services/authCache';

interface BandManagerProps {
  onBandSelect: (bandId: string | null) => void;
  selectedBandId: string | null;
  hideBandSelector?: boolean;
  /** Quando no modal Ajustes: banda já conhecida; mostra seção Membros desde o início com loading dentro */
  bandFromParent?: Band | null;
}

const ROLES: { value: 'admin' | 'member'; label: string }[] = [
  { value: 'admin', label: 'Editor' },
  { value: 'member', label: 'Membro' }
];

const BandManager: React.FC<BandManagerProps> = ({ onBandSelect, selectedBandId, hideBandSelector = false, bandFromParent = null }) => {
  const [bands, setBands] = useState<Band[]>([]);
  const [members, setMembers] = useState<BandMember[]>([]);
  const [invites, setInvites] = useState<BandInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [updatingRoleFor, setUpdatingRoleFor] = useState<string | null>(null);
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
    // Carregar ID do usuário atual
    getCachedUser().then(user => {
      if (user) {
        setCurrentUserId(user.id);
      }
    });
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

  // No modal Ajustes: usar banda do parent para exibir e carregar desde o início
  useEffect(() => {
    if (hideBandSelector && bandFromParent && selectedBandId === bandFromParent.id && !selectedBand) {
      setSelectedBand(bandFromParent);
    }
  }, [hideBandSelector, bandFromParent, selectedBandId, selectedBand]);

  const displayBand = (hideBandSelector && bandFromParent) ? bandFromParent : selectedBand;
  const bandIdToLoad = displayBand?.id ?? selectedBand?.id;

  useEffect(() => {
    if (bandIdToLoad) {
      const timeoutId = setTimeout(() => {
        loadBandDetails(bandIdToLoad);
      }, hideBandSelector && bandFromParent ? 0 : 100);
      return () => clearTimeout(timeoutId);
    } else {
      setMembers([]);
      setInvites([]);
    }
  }, [bandIdToLoad, hideBandSelector, bandFromParent?.id]);

  const loadBands = async () => {
    // Se já temos bandas e estamos no modal, não recarregar
    if (hideBandSelector && bands.length > 0) {
      return;
    }

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
    const startTime = performance.now();
    console.log(`🔍 [PERF] BandManager.loadBandDetails INICIADO`, {
      bandId,
      timestamp: new Date().toISOString()
    });

    try {
      setLoadingDetails(true);
      const fetchStart = performance.now();
      const [membersData, invitesData] = await Promise.all([
        bandService.fetchBandMembers(bandId),
        bandService.fetchBandInvites(bandId)
      ]);
      const fetchTime = performance.now() - fetchStart;
      
      console.log(`📊 [PERF] BandManager.loadBandDetails - Fetch - ${fetchTime.toFixed(2)}ms`, {
        membersCount: membersData.length,
        invitesCount: invitesData.length
      });

      const setStateStart = performance.now();
      setMembers(membersData);
      setInvites(invitesData);
      const setStateTime = performance.now() - setStateStart;
      
      const totalTime = performance.now() - startTime;
      console.log(`✅ [PERF] BandManager.loadBandDetails CONCLUÍDO - Total: ${totalTime.toFixed(2)}ms`, {
        breakdown: {
          fetch: `${fetchTime.toFixed(2)}ms`,
          setState: `${setStateTime.toFixed(2)}ms`,
          total: `${totalTime.toFixed(2)}ms`
        }
      });
    } catch (error: any) {
      toast.error(error.message || 'Erro ao carregar detalhes da banda');
    } finally {
      setLoadingDetails(false);
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

  const bandForActions = displayBand ?? selectedBand;
  const myMember = bandForActions ? members.find(m => m.user_id === currentUserId) : null;
  const canChangeRoles = !!bandForActions && (
    bandForActions.owner_id === currentUserId ||
    myMember?.role === 'owner' ||
    myMember?.role === 'admin'
  );

  const handleRoleChange = async (memberUserId: string, newRole: 'admin' | 'member') => {
    if (!bandForActions || !canChangeRoles) return;
    if (bandForActions.owner_id === memberUserId) return;
    try {
      setUpdatingRoleFor(memberUserId);
      await bandService.updateMemberRole(bandForActions.id, memberUserId, newRole);
      await loadBandDetails(bandForActions.id);
      toast.success('Permissão atualizada');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar permissão');
    } finally {
      setUpdatingRoleFor(null);
    }
  };

  const handleInviteUser = async () => {
    if (!bandForActions) return;

    try {
      setLoading(true);
      // Criar convite sem email específico (email genérico para permitir qualquer usuário)
      const invite = await bandService.inviteUser(bandForActions.id, '');
      await loadBandDetails(bandForActions.id);
      
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
    if (!bandForActions) return;
    if (!confirm('Tem certeza que deseja remover este membro?')) return;

    try {
      setLoading(true);
      await bandService.removeMember(bandForActions.id, userId);
      await loadBandDetails(bandForActions.id);
      toast.success('Membro removido com sucesso');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao remover membro');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    if (!bandForActions) return;
    if (!confirm('Tem certeza que deseja cancelar este convite?')) return;

    try {
      setLoading(true);
      await bandService.cancelInvite(inviteId);
      await loadBandDetails(bandForActions.id);
      toast.success('Convite cancelado com sucesso');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao cancelar convite');
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
    <div className="space-y-4 select-none">
      {!hideBandSelector && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] flex items-center gap-2 select-none">
              <Users size={14} className="text-white" /> Minhas Bandas
            </h3>
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-1.5 hover:bg-[#1E1F25] rounded-lg text-white transition-colors select-none"
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
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-all select-none ${
                selectedBandId === null
                  ? 'bg-[#3057F2] text-white'
                  : 'bg-[#24272D] text-white hover:bg-[#31333B]'
              }`}
            >
              <span className="select-none">Minha Agenda Pessoal</span>
            </button>
            {bands.map(band => (
              <button
                key={band.id}
                onClick={() => {
                  onBandSelect(band.id);
                  setSelectedBand(band);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-all select-none ${
                  selectedBandId === band.id
                    ? 'bg-[#3057F2] text-white'
                    : 'bg-[#24272D] text-white hover:bg-[#31333B]'
                }`}
              >
                <span className="select-none">{band.name}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Detalhes da banda: quando no modal (bandFromParent) a seção aparece desde o início com loading dentro */}
      {displayBand && (
        <div className="bg-transparent border-0 rounded-xl p-0 space-y-4 select-none">
          {!hideBandSelector && (
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm font-bold text-white select-none">{displayBand.name}</h4>
              {displayBand.description && (
                <p className="text-xs text-white/70 mt-1 select-none">{displayBand.description}</p>
              )}
            </div>
              <button
                onClick={handleDeleteBand}
                className="p-1.5 hover:bg-red-600/20 text-red-400 rounded-lg transition-colors select-none"
                title="Deletar banda"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
          )}

          {/* Membros: loading fica aqui dentro para não “quebrar” o layout */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white uppercase select-none">Membros</span>
              <button
                onClick={handleInviteUser}
                disabled={loading}
                className="flex items-center gap-1 px-2 py-1 bg-[#3057F2] hover:bg-[#2545D9] text-white text-xs rounded-lg transition-colors disabled:opacity-50 select-none"
              >
                {loading ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />} <span className="select-none">Convidar</span>
              </button>
            </div>
            {loadingDetails && members.length === 0 ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={16} className="animate-spin text-[#3057F2]" />
              </div>
            ) : (
              <div className="space-y-1">
                {members.length === 0 && !loadingDetails ? (
                  <p className="text-xs text-white/50 text-center py-4 select-none">Nenhum membro encontrado</p>
                ) : (
                  members.map(member => {
                    // Determinar nome para exibir - priorizar full_name, depois email, depois "Usuário"
                    const displayName = member.profile?.full_name || 
                                      (member.profile?.email ? member.profile.email.split('@')[0] : null) || 
                                      'Usuário';
                    
                    // Determinar inicial para avatar
                    const initial = member.profile?.full_name?.[0]?.toUpperCase() || 
                                  member.profile?.email?.[0]?.toUpperCase() || 
                                  '?';
                    
                    return (
                      <div key={member.id} className="flex items-center justify-between p-2 bg-[#24272D] rounded-lg select-none">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {member.profile?.avatar_url ? (
                            <img 
                              src={member.profile.avatar_url} 
                              alt={displayName}
                              className="w-6 h-6 rounded-full flex-shrink-0 object-cover" 
                              onError={(e) => {
                                // Fallback para avatar com inicial se a imagem falhar
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  const fallback = document.createElement('div');
                                  fallback.className = 'w-6 h-6 rounded-full bg-[#3057F2] flex items-center justify-center text-white text-xs font-bold flex-shrink-0';
                                  fallback.textContent = initial;
                                  parent.insertBefore(fallback, target);
                                }
                              }}
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-[#3057F2] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {initial}
                            </div>
                          )}
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-xs text-white truncate select-none" title={displayName}>
                              {displayName}
                            </span>
                            {bandForActions?.owner_id === member.user_id || member.role === 'owner' ? (
                              <span className="text-[10px] text-white/50 uppercase flex-shrink-0 select-none">
                                Proprietário
                                {currentUserId === member.user_id && (
                                  <span className="text-[#3057F2] ml-1">(Você)</span>
                                )}
                              </span>
                            ) : canChangeRoles ? (
                              <select
                                value={member.role === 'admin' ? 'admin' : 'member'}
                                onChange={(e) => handleRoleChange(member.user_id, e.target.value as 'admin' | 'member')}
                                disabled={updatingRoleFor === member.user_id}
                                className="text-[10px] bg-[#1E1F25] border border-[#31333B] rounded-lg px-2 py-1 text-white/90 focus:outline-none focus:border-[#3057F2] flex-shrink-0"
                              >
                                {ROLES.map((r) => (
                                  <option key={r.value} value={r.value}>
                                    {r.label}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-[10px] text-white/50 uppercase flex-shrink-0 select-none">
                                {member.role === 'admin' ? 'Editor' : 'Membro'}
                                {currentUserId === member.user_id && (
                                  <span className="text-[#3057F2] ml-1">(Você)</span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                        {member.role !== 'owner' && bandForActions?.owner_id !== member.user_id && (
                          <button
                            onClick={() => handleRemoveMember(member.user_id)}
                            className="p-1 hover:bg-red-600/20 text-red-400 rounded transition-colors flex-shrink-0 ml-2 select-none"
                            title="Remover membro"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Convites pendentes */}
          {invites.length > 0 && (
            <div>
              <span className="text-xs font-bold text-white uppercase select-none">Convites Pendentes</span>
              <div className="mt-2 space-y-1">
                {invites.map(invite => (
                  <div key={invite.id} className="flex items-center justify-between p-2 bg-[#24272D] rounded-lg select-none">
                    <span className="text-xs text-white/70 select-none">
                      {invite.email || 'Convite genérico (qualquer usuário pode aceitar)'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-white/50 select-none">Pendente</span>
                      <button
                        onClick={() => handleCancelInvite(invite.id)}
                        className="p-1 hover:bg-red-600/20 text-red-400 rounded transition-colors flex-shrink-0 select-none"
                        title="Cancelar convite"
                        disabled={loading}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Criar Banda */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 select-none">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-[#24272D] border border-[#31333B] rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4 select-none">Criar Nova Banda</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-white uppercase mb-1 block select-none">Nome da Banda</label>
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
                <label className="text-xs font-bold text-white uppercase mb-1 block select-none">Descrição (Opcional)</label>
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
                  className="flex-1 px-4 py-2 bg-[#1E1F25] hover:bg-[#31333B] text-white rounded-xl font-semibold transition-colors select-none"
                >
                  <span className="select-none">Cancelar</span>
                </button>
                <button
                  onClick={handleCreateBand}
                  disabled={loading || !newBandName.trim()}
                  className="flex-1 px-4 py-2 bg-[#3057F2] hover:bg-[#2545D9] text-white rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 select-none"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  <span className="select-none">Criar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal com QR Code do Convite */}
      {createdInvite && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 select-none">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setCreatedInvite(null)} />
          <div className="relative bg-[#24272D] border border-[#31333B] rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-2 select-none">Convite para {createdInvite.bandName}</h3>
            <p className="text-sm text-white/70 mb-4 text-center select-none">
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
                className="w-full px-4 py-2.5 bg-[#3057F2] hover:bg-[#2545D9] text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 select-none"
              >
                {copied ? (
                  <>
                    <CheckCircle size={18} />
                    <span className="select-none">QR Code Copiado!</span>
                  </>
                ) : (
                  <>
                    <QrCode size={18} />
                    <span className="select-none">Copiar QR Code</span>
                  </>
                )}
              </button>
              <button
                onClick={copyInviteLink}
                className="w-full px-4 py-2.5 bg-[#1E1F25] hover:bg-[#31333B] text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 select-none"
              >
                <Copy size={18} />
                <span className="select-none">Copiar Link</span>
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-white/60 text-center select-none">
                💡 <strong>Dica:</strong> Escaneie o QR Code ou compartilhe o link. O usuário será redirecionado para fazer login com Google e entrará automaticamente na banda.
              </p>
              <button
                onClick={() => setCreatedInvite(null)}
                className="w-full px-4 py-2 bg-[#31333B] hover:bg-[#1E1F25] text-white rounded-xl font-semibold transition-colors select-none"
              >
                <span className="select-none">Fechar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BandManager;
