
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, LayoutDashboard, Calendar, DollarSign, BrainCircuit, Menu, Eye, EyeOff, Cloud, Loader2, User, Upload } from 'lucide-react';
import { Gig, GigStatus, FinancialStats } from './types';
import { getMusicianInsights } from './services/geminiService';
import { gigService } from './services/gigService';
import { importService } from './services/importService';
import { authService, UserProfile } from './services/authService';
import { User as SupabaseUser } from '@supabase/supabase-js';
import GigModal from './components/GigModal';
import AuthModal from './components/AuthModal';
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
  const [editingGig, setEditingGig] = useState<Gig | null>(null);
  const [preSelectedDate, setPreSelectedDate] = useState<string | null>(null);
  const [insights, setInsights] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [selectedGigIds, setSelectedGigIds] = useState<Set<string>>(new Set());
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
      <div className="min-h-screen bg-[#1E1F25] text-slate-200 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-[#3057F2] p-4 rounded-2xl inline-block mb-4">
              <Calendar className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">GigTrack <span className="text-[#3057F2]">Pro</span></h1>
            <p className="text-slate-400">Sua agenda de shows profissional</p>
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
    <div className="min-h-screen pb-20 md:pb-8 bg-slate-950 text-slate-200">
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
            <button onClick={() => setIsMenuOpen(true)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
              <div className="bg-slate-700 p-2 rounded-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white hidden sm:block">GigTrack <span className="text-slate-400">Pro</span></h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {isSyncing && <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 animate-pulse bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700"><Cloud size={12}/> SYNC...</div>}
            {isImporting && <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 animate-pulse bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700"><Upload size={12}/> IMPORTANDO...</div>}
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
              className="p-2 hover:bg-[#24272D] rounded-lg text-slate-400 transition-colors disabled:opacity-50"
              title="Importar Excel/CSV"
            >
              <Upload size={20} />
            </button>
            <button 
              onClick={() => setIsAuthModalOpen(true)} 
              className="p-2 hover:bg-[#24272D] rounded-lg text-slate-400 transition-colors"
              title="Minha Conta"
            >
              <User size={20} className="text-slate-300" />
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
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Carregando...</p>
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
                  let end: Date = new Date(today);
                  
                  if (type === 'week') {
                    start = new Date(today);
                    start.setDate(today.getDate() - 7);
                  } else if (type === 'month') {
                    start = new Date(today);
                    start.setMonth(today.getMonth() - 1);
                  } else { // year
                    start = new Date(today);
                    start.setFullYear(today.getFullYear() - 1);
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
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Resumo Financeiro</h3>
                  <button onClick={() => setShowValues(!showValues)} className={`p-1.5 rounded-lg border transition-all ${showValues ? 'bg-[#24272D] border-[#31333B] text-slate-400' : 'bg-[#3057F2]/10 border-[#3057F2]/20 text-[#3057F2]'}`}>
                    {showValues ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                </div>
                <SummaryCards stats={stats} showValues={showValues} />
              </section>
            </div>

            <div className="lg:col-span-8">
              <h2 className="text-2xl font-bold flex items-center gap-3 text-white mb-8">
                <LayoutDashboard size={24} className="text-slate-400" />
                {isPeriodActive ? 'Filtro de Período' : (selectedCalendarDate ? 'Data Selecionada' : 'Minha Agenda')}
              </h2>

              {filteredGigs.length === 0 ? (
                <div className="text-center py-32 bg-[#24272D]/20 border-2 border-dashed border-[#31333B]/50 rounded-3xl">
                  <Calendar className="text-slate-600 w-12 h-12 mx-auto mb-4" />
                  <h3 className="text-slate-300 text-lg font-medium">Nenhum evento registrado</h3>
                  <button onClick={() => { setSelectedCalendarDate(null); setStartDate(''); setEndDate(''); }} className="text-indigo-400 text-sm font-bold mt-4 hover:underline">Ver tudo</button>
                </div>
              ) : (
                <GigList 
                  gigs={filteredGigs} 
                  onToggleStatus={toggleGigStatus} 
                  onDelete={handleDeleteGig}
                  onEdit={gig => { setEditingGig(gig); setIsModalOpen(true); }}
                  selectedGigIds={selectedGigIds}
                  onToggleSelect={id => setSelectedGigIds(prev => { const n = new Set(prev); if(n.has(id)) n.delete(id); else n.add(id); return n; })}
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
    </div>
  );
};

export default App;
