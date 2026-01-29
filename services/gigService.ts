import { supabase } from './supabase';
import { Gig, GigStatus } from '../types';
import { getCachedUser } from './authCache';

export const gigService = {
  // Fetch all gigs for the current user or a specific band
  fetchGigs: async (bandId?: string | null): Promise<Gig[]> => {
    const startTime = performance.now();
    console.log(`🔍 [PERF] fetchGigs INICIADO - bandId: ${bandId || 'null (pessoal)'}`, {
      timestamp: new Date().toISOString()
    });

    const authStart = performance.now();
    const user = await getCachedUser();
    const authTime = performance.now() - authStart;
    console.log(`🔐 [PERF] Auth.getUser() (cached) - ${authTime.toFixed(2)}ms`);

    if (!user) throw new Error('User not authenticated');

    if (bandId) {
      // Buscar apenas gigs da banda específica
      const queryStart = performance.now();
      const { data, error } = await supabase
        .from('gigs')
        .select('*')
        .eq('band_id', bandId)
        .order('date', { ascending: true });
      const queryTime = performance.now() - queryStart;
      
      console.log(`📊 [PERF] Query gigs por banda - ${queryTime.toFixed(2)}ms`, {
        bandId,
        count: data?.length || 0,
        queryTime: `${queryTime.toFixed(2)}ms`
      });

      if (error) {
        console.error(`❌ [PERF] Erro na query de gigs por banda:`, error);
        throw error;
      }

      const totalTime = performance.now() - startTime;
      console.log(`✅ [PERF] fetchGigs CONCLUÍDO (banda) - Total: ${totalTime.toFixed(2)}ms`, {
        bandId,
        count: data?.length || 0,
        breakdown: {
          auth: `${authTime.toFixed(2)}ms`,
          query: `${queryTime.toFixed(2)}ms`,
          total: `${totalTime.toFixed(2)}ms`
        }
      });

      return data || [];
    } else {
      // Agenda pessoal: apenas gigs próprios (user_id=me, band_id=null).
      // Shows da banda que o owner criou geram cópia automática para cada membro (trigger 017), então o membro vê só seus gigs.
      const queryStart = performance.now();
      const { data, error } = await supabase
        .from('gigs')
        .select('*')
        .eq('user_id', user.id)
        .is('band_id', null)
        .order('date', { ascending: true });
      const queryTime = performance.now() - queryStart;

      if (error) {
        console.error(`❌ [PERF] Erro na query de gigs pessoais:`, error);
        throw error;
      }

      const totalTime = performance.now() - startTime;
      console.log(`✅ [PERF] fetchGigs CONCLUÍDO (pessoal) - Total: ${totalTime.toFixed(2)}ms`, {
        count: (data || []).length,
        breakdown: { auth: `${authTime.toFixed(2)}ms`, query: `${queryTime.toFixed(2)}ms`, total: `${totalTime.toFixed(2)}ms` }
      });

      return data || [];
    }
  },

  // Create a new gig (apenas owner pode criar show na agenda da banda)
  createGig: async (gig: Omit<Gig, 'id' | 'user_id'>, bandId?: string | null): Promise<Gig> => {
    const user = await getCachedUser();
    if (!user) throw new Error('User not authenticated');

    if (bandId) {
      const { data: band } = await supabase.from('bands').select('owner_id').eq('id', bandId).single();
      if (!band || band.owner_id !== user.id) {
        throw new Error('Apenas o proprietário da banda pode criar shows na agenda da banda.');
      }
    }

    const gigData = {
      ...gig,
      date: gig.date,
      user_id: user.id,
      band_id: bandId || null,
      status: gig.status || GigStatus.PENDING
    };

    const { data, error } = await supabase
      .from('gigs')
      .insert(gigData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update an existing gig (agenda pessoal = gig próprio; agenda banda = só owner)
  updateGig: async (id: string, updates: Partial<Gig>): Promise<Gig> => {
    const user = await getCachedUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('gigs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a gig (agenda pessoal = gig próprio; agenda banda = só owner)
  deleteGig: async (id: string): Promise<void> => {
    const user = await getCachedUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('gigs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Delete all gigs for the current user (only personal gigs, not band gigs)
  deleteAllGigs: async (bandId?: string | null): Promise<void> => {
    const user = await getCachedUser();
    if (!user) throw new Error('User not authenticated');

    let query = supabase
      .from('gigs')
      .delete()
      .eq('user_id', user.id);

    if (bandId) {
      // Se bandId fornecido, deletar apenas shows da banda
      query = query.eq('band_id', bandId);
    } else {
      // Se não fornecido, deletar apenas shows pessoais
      query = query.is('band_id', null);
    }

    const { error } = await query;
    if (error) throw error;
  },

  // Toggle gig status
  toggleGigStatus: async (id: string, currentStatus: GigStatus): Promise<Gig> => {
    const newStatus = currentStatus === GigStatus.PAID ? GigStatus.PENDING : GigStatus.PAID;
    return gigService.updateGig(id, { status: newStatus });
  },

  // Subscribe to real-time changes
  subscribeToGigs: async (callback: (gigs: Gig[]) => void, bandId?: string | null) => {
    const user = await getCachedUser();
    if (!user) return null;
    
    // Criar filtro baseado no contexto (pessoal ou banda)
    const channelName = `gigs_changes_${bandId || 'personal'}_${user.id}_${Date.now()}`;
    
    const channel = supabase
      .channel(channelName);
    
    if (bandId) {
      // Para bandas: escutar todos os eventos onde band_id = bandId
      channel.on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'gigs',
          filter: `band_id=eq.${bandId}`
        },
        async (payload) => {
          console.log('🎵 Realtime event (band):', payload.eventType, {
            new: payload.new,
            old: payload.old,
            bandId: payload.new?.band_id || payload.old?.band_id
          });
          
          // Verificar se o evento é realmente da banda correta
          const eventBandId = payload.new?.band_id || payload.old?.band_id;
          if (eventBandId !== bandId) {
            console.log('⚠️ Evento ignorado - banda diferente:', eventBandId, 'vs', bandId);
            return;
          }
          
          // Recarregar dados atualizados do banco
          try {
            const gigs = await gigService.fetchGigs(bandId);
            console.log('✅ Recarregados', gigs.length, 'gigs após evento realtime');
            callback(gigs);
          } catch (error) {
            console.error('❌ Erro ao recarregar gigs após mudança realtime:', error);
          }
        }
      );
    } else {
      // Para pessoal: apenas gigs próprios (user_id=me, band_id=null); trigger 017 cria cópias para membros
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gigs',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          const newGig = payload.new as Gig | null;
          const oldGig = payload.old as Gig | null;
          const isPersonal = (newGig && newGig.band_id === null) || (oldGig && oldGig.band_id === null);
          if (!isPersonal) return;

          console.log('🎵 Realtime event (personal gig):', payload.eventType);
          try {
            const gigs = await gigService.fetchGigs(null);
            callback(gigs);
          } catch (error) {
            console.error('❌ Erro ao recarregar gigs após mudança realtime:', error);
          }
        }
      );
    }
    
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`✅ Subscribed to realtime changes for ${bandId || 'personal'} agenda`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Erro na subscription de realtime:', status);
      } else if (status === 'CLOSED') {
        console.warn('⚠️ Subscription fechada inesperadamente para', bandId || 'personal');
        // Não logar CLOSED como info normal, apenas como warning se for inesperado
      } else {
        // Logar outros status apenas em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Subscription status:', status);
        }
      }
    });

    return channel;
  }
};
