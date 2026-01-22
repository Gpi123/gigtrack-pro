
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, LayoutDashboard, Calendar, DollarSign, BrainCircuit, Menu, Eye, EyeOff, Cloud, Loader2, User, Upload, Trash2 } from 'lucide-react';
import { Gig, GigStatus, FinancialStats } from './types';
import { getMusicianInsights } from './services/geminiService';
import { gigService } from './services/gigService';
import { importService } from './services/importService';
import { authService, UserProfile } from './services/authService';
import { User as SupabaseUser } from '@supabase/supabase-js';
import GigModal from './components/GigModal';
import AuthModal from './components/AuthModal';
import ConfirmModal from './components/ConfirmModal';
import SummaryCards from './components/SummaryCards';
import GigList from './components/GigList';
import CalendarView from './components/CalendarView';
import PeriodFilter from './components/PeriodFilter';
import SideMenu from './components/SideMenu';

const App: React.FC = () => {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [editingGig, setEditingGig] = useState<Gig | null>(null);
  const [preSelectedDate, setPreSelectedDate] = useState<string | null>(null);
  const [insights, setInsights] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [showValues, setShowValues] = useState(true);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const backupInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

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
        await loadGigs();
        // Limpar hash da URL após processar
        if (accessToken) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      } else {
        setLoading(false);
      }
    };

    loadUser();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = authService.onAuthStateChange(async (user) => {
      setUser(user);
      if (user) {
        const profile = await authService.getUserProfile(user.id);
        setUserProfile(profile);
        await loadGigs();
        // Limpar hash da URL após processar
        if (window.location.hash.includes('access_token')) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      } else {
        setGigs([]);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadGigs = async () => {
    try {
      setLoading(true);
      const data = await gigService.fetchGigs();
      setGigs(data);
      
      // Configurar real-time subscription
      await gigService.subscribeToGigs((updatedGigs) => {
        setGigs(updatedGigs);
      });
    } catch (error: any) {
      console.error('Erro ao carregar shows:', error);
      if (error.message === 'User not authenticated') {
        setIsAuthModalOpen(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGig = async (gig: any) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    try {
      setIsSyncing(true);
      if (gig.id) {
        await gigService.updateGig(gig.id, gig);
      } else {
        await gigService.createGig(gig);
      }
      setIsModalOpen(false);
      setEditingGig(null);
      await loadGigs();
    } catch (error: any) {
      console.error('Erro ao salvar show:', error);
      alert(error.message || 'Erro ao salvar show');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteGig = async (id: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    if (confirm('Deseja excluir este show?')) {
      try {
        setIsSyncing(true);
        await gigService.deleteGig(id);
        await loadGigs();
      } catch (error: any) {
        console.error('Erro ao excluir show:', error);
        alert(error.message || 'Erro ao excluir show');
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const handleClearAllGigs = async () => {
    try {
      await gigService.deleteAllGigs();
      await loadGigs();
      alert('✅ Agenda limpa com sucesso!');
    } catch (error: any) {
      console.error('Erro ao limpar agenda:', error);
      alert(error.message || 'Erro ao limpar agenda');
    }
  };

  const toggleGigStatus = async (id: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    try {
      setIsSyncing(true);
      const gig = gigs.find(g => g.id === id);
      if (gig) {
        await gigService.toggleGigStatus(id, gig.status);
        await loadGigs();
      }
    } catch (error: any) {
      console.error('Erro ao alterar status:', error);
      alert(error.message || 'Erro ao alterar status');
    } finally {
      setIsSyncing(false);
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
    if (isPeriodActive) {
      result = result.filter(gig => gig.date >= startDate && gig.date <= endDate);
    } else if (selectedCalendarDate) {
      result = result.filter(gig => gig.date === selectedCalendarDate);
    }
    return result;
  }, [gigs, selectedCalendarDate, startDate, endDate, isPeriodActive]);

  const stats = useMemo<FinancialStats>(() => {
    return filteredGigs.reduce((acc, gig) => {
      const val = Number(gig.value) || 0;
      if (gig.status === GigStatus.PAID) acc.totalReceived += val;
      else acc.totalPending += val;
      acc.overallTotal += val;
      return acc;
    }, { totalReceived: 0, totalPending: 0, overallTotal: 0 });
  }, [filteredGigs]);

  const generateInsights = async () => {
    if (gigs.length === 0) return;
    setIsAnalyzing(true);
    try {
      const result = await getMusicianInsights(gigs);
      setInsights(result);
    } catch (err) {
      setInsights("Erro ao gerar insights.");
    } finally {
      setIsAnalyzing(false);
    }
  };

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
        alert('Nenhum dado encontrado no arquivo.');
        setIsImporting(false);
        return;
      }

      // Convert to gigs
      const newGigs = importService.convertToGigs(rows, user.id);
      
      // Confirm import
      const confirmed = confirm(`Encontrados ${newGigs.length} eventos no arquivo. Deseja importar todos?`);
      if (!confirmed) {
        setIsImporting(false);
        return;
      }

      // Create gigs in Supabase
      for (const gig of newGigs) {
        await gigService.createGig(gig);
      }

      // Reload gigs
      await loadGigs();
      alert(`✅ ${newGigs.length} eventos importados com sucesso!`);
    } catch (error: any) {
      console.error('Erro ao importar:', error);
      alert(`Erro ao importar: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsImporting(false);
      // Reset input
      if (importInputRef.current) {
        importInputRef.current.value = '';
      }
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
        syncId=""
        onSetSyncId={() => {}}
        lastSync={0}
        onCloudSync={() => {}}
        onImportCloud={() => {}}
        isSyncing={false}
        onExportBackup={() => {}}
        onGenerateInsights={generateInsights}
        isAnalyzing={isAnalyzing}
        insights={insights}
      />

      <header className="bg-[#24272D]/80 backdrop-blur-md border-b border-[#31333B] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMenuOpen(true)} className="p-2 hover:bg-[#24272D] rounded-lg text-white transition-colors">
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
              <div className="bg-slate-700 p-2 rounded-lg">
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
              className="bg-[#3057F2] hover:bg-[#2545D9] text-white px-5 py-2.5 rounded-full font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-[#3057F2]/20"
            >
              <Plus size={18} />
              <span>Novo Show</span>
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4 space-y-8">
              <PeriodFilter 
                startDate={startDate}
                endDate={endDate}
                onStartChange={setStartDate}
                onEndChange={setEndDate}
                onClear={() => { setStartDate(''); setEndDate(''); setSelectedCalendarDate(null); }}
                isActive={isPeriodActive}
                stats={stats}
                gigCount={filteredGigs.length}
                showValues={showValues}
                onQuickFilter={(type) => {
                  const today = new Date();
                  let start: Date;
                  let end: Date;
                  
                  if (type === 'week') {
                    // Esta semana: segunda a domingo da semana atual
                    const dayOfWeek = today.getDay(); // 0 = domingo, 1 = segunda, etc.
                    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Se domingo, volta 6 dias; senão, calcula para segunda
                    start = new Date(today);
                    start.setDate(today.getDate() + diffToMonday);
                    start.setHours(0, 0, 0, 0);
                    
                    end = new Date(start);
                    end.setDate(start.getDate() + 6); // Domingo da mesma semana
                    end.setHours(23, 59, 59, 999);
                  } else if (type === 'month') {
                    // Mês atual: primeiro ao último dia do mês atual
                    start = new Date(today.getFullYear(), today.getMonth(), 1);
                    end = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Último dia do mês
                    end.setHours(23, 59, 59, 999);
                  } else { // year
                    // Ano atual: primeiro dia do ano ao último dia do ano
                    start = new Date(today.getFullYear(), 0, 1); // 1º de janeiro
                    end = new Date(today.getFullYear(), 11, 31); // 31 de dezembro
                    end.setHours(23, 59, 59, 999);
                  }
                  
                  setStartDate(start.toISOString().split('T')[0]);
                  setEndDate(end.toISOString().split('T')[0]);
                  setSelectedCalendarDate(null);
                }}
              />
              <CalendarView 
                gigs={gigs} 
                selectedDate={selectedCalendarDate} 
                showValues={showValues}
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
              />
              <section className="space-y-4">
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
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-3 text-white">
                  <LayoutDashboard size={24} className="text-white" />
                  {isPeriodActive ? 'Filtro de Período' : (selectedCalendarDate ? 'Data Selecionada' : 'Minha Agenda')}
                </h2>
                {filteredGigs.length > 0 && !isPeriodActive && !selectedCalendarDate && (
                  <button
                    onClick={() => setIsClearConfirmOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 rounded-xl font-semibold text-sm transition-all"
                  >
                    <Trash2 size={16} />
                    Limpar Agenda
                  </button>
                )}
              </div>

              {filteredGigs.length === 0 ? (
                <div className="text-center py-32 bg-[#24272D]/20 border-2 border-dashed border-[#31333B]/50 rounded-3xl">
                  <Calendar className="text-white w-12 h-12 mx-auto mb-4" />
                  <h3 className="text-white text-lg font-medium">Nenhum evento registrado</h3>
                  <button onClick={() => { setSelectedCalendarDate(null); setStartDate(''); setEndDate(''); }} className="text-[#3057F2] text-sm font-bold mt-4 hover:underline">Ver tudo</button>
                </div>
              ) : (
                <GigList 
                  gigs={filteredGigs} 
                  onToggleStatus={toggleGigStatus} 
                  onDelete={handleDeleteGig}
                  onEdit={gig => { setEditingGig(gig); setIsModalOpen(true); }}
                  showValues={showValues}
                />
              )}
            </div>
          </div>
        )}
      </main>

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
          initialData={editingGig || (preSelectedDate ? {
            id: '',
            title: '',
            date: preSelectedDate,
            location: '',
            value: 0,
            status: GigStatus.PENDING,
            band_name: '',
            notes: ''
          } : null)}
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
      {isClearConfirmOpen && (
        <ConfirmModal
          isOpen={isClearConfirmOpen}
          onClose={() => setIsClearConfirmOpen(false)}
          onConfirm={handleClearAllGigs}
          title="Limpar Agenda"
          message="Tem certeza que deseja excluir TODOS os eventos da sua agenda? Esta ação não pode ser desfeita."
          confirmText="Sim, Limpar Tudo"
          cancelText="Cancelar"
          isDestructive={true}
        />
      )}
    </div>
  );
};

export default App;
