
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Plus, LayoutDashboard, Calendar, DollarSign, Menu, Eye, EyeOff, Cloud, Loader2, User, Upload, Trash2, Search, Filter } from 'lucide-react';
import { Gig, GigStatus, FinancialStats, Band } from './types';
import { gigService } from './services/gigService';
import { importService } from './services/importService';
import { authService, UserProfile } from './services/authService';
import { supabase } from './services/supabase';
import { bandService } from './services/bandService';
import { User as SupabaseUser } from '@supabase/supabase-js';
import GigModal from './components/GigModal';
import AuthModal from './components/AuthModal';
import ConfirmModal from './components/ConfirmModal';
import SummaryCards from './components/SummaryCards';
import GigList from './components/GigList';
import CalendarWithFilters from './components/CalendarWithFilters';
import SideMenu from './components/SideMenu';
import EmptyState from './components/EmptyState';
import LoadingOverlay from './components/LoadingOverlay';
import { ToastContainer, useToast } from './components/Toast';
import AcceptInvite from './components/AcceptInvite';
import OnboardingModal from './components/OnboardingModal';
import AgendaSelector from './components/AgendaSelector';

const App: React.FC = () => {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [editingGig, setEditingGig] = useState<Gig | null>(null);
  const [preSelectedDate, setPreSelectedDate] = useState<string | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [showValues, setShowValues] = useState(true);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedGigIds, setSelectedGigIds] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const backupInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteMultipleConfirmOpen, setDeleteMultipleConfirmOpen] = useState(false);
  const [importPreviewOpen, setImportPreviewOpen] = useState(false);
  const [importPreviewGigs, setImportPreviewGigs] = useState<Gig[]>([]);
  const [importingCount, setImportingCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid'>('all');
  const [selectedBandId, setSelectedBandId] = useState<string | null>(() => {
    // Carregar do localStorage na inicialização
    const saved = localStorage.getItem('selectedBandId');
    return saved && saved !== 'null' ? saved : null;
  });
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [bandsCache, setBandsCache] = useState<Band[]>([]);
  const [isSwitchingAgenda, setIsSwitchingAgenda] = useState(false);
  const toast = useToast();

  // Persistir selectedBandId no localStorage sempre que mudar
  useEffect(() => {
    if (selectedBandId) {
      localStorage.setItem('selectedBandId', selectedBandId);
    } else {
      localStorage.removeItem('selectedBandId');
    }
  }, [selectedBandId]);

  // Função para atualizar o cache de bandas
  const refreshBandsCache = useCallback(async () => {
    if (!user) {
      setBandsCache([]);
      return;
    }

    try {
      const userBands = await bandService.fetchUserBands();
      setBandsCache(userBands);
    } catch (error) {
      console.error('Erro ao carregar bandas para cache:', error);
    }
  }, [user]);

  // Carregar e cachear bandas quando usuário estiver autenticado
  useEffect(() => {
    refreshBandsCache();
  }, [user]);

  // Recarregar gigs quando mudar o contexto (pessoal/banda)
  useEffect(() => {
    const effectStart = performance.now();
    console.log(`🔄 [PERF] useEffect [selectedBandId, user] DISPARADO`, {
      user: !!user,
      selectedBandId,
      currentBandIdRef: currentBandIdRef.current,
      timestamp: new Date().toISOString()
    });

    if (!user) {
      console.log(`⏸️ [PERF] useEffect - Sem usuário, retornando`);
      return;
    }
    
    // Evitar recarregamento se já está carregando ou se o bandId não mudou realmente
    const bandIdChanged = currentBandIdRef.current !== selectedBandId;
    
    console.log(`🔍 [PERF] useEffect - Verificações:`, {
      bandIdChanged,
      hasSubscription: !!subscriptionRef.current,
      isLoading: loadingRef.current
    });
    
    // Se não mudou e já tem subscription, não fazer nada
    if (!bandIdChanged && subscriptionRef.current) {
      const effectTime = performance.now() - effectStart;
      console.log(`⏸️ [PERF] useEffect - Sem mudanças, retornando - ${effectTime.toFixed(2)}ms`);
      return;
    }
    
    // Se já está carregando, aguardar
    if (loadingRef.current) {
      console.log('⏸️ [PERF] useEffect - loadGigs já em execução, aguardando...');
      return;
    }
    
    // Mostrar indicador de transição apenas se realmente mudou
    if (bandIdChanged) {
      const setSwitchingStart = performance.now();
      setIsSwitchingAgenda(true);
      console.log(`🔄 [PERF] setIsSwitchingAgenda(true) - ${(performance.now() - setSwitchingStart).toFixed(2)}ms`);
    }
    
    // Desinscrever da subscription anterior antes de recarregar (apenas se mudou)
    if (subscriptionRef.current && bandIdChanged) {
      const removeStart = performance.now();
      supabase.removeChannel(subscriptionRef.current).catch(err => {
        console.warn('⚠️ [PERF] Erro ao remover channel:', err);
      });
      subscriptionRef.current = null;
      console.log(`🔌 [PERF] Channel removido no useEffect - ${(performance.now() - removeStart).toFixed(2)}ms`);
    }
    
    // Usar um pequeno timeout para debounce e evitar múltiplas execuções
    const timeoutId = setTimeout(() => {
      const timeoutStart = performance.now();
      console.log(`⏱️ [PERF] Timeout disparado após 50ms`);
      loadGigs();
      console.log(`⏱️ [PERF] loadGigs chamado do timeout - ${(performance.now() - timeoutStart).toFixed(2)}ms`);
    }, 50);
    
    const effectTime = performance.now() - effectStart;
    console.log(`✅ [PERF] useEffect configurado - ${effectTime.toFixed(2)}ms`);
    
    return () => {
      clearTimeout(timeoutId);
      const cleanupTime = performance.now() - effectStart;
      console.log(`🧹 [PERF] useEffect cleanup - ${cleanupTime.toFixed(2)}ms`);
    };
  }, [selectedBandId, user]);

  // Verificar periodicamente se a banda selecionada ainda existe (para redirecionar outros usuários)
  useEffect(() => {
    if (!user || !selectedBandId) return;

    let isChecking = false;
    
    const checkBandExists = async () => {
      // Evitar múltiplas verificações simultâneas
      if (isChecking) return;
      
      try {
        isChecking = true;
        // Atualizar cache e verificar
        await refreshBandsCache();
        // Buscar bandas atualizadas diretamente
        const userBands = await bandService.fetchUserBands();
        const bandExists = userBands.some(b => b.id === selectedBandId);
        
        if (!bandExists) {
          // Banda foi deletada, redirecionar para agenda pessoal
          setSelectedBandId(null);
          toast.info('A banda foi excluída. Você foi redirecionado para sua agenda pessoal.');
        }
      } catch (error) {
        console.error('Erro ao verificar banda:', error);
      } finally {
        isChecking = false;
      }
    };

    // Verificar imediatamente apenas uma vez
    checkBandExists();

    // Verificar a cada 15 segundos (reduzido de 10 para melhor performance)
    const interval = setInterval(checkBandExists, 15000);

    return () => clearInterval(interval);
  }, [user, selectedBandId, toast]);

  // Função para processar escolha do onboarding
  const handleOnboardingComplete = async (choice: 'personal' | 'band', bandName?: string) => {
    try {
      // Marcar onboarding como completo
      await authService.completeOnboarding();
      
      if (choice === 'band' && bandName) {
        // Criar uma banda com o nome fornecido
        const band = await bandService.createBand(bandName.trim());
        // Atualizar cache de bandas
        await refreshBandsCache();
        setSelectedBandId(band.id);
        toast.success(`Banda "${bandName}" criada! Você pode convidar membros agora.`);
      } else {
        // Agenda pessoal - apenas marcar como completo
        setSelectedBandId(null);
        toast.success('Agenda pessoal configurada!');
      }
      
      // Atualizar perfil
      const updatedProfile = await authService.getUserProfile(user!.id);
      setUserProfile(updatedProfile);
      
      setShowOnboarding(false);
      await loadGigs();
    } catch (error: any) {
      console.error('Erro ao processar onboarding:', error);
      toast.error(error.message || 'Erro ao processar escolha');
    }
  };

  // Carregar dados do Supabase quando usuário estiver autenticado
  useEffect(() => {
    // Verificar se há hash de autenticação na URL (após redirect do OAuth)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const error = hashParams.get('error');
    
    if (error) {
      console.error('Erro na autenticação:', error);
      setLoading(false);
      return;
    }

    const loadUser = async () => {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      
      if (currentUser) {
        const profile = await authService.getUserProfile(currentUser.id);
        setUserProfile(profile);
        
        // Verificar se há token de convite na URL (prioridade sobre onboarding)
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const pendingToken = localStorage.getItem('pendingInviteToken');
        
        if (token || pendingToken) {
          // Se há convite, processar e pular onboarding
          setInviteToken(token || pendingToken);
          setShowOnboarding(false); // Garantir que onboarding não aparece
          if (pendingToken) localStorage.removeItem('pendingInviteToken');
          // Limpar token da URL mas manter no estado
          if (token) {
            window.history.replaceState(null, '', window.location.pathname);
          }
          // Carregar gigs silenciosamente para não mostrar loading desnecessário
          await loadGigs(false);
        } else {
          // Verificar se precisa mostrar onboarding (apenas se não houver convite)
          if (profile && !profile.has_completed_onboarding) {
            setShowOnboarding(true);
          } else {
            // Carregar gigs apenas uma vez no início
            await loadGigs(false);
          }
        }
        
        // Limpar hash da URL após processar (se não houver token na query)
        if (accessToken && !token) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      } else {
        setLoading(false);
      }
    };

    loadUser();

    // Escutar mudanças de autenticação (apenas para mudanças reais, não inicialização)
    let isInitialLoad = true;
    const { data: { subscription } } = authService.onAuthStateChange(async (user) => {
      // Ignorar a primeira chamada (já tratada em loadUser)
      if (isInitialLoad) {
        isInitialLoad = false;
        return;
      }
      
      setUser(user);
      if (user) {
        const profile = await authService.getUserProfile(user.id);
        setUserProfile(profile);
        
        // Verificar se há token de convite (prioridade sobre onboarding)
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const pendingToken = localStorage.getItem('pendingInviteToken');
        
        if (token || pendingToken) {
          // Se há convite, processar e pular onboarding
          setInviteToken(token || pendingToken);
          setShowOnboarding(false); // Garantir que onboarding não aparece
          if (pendingToken) localStorage.removeItem('pendingInviteToken');
          // Limpar token da URL se necessário
          if (token) {
            window.history.replaceState(null, '', window.location.pathname);
          }
          await loadGigs(false);
        } else {
          // Verificar se precisa mostrar onboarding (apenas se não houver convite)
          if (profile && !profile.has_completed_onboarding) {
            setShowOnboarding(true);
          } else {
            await loadGigs(false);
          }
        }
        
        // Limpar hash da URL após processar
        if (window.location.hash.includes('access_token')) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      } else {
        // Limpar subscriptions quando usuário deslogar
        if (subscriptionRef.current) {
          supabase.removeChannel(subscriptionRef.current).catch(() => {});
          subscriptionRef.current = null;
        }
        setGigs([]);
        setLoading(false);
        setShowOnboarding(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + N: Novo show
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        if (!isModalOpen && user) {
          setEditingGig(null);
          setPreSelectedDate(null);
          setIsModalOpen(true);
        }
      }
      
      // ESC: Fechar modais
      if (e.key === 'Escape') {
        if (isModalOpen) {
          setIsModalOpen(false);
          setEditingGig(null);
          setPreSelectedDate(null);
        }
        if (isMenuOpen) {
          setIsMenuOpen(false);
        }
        if (isClearConfirmOpen) {
          setIsClearConfirmOpen(false);
        }
        if (deleteConfirmId) {
          setDeleteConfirmId(null);
        }
        if (deleteMultipleConfirmOpen) {
          setDeleteMultipleConfirmOpen(false);
        }
        if (importPreviewOpen) {
          setImportPreviewOpen(false);
          setImportPreviewGigs([]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isMenuOpen, isClearConfirmOpen, deleteConfirmId, deleteMultipleConfirmOpen, importPreviewOpen, user]);

  // Ref para armazenar a subscription e evitar múltiplas subscrições
  const subscriptionRef = useRef<any>(null);
  const loadingRef = useRef<boolean>(false);
  const currentBandIdRef = useRef<string | null>(null);

  const loadGigs = async (silent = false) => {
    const loadGigsStart = performance.now();
    console.log(`🚀 [PERF] loadGigs INICIADO`, {
      silent,
      selectedBandId,
      previousBandId: currentBandIdRef.current,
      timestamp: new Date().toISOString()
    });

    // Evitar múltiplas execuções simultâneas
    if (loadingRef.current) {
      if (!silent) {
        console.log('⏸️ [PERF] loadGigs já em execução, ignorando chamada duplicada');
      }
      return;
    }

    try {
      loadingRef.current = true;
      
      // Verificar se o bandId mudou antes de atualizar
      const bandIdChanged = currentBandIdRef.current !== selectedBandId;
      const previousBandId = currentBandIdRef.current;
      currentBandIdRef.current = selectedBandId;
      
      console.log(`🔄 [PERF] loadGigs - Mudança detectada:`, {
        bandIdChanged,
        previous: previousBandId,
        current: selectedBandId
      });
      
      if (!silent) {
        const setLoadingStart = performance.now();
        setLoading(true);
        console.log(`⚡ [PERF] setLoading(true) - ${(performance.now() - setLoadingStart).toFixed(2)}ms`);
      }
      
      const fetchStart = performance.now();
      const data = await gigService.fetchGigs(selectedBandId);
      const fetchTime = performance.now() - fetchStart;
      
      console.log(`📦 [PERF] fetchGigs retornou - ${fetchTime.toFixed(2)}ms`, {
        count: data.length
      });
      
      const setGigsStart = performance.now();
      setGigs(data);
      const setGigsTime = performance.now() - setGigsStart;
      console.log(`💾 [PERF] setGigs() - ${setGigsTime.toFixed(2)}ms`);
      
      // Desinscrever da subscription anterior apenas se o bandId mudou
      if (subscriptionRef.current && bandIdChanged) {
        const unsubscribeStart = performance.now();
        try {
          await supabase.removeChannel(subscriptionRef.current);
          const unsubscribeTime = performance.now() - unsubscribeStart;
          console.log(`🔌 [PERF] Channel removido - ${unsubscribeTime.toFixed(2)}ms`);
        } catch (error) {
          console.warn('⚠️ [PERF] Erro ao remover channel anterior:', error);
        }
        subscriptionRef.current = null;
      }
      
      // Configurar real-time subscription apenas se não existir ou se o contexto mudou
      if (!silent && (!subscriptionRef.current || bandIdChanged)) {
        const subscribeStart = performance.now();
        subscriptionRef.current = await gigService.subscribeToGigs((updatedGigs) => {
          // Atualizar estado de forma otimizada
          setGigs(prevGigs => {
            // Criar mapas para comparação rápida
            const prevMap = new Map(prevGigs.map(g => [g.id, g]));
            const newMap = new Map(updatedGigs.map(g => [g.id, g]));
            
            // Verificar se há mudanças reais
            let hasChanges = false;
            
            // Verificar se algum gig foi removido ou adicionado
            if (prevGigs.length !== updatedGigs.length) {
              hasChanges = true;
            } else {
              // Verificar se algum gig foi modificado
              for (const [id, newGig] of newMap) {
                const oldGig = prevMap.get(id);
                if (!oldGig || 
                    oldGig.title !== newGig.title ||
                    oldGig.date !== newGig.date ||
                    oldGig.status !== newGig.status ||
                    oldGig.value !== newGig.value ||
                    oldGig.location !== newGig.location ||
                    oldGig.band_id !== newGig.band_id) {
                  hasChanges = true;
                  break;
                }
              }
            }
            
            // Só atualizar se houver mudanças reais
            return hasChanges ? updatedGigs : prevGigs;
          });
        }, selectedBandId);
        const subscribeTime = performance.now() - subscribeStart;
        console.log(`📡 [PERF] Subscription configurada - ${subscribeTime.toFixed(2)}ms`);
      }
      
      const totalTime = performance.now() - loadGigsStart;
      console.log(`✅ [PERF] loadGigs CONCLUÍDO - Total: ${totalTime.toFixed(2)}ms`, {
        breakdown: {
          fetch: `${fetchTime.toFixed(2)}ms`,
          setGigs: `${setGigsTime.toFixed(2)}ms`,
          total: `${totalTime.toFixed(2)}ms`
        },
        bandId: selectedBandId,
        gigsCount: data.length
      });
    } catch (error: any) {
      const totalTime = performance.now() - loadGigsStart;
      console.error(`❌ [PERF] Erro ao carregar shows - Total: ${totalTime.toFixed(2)}ms`, error);
      if (error.message === 'User not authenticated') {
        setIsAuthModalOpen(true);
      }
    } finally {
      loadingRef.current = false;
      if (!silent) {
        const setLoadingStart = performance.now();
        setLoading(false);
        console.log(`⚡ [PERF] setLoading(false) - ${(performance.now() - setLoadingStart).toFixed(2)}ms`);
      }
      // Remover indicador de transição após um pequeno delay para garantir que a UI atualizou
      setTimeout(() => setIsSwitchingAgenda(false), 100);
    }
  };

  // Função para atualizar um gig específico no estado sem recarregar tudo
  const updateGigInState = (updatedGig: Gig) => {
    setGigs(prevGigs => prevGigs.map(gig => 
      gig.id === updatedGig.id ? updatedGig : gig
    ));
  };

  const handleSaveGig = async (gig: any) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    try {
      setIsSyncing(true);
      if (gig.id) {
        const updatedGig = await gigService.updateGig(gig.id, gig);
        updateGigInState(updatedGig);
        toast.success('Show atualizado com sucesso!');
      } else {
        const newGig = await gigService.createGig(gig, selectedBandId);
        // Atualização otimista: adicionar o novo gig ao estado
        // A subscription em tempo real vai atualizar automaticamente para todos os membros
        setGigs(prevGigs => {
          // Verificar se já não existe (pode ter sido adicionado pela subscription)
          const exists = prevGigs.some(g => g.id === newGig.id);
          if (exists) {
            // Se já existe, atualizar
            return prevGigs.map(g => g.id === newGig.id ? newGig : g).sort((a, b) => 
              a.date.localeCompare(b.date)
            );
          }
          // Se não existe, adicionar
          return [...prevGigs, newGig].sort((a, b) => 
            a.date.localeCompare(b.date)
          );
        });
        toast.success('Show criado com sucesso!');
      }
      setIsModalOpen(false);
      setEditingGig(null);
      setPreSelectedDate(null);
    } catch (error: any) {
      console.error('Erro ao salvar show:', error);
      toast.error(error.message || 'Erro ao salvar show');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteGig = async (id: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    const gig = gigs.find(g => g.id === id);
    setDeleteConfirmId(id);
  };

  const confirmDeleteGig = async () => {
    if (!deleteConfirmId) return;
    
    const gig = gigs.find(g => g.id === deleteConfirmId);
    const gigTitle = gig?.title || 'este show';
    
    // Otimista: remover da UI imediatamente
    const deletedGig = gig;
    setGigs(prevGigs => prevGigs.filter(g => g.id !== deleteConfirmId));
    
    try {
      setIsSyncing(true);
      await gigService.deleteGig(deleteConfirmId);
      toast.success(`"${gigTitle}" excluído com sucesso!`, 3000, () => {
        // Undo function - recriar o show
        if (deletedGig) {
          gigService.createGig(deletedGig, selectedBandId).then((newGig) => {
            setGigs(prevGigs => [...prevGigs, newGig].sort((a, b) => 
              a.date.localeCompare(b.date)
            ));
          });
        }
      });
    } catch (error: any) {
      console.error('Erro ao excluir show:', error);
      // Reverter mudança otimista em caso de erro
      if (deletedGig) {
        setGigs(prevGigs => [...prevGigs, deletedGig].sort((a, b) => 
          a.date.localeCompare(b.date)
        ));
      }
      toast.error(error.message || 'Erro ao excluir show');
    } finally {
      setIsSyncing(false);
      setDeleteConfirmId(null);
    }
  };

  const handleClearAllGigs = async () => {
    setIsClearConfirmOpen(true);
  };

  const confirmClearAllGigs = async () => {
    try {
      setIsSyncing(true);
      await gigService.deleteAllGigs(selectedBandId);
      await loadGigs();
      toast.success(selectedBandId ? 'Shows da banda limpos com sucesso!' : 'Agenda pessoal limpa com sucesso!');
    } catch (error: any) {
      console.error('Erro ao limpar agenda:', error);
      toast.error(error.message || 'Erro ao limpar agenda');
    } finally {
      setIsSyncing(false);
      setIsClearConfirmOpen(false);
    }
  };

  const handleDeleteMultiple = () => {
    if (selectedGigIds.size === 0) return;
    setDeleteMultipleConfirmOpen(true);
  };

  const confirmDeleteMultiple = async () => {
    const idsToDelete = Array.from(selectedGigIds) as string[];
    const deletedGigs = gigs.filter(g => idsToDelete.includes(g.id));
    
    // Otimista: remover da UI imediatamente
    setGigs(prevGigs => prevGigs.filter(g => !idsToDelete.includes(g.id)));
    setSelectedGigIds(new Set());
    setIsMultiSelectMode(false);
    
    try {
      setIsSyncing(true);
      // Deletar em paralelo para melhor performance
      await Promise.all(idsToDelete.map(id => gigService.deleteGig(id)));
      toast.success(`${idsToDelete.length} evento(s) excluído(s) com sucesso!`);
    } catch (error: any) {
      console.error('Erro ao excluir eventos:', error);
      // Reverter mudança otimista em caso de erro
      setGigs(prevGigs => [...prevGigs, ...deletedGigs].sort((a, b) => 
        a.date.localeCompare(b.date)
      ));
      toast.error(error.message || 'Erro ao excluir eventos');
    } finally {
      setIsSyncing(false);
      setDeleteMultipleConfirmOpen(false);
    }
  };

  const isLoadingBulkOperation = isImporting || importingCount > 0 || (isSyncing && selectedGigIds.size > 0);

  const getLoadingMessage = () => {
    if (isImporting || importingCount > 0) {
      // Use importingCount if available, otherwise try importPreviewGigs length
      const count = importingCount || importPreviewGigs.length;
      if (count > 0) {
        return `Importando ${count} evento(s)...`;
      }
      return 'Importando eventos...';
    }
    if (isSyncing && selectedGigIds.size > 0) {
      return `Excluindo ${selectedGigIds.size} evento(s)...`;
    }
    return 'Processando...';
  };

  const toggleGigStatus = async (id: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    const gig = gigs.find(g => g.id === id);
    if (!gig) return;

    const newStatus = gig.status === GigStatus.PAID ? GigStatus.PENDING : GigStatus.PAID;
    
    // Otimista: atualizar UI imediatamente
    const optimisticGig = { ...gig, status: newStatus };
    updateGigInState(optimisticGig);

    try {
      // Atualizar no banco (sem recarregar tudo)
      const updatedGig = await gigService.toggleGigStatus(id, gig.status);
      // Atualizar com dados reais do servidor
      updateGigInState(updatedGig);
      toast.success(`Status alterado para ${newStatus === GigStatus.PAID ? 'Pago' : 'Pendente'}`);
    } catch (error: any) {
      console.error('Erro ao alterar status:', error);
      // Reverter mudança otimista em caso de erro
      updateGigInState(gig);
      toast.error(error.message || 'Erro ao alterar status');
    }
  };

  // Sincronização agora é automática via Supabase
  const handleCloudSync = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    await loadGigs();
  };

  const isPeriodActive = useMemo(() => !!(startDate && endDate), [startDate, endDate]);

  const filteredGigs = useMemo(() => {
    let result = [...gigs].sort((a, b) => a.date.localeCompare(b.date));
    
    // Filtro de período ou data selecionada
    if (isPeriodActive) {
      result = result.filter(gig => gig.date >= startDate && gig.date <= endDate);
    } else if (selectedCalendarDate) {
      result = result.filter(gig => gig.date === selectedCalendarDate);
    }
    
    // Filtro de status
    if (filterStatus !== 'all') {
      result = result.filter(gig => 
        filterStatus === 'pending' ? gig.status === GigStatus.PENDING : gig.status === GigStatus.PAID
      );
    }
    
    // Busca por texto
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(gig => 
        gig.title?.toLowerCase().includes(query) ||
        gig.band_name?.toLowerCase().includes(query) ||
        gig.location?.toLowerCase().includes(query) ||
        gig.notes?.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [gigs, selectedCalendarDate, startDate, endDate, isPeriodActive, filterStatus, searchQuery]);

  const stats = useMemo<FinancialStats>(() => {
    return filteredGigs.reduce((acc, gig) => {
      const val = Number(gig.value) || 0;
      if (gig.status === GigStatus.PAID) acc.totalReceived += val;
      else acc.totalPending += val;
      acc.overallTotal += val;
      return acc;
    }, { totalReceived: 0, totalPending: 0, overallTotal: 0 });
  }, [filteredGigs]);


  const handleExportBackup = () => {
    const blob = new Blob([JSON.stringify(gigs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gigtrack_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) {
      setIsAuthModalOpen(true);
      return;
    }

    setIsImporting(true);
    try {
      // Parse file
      const rows = await importService.parseFile(file);
      
      if (rows.length === 0) {
        toast.warning('Nenhum dado encontrado no arquivo.');
        setIsImporting(false);
        return;
      }

      // Convert to gigs
      const newGigs = importService.convertToGigs(rows, user.id);
      
      // Show preview
      setImportPreviewGigs(newGigs);
      setImportPreviewOpen(true);
      setIsImporting(false); // Stop loading when showing preview
    } catch (error: any) {
      console.error('Erro ao importar:', error);
      toast.error(`Erro ao importar: ${error.message || 'Erro desconhecido'}`);
      setIsImporting(false);
      setImportPreviewGigs([]); // Clear on error
    } finally {
      // Reset input
      if (importInputRef.current) {
        importInputRef.current.value = '';
      }
    }
  };

  const confirmImport = async () => {
    const gigsToImport = [...importPreviewGigs]; // Copy array before clearing
    const totalCount = gigsToImport.length;
    try {
      setIsImporting(true);
      setImportPreviewOpen(false);
      setImportingCount(totalCount); // Set count for loading message
      
      // Create gigs in Supabase in batches to avoid timeout
      const batchSize = 10;
      const createdGigs: Gig[] = [];
      
      for (let i = 0; i < gigsToImport.length; i += batchSize) {
        const batch = gigsToImport.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(gig => gigService.createGig(gig, selectedBandId)));
        createdGigs.push(...batchResults);
      }

      // Clear preview after import completes (but keep count until loading finishes)
      setImportPreviewGigs([]);
      
      // Adicionar novos gigs ao estado sem recarregar tudo
      setGigs(prevGigs => [...prevGigs, ...createdGigs].sort((a, b) => 
        a.date.localeCompare(b.date)
      ));
      
      toast.success(`${totalCount} eventos importados com sucesso!`);
      
      // Clear count after everything completes
      setImportingCount(0);
    } catch (error: any) {
      console.error('Erro ao importar:', error);
      toast.error(`Erro ao importar: ${error.message || 'Erro desconhecido'}`);
      // Clear preview and count even on error
      setImportPreviewGigs([]);
      setImportingCount(0);
    } finally {
      setIsImporting(false);
    }
  };

  // Se não estiver autenticado, mostrar apenas tela de login
  if (!user && !loading) {
    return (
      <div className="min-h-screen bg-[#1E1F25] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-[#3057F2] p-4 rounded-2xl inline-block mb-4">
              <Calendar className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">GigTrack <span className="text-[#3057F2]">Pro</span></h1>
            <p className="text-white">Sua agenda de shows profissional</p>
          </div>
          <AuthModal 
            isOpen={true} 
            onClose={() => {}} 
            user={null}
            profile={null}
            onAuthChange={setUser}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-8 bg-[#1E1F25] text-white">
      <SideMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        selectedBandId={selectedBandId}
        onBandSelect={setSelectedBandId}
      />

      <header className="bg-[#24272D]/80 backdrop-blur-md border-b border-[#31333B] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMenuOpen(true)} className="p-2 hover:bg-[#24272D] rounded-lg text-white transition-colors">
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
              <div className="bg-[#3057F2] p-2 rounded-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white hidden sm:block">GigTrack <span className="text-[#3057F2]">Pro</span></h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {isSyncing && <div className="flex items-center gap-2 text-[10px] font-bold text-white animate-pulse bg-[#24272D] px-3 py-1.5 rounded-full border border-[#31333B]"><Cloud size={12}/> SYNC...</div>}
            {isImporting && <div className="flex items-center gap-2 text-[10px] font-bold text-white animate-pulse bg-[#24272D] px-3 py-1.5 rounded-full border border-[#31333B]"><Upload size={12}/> IMPORTANDO...</div>}
            <input
              ref={importInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleImportFile}
              className="hidden"
            />
            <button
              onClick={() => {
                if (!user) {
                  setIsAuthModalOpen(true);
                } else {
                  importInputRef.current?.click();
                }
              }}
              disabled={isImporting}
              className="p-2 hover:bg-[#24272D] rounded-lg text-white transition-colors disabled:opacity-50"
              title="Importar Excel/CSV"
            >
              <Upload size={20} />
            </button>
            <button 
              onClick={() => setIsAuthModalOpen(true)} 
              className="p-2 hover:bg-[#24272D] rounded-lg text-white transition-colors"
              title="Minha Conta"
            >
              <User size={20} className="text-white" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <Loader2 className="w-10 h-10 text-[#3057F2] animate-spin mb-4" />
            <p className="text-white font-bold uppercase tracking-widest text-[10px]">Carregando...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-32 lg:pb-8">
            <div className="lg:col-span-4">
              <CalendarWithFilters
                gigs={gigs}
                selectedDate={selectedCalendarDate}
                startDate={startDate}
                endDate={endDate}
                onDateSelect={(date) => {
                  setSelectedCalendarDate(date);
                  if (date) { setStartDate(''); setEndDate(''); }
                }}
                onDateClick={(date) => {
                  setSelectedCalendarDate(null);
                  setStartDate('');
                  setEndDate('');
                  setEditingGig(null);
                  setPreSelectedDate(date);
                  setIsModalOpen(true);
                }}
                onQuickFilter={(type) => {
                  const today = new Date();
                  let start: Date;
                  let end: Date;
                  
                  if (type === 'week') {
                    const dayOfWeek = today.getDay();
                    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                    start = new Date(today);
                    start.setDate(today.getDate() + diffToMonday);
                    start.setHours(0, 0, 0, 0);
                    
                    end = new Date(start);
                    end.setDate(start.getDate() + 6);
                    end.setHours(23, 59, 59, 999);
                  } else if (type === 'month') {
                    start = new Date(today.getFullYear(), today.getMonth(), 1);
                    end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                    end.setHours(23, 59, 59, 999);
                  } else {
                    start = new Date(today.getFullYear(), 0, 1);
                    end = new Date(today.getFullYear(), 11, 31);
                    end.setHours(23, 59, 59, 999);
                  }
                  
                  setStartDate(start.toISOString().split('T')[0]);
                  setEndDate(end.toISOString().split('T')[0]);
                  setSelectedCalendarDate(null);
                }}
                onCustomPeriod={(start, end) => {
                  setStartDate(start);
                  setEndDate(end);
                  setSelectedCalendarDate(null);
                }}
                onClear={() => { setStartDate(''); setEndDate(''); setSelectedCalendarDate(null); }}
                showValues={showValues}
                stats={stats}
                gigCount={filteredGigs.length}
              />
              
              {/* Resumo Financeiro fixo no desktop */}
              <section className="hidden lg:block mt-8 space-y-4 sticky top-24">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest">Resumo Financeiro</h3>
                  <button onClick={() => setShowValues(!showValues)} className={`p-1.5 rounded-lg border transition-all ${showValues ? 'bg-[#24272D] border-[#31333B] text-white' : 'bg-[#3057F2]/10 border-[#3057F2]/20 text-[#3057F2]'}`}>
                    {showValues ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                </div>
                <SummaryCards stats={stats} showValues={showValues} />
              </section>
            </div>

            <div className="lg:col-span-8">
              <div className="flex flex-col gap-4 mb-8">
                {/* Título e Botão Novo Show */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <AgendaSelector
                      selectedBandId={selectedBandId}
                      onBandSelect={setSelectedBandId}
                      isPeriodActive={isPeriodActive}
                      selectedCalendarDate={selectedCalendarDate}
                      selectedBandName={selectedBandId ? bandsCache.find(b => b.id === selectedBandId)?.name : null}
                      isSwitching={isSwitchingAgenda}
                      onBandsCacheUpdate={refreshBandsCache}
                    />
                  </div>
                  {!isPeriodActive && !selectedCalendarDate && (
                    <button 
                      onClick={() => { 
                        if (!user) {
                          setIsAuthModalOpen(true);
                        } else {
                          setEditingGig(null);
                          setPreSelectedDate(null);
                          setIsModalOpen(true);
                        }
                      }} 
                      className="bg-[#3057F2] hover:bg-[#2545D9] text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-[#3057F2]/20 flex-shrink-0"
                    >
                      <Plus size={18} />
                      <span>Novo Show</span>
                    </button>
                  )}
                </div>
                
                {/* Divider */}
                {!isPeriodActive && !selectedCalendarDate && (
                  <div className="border-t border-[#31333B] my-2" />
                )}
                
                {/* Busca e Filtros */}
                {!isPeriodActive && !selectedCalendarDate && (
                  <div className="flex flex-col sm:flex-row gap-3 w-full items-start sm:items-center">
                    {/* Busca */}
                    <div className="relative flex-1 sm:flex-initial">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" size={18} />
                      <input
                        type="text"
                        placeholder="Buscar shows..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full sm:w-64 pl-10 pr-4 py-2 bg-[#24272D] border border-[#31333B] rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#3057F2] transition-colors"
                      />
                    </div>
                    
                    {/* Filtro de Status e Excluir Várias */}
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => setFilterStatus('all')}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                          filterStatus === 'all' 
                            ? 'bg-[#3057F2] text-white' 
                            : 'bg-[#24272D] border border-[#31333B] text-white hover:bg-[#1E1F25]'
                        }`}
                      >
                        Todos
                      </button>
                      <button
                        onClick={() => setFilterStatus('pending')}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                          filterStatus === 'pending' 
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                            : 'bg-[#24272D] border border-[#31333B] text-white hover:bg-[#1E1F25]'
                        }`}
                      >
                        Pendentes
                      </button>
                      <button
                        onClick={() => setFilterStatus('paid')}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                          filterStatus === 'paid' 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-[#24272D] border border-[#31333B] text-white hover:bg-[#1E1F25]'
                        }`}
                      >
                        Pagos
                      </button>
                      {filteredGigs.length > 0 && (
                        <button
                          onClick={() => {
                            if (isMultiSelectMode) {
                              setIsMultiSelectMode(false);
                              setSelectedGigIds(new Set());
                            } else {
                              setIsMultiSelectMode(true);
                            }
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 rounded-xl font-semibold text-sm transition-all"
                        >
                          {!isMultiSelectMode && <Trash2 size={16} />}
                          {isMultiSelectMode ? 'Cancelar' : 'Excluir Várias'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
                
                {filteredGigs.length > 0 && !isPeriodActive && !selectedCalendarDate && isMultiSelectMode && (
                  <div className="flex flex-wrap gap-2">
                    {isMultiSelectMode && filteredGigs.length > 0 && (
                      <button
                        onClick={async () => {
                          if (selectedGigIds.size === filteredGigs.length) {
                            setSelectedGigIds(new Set());
                          } else {
                            setSelectedGigIds(new Set(filteredGigs.map(g => g.id)));
                          }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-[#3057F2]/20 hover:bg-[#3057F2]/30 text-[#3057F2] border border-[#3057F2]/30 rounded-xl font-semibold text-sm transition-all"
                      >
                        {selectedGigIds.size === filteredGigs.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
                      </button>
                    )}
                    {isMultiSelectMode && selectedGigIds.size > 0 && (
                      <button
                        onClick={handleDeleteMultiple}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-all"
                      >
                        <Trash2 size={16} />
                        Excluir {selectedGigIds.size}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {filteredGigs.length === 0 ? (
                <EmptyState 
                  onAddClick={() => {
                    setEditingGig(null);
                    setPreSelectedDate(null);
                    setIsModalOpen(true);
                  }}
                  message={searchQuery || filterStatus !== 'all' || isPeriodActive || selectedCalendarDate ? 'Nenhum show encontrado com os filtros aplicados.' : undefined}
                />
              ) : (
                <GigList 
                  gigs={filteredGigs} 
                  onToggleStatus={toggleGigStatus} 
                  onDelete={handleDeleteGig}
                  onEdit={gig => { setEditingGig(gig); setIsModalOpen(true); }}
                  showValues={showValues}
                  isMultiSelectMode={isMultiSelectMode}
                  selectedGigIds={selectedGigIds}
                  onToggleSelect={(id) => {
                    const newSet = new Set(selectedGigIds);
                    if (newSet.has(id)) {
                      newSet.delete(id);
                    } else {
                      newSet.add(id);
                    }
                    setSelectedGigIds(newSet);
                  }}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer fixo com Resumo Financeiro (mobile) */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#24272D] border-t border-[#31333B] z-30 lg:hidden shadow-2xl">
        <div className="px-3 py-3">
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Resumo Financeiro</h3>
            <button onClick={() => setShowValues(!showValues)} className={`p-2 rounded-lg border transition-all ${showValues ? 'bg-[#24272D] border-[#31333B] text-white' : 'bg-[#3057F2]/10 border-[#3057F2]/20 text-[#3057F2]'}`}>
              {showValues ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>
          <SummaryCards stats={stats} showValues={showValues} />
        </div>
      </footer>

      {isModalOpen && (
        <GigModal 
          isOpen={isModalOpen} 
          onClose={() => {
            setIsModalOpen(false);
            setPreSelectedDate(null);
          }} 
          onSubmit={(gig) => {
            handleSaveGig(gig);
            setPreSelectedDate(null);
          }} 
          initialData={editingGig || (preSelectedDate ? { date: preSelectedDate } : null)}
          isLoading={isSyncing}
        />
      )}
      {isAuthModalOpen && (
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
          user={user}
          profile={userProfile}
          onAuthChange={setUser}
        />
      )}
      {/* Toast Container */}
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />

      {/* Loading Overlay para operações em massa */}
      <LoadingOverlay 
        isVisible={isLoadingBulkOperation} 
        message={getLoadingMessage()}
      />

      {/* Modal de Confirmação - Limpar Agenda */}
      {isClearConfirmOpen && (
        <ConfirmModal
          isOpen={isClearConfirmOpen}
          onClose={() => setIsClearConfirmOpen(false)}
          onConfirm={confirmClearAllGigs}
          title="Limpar Agenda"
          message="Tem certeza que deseja excluir TODOS os shows da sua agenda? Esta ação não pode ser desfeita."
          confirmText="Sim, Limpar Tudo"
          cancelText="Cancelar"
          isDestructive={true}
        />
      )}

      {/* Modal de Confirmação - Excluir Show */}
      {deleteConfirmId && (
        <ConfirmModal
          isOpen={!!deleteConfirmId}
          onClose={() => setDeleteConfirmId(null)}
          onConfirm={confirmDeleteGig}
          title="Excluir Show"
          message={`Tem certeza que deseja excluir "${gigs.find(g => g.id === deleteConfirmId)?.title || 'este show'}"?`}
          confirmText="Excluir"
          cancelText="Cancelar"
          isDestructive={true}
        />
      )}

      {/* Modal de Confirmação - Excluir Múltiplos */}
      {deleteMultipleConfirmOpen && (
        <ConfirmModal
          isOpen={deleteMultipleConfirmOpen}
          onClose={() => setDeleteMultipleConfirmOpen(false)}
          onConfirm={confirmDeleteMultiple}
          title="Excluir Shows Selecionados"
          message={`Tem certeza que deseja excluir ${selectedGigIds.size} show(s) selecionado(s)? Esta ação não pode ser desfeita.`}
          confirmText={`Excluir ${selectedGigIds.size}`}
          cancelText="Cancelar"
          isDestructive={true}
        />
      )}

      {/* Modal de Preview de Importação */}
      {importPreviewOpen && importPreviewGigs.length > 0 && (
        <ConfirmModal
          isOpen={importPreviewOpen}
          onClose={() => {
            setImportPreviewOpen(false);
            setImportPreviewGigs([]);
            setIsImporting(false); // Ensure loading is off when closing
          }}
          onConfirm={confirmImport}
          title="Preview de Importação"
          message={`Encontrados ${importPreviewGigs.length} evento(s) no arquivo. Deseja importar todos?`}
          confirmText={`Importar ${importPreviewGigs.length}`}
          cancelText="Cancelar"
          isDestructive={false}
        />
      )}

      {/* Modal de Aceitar Convite */}
      {inviteToken && (
        <AcceptInvite
          token={inviteToken}
          onComplete={async (bandId) => {
            setInviteToken(null);
            setShowOnboarding(false); // Garantir que onboarding não aparece
            
            // Marcar onboarding como completo se ainda não foi
            if (userProfile && !userProfile.has_completed_onboarding) {
              await authService.completeOnboarding();
              const updatedProfile = await authService.getUserProfile(user!.id);
              setUserProfile(updatedProfile);
            }
            
            // Recarregar bandas primeiro para incluir a nova banda
            if (user) {
              // Atualizar cache de bandas
              await refreshBandsCache();
              // Aguardar um pouco para garantir que o banco foi atualizado
              setTimeout(async () => {
                // Selecionar automaticamente a banda após aceitar convite
                setSelectedBandId(bandId);
                // Recarregar gigs para mostrar os eventos da banda
                await loadGigs();
              }, 500);
            }
          }}
        />
      )}

      {/* Modal de Onboarding - não mostrar se há convite pendente */}
      {showOnboarding && user && !inviteToken && (
        <OnboardingModal
          isOpen={showOnboarding}
          onComplete={handleOnboardingComplete}
        />
      )}
    </div>
  );
};

export default App;
