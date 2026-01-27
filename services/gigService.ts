import { supabase } from './supabase';
import { Gig, GigStatus } from '../types';
import { bandService } from './bandService';

export const gigService = {
  // Fetch all gigs for the current user or a specific band
  fetchGigs: async (bandId?: string | null): Promise<Gig[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    if (bandId) {
      // Buscar apenas gigs da banda específica
      const { data, error } = await supabase
        .from('gigs')
        .select('*')
        .eq('band_id', bandId)
        .order('date', { ascending: true });

      if (error) throw error;
      return data || [];
    } else {
      // Buscar gigs pessoais + gigs de todas as bandas do usuário
      // 1. Buscar gigs pessoais (band_id IS NULL)
      const { data: personalGigs, error: personalError } = await supabase
        .from('gigs')
        .select('*')
        .is('band_id', null)
        .eq('user_id', user.id);

      if (personalError) throw personalError;

      // 2. Buscar todas as bandas do usuário
      const userBands = await bandService.fetchUserBands();
      const bandIds = userBands.map(band => band.id);

      // 3. Buscar gigs de todas as bandas do usuário
      let bandGigs: Gig[] = [];
      if (bandIds.length > 0) {
        const { data: bandGigsData, error: bandGigsError } = await supabase
          .from('gigs')
          .select('*')
          .in('band_id', bandIds)
          .order('date', { ascending: true });

        if (bandGigsError) throw bandGigsError;
        bandGigs = bandGigsData || [];
      }

      // 4. Combinar e ordenar
      const allGigs = [...(personalGigs || []), ...bandGigs];
      return allGigs.sort((a, b) => a.date.localeCompare(b.date));
    }
  },

  // Create a new gig
  createGig: async (gig: Omit<Gig, 'id' | 'user_id'>, bandId?: string | null): Promise<Gig> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Ensure date is sent as a string in YYYY-MM-DD format (no timezone conversion)
    const gigData = {
      ...gig,
      date: gig.date, // Keep as string - PostgreSQL DATE type doesn't have timezone
      user_id: user.id,
      band_id: bandId || null, // NULL = pessoal, UUID = banda
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

  // Update an existing gig
  updateGig: async (id: string, updates: Partial<Gig>): Promise<Gig> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // RLS garante que só atualiza gigs que o usuário pode editar (próprios ou da banda)
    const { data, error } = await supabase
      .from('gigs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a gig
  deleteGig: async (id: string): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // RLS garante que só deleta gigs que o usuário pode deletar (próprios ou da banda)
    const { error } = await supabase
      .from('gigs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Delete all gigs for the current user (only personal gigs, not band gigs)
  deleteAllGigs: async (bandId?: string | null): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
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
    const { data: { user } } = await supabase.auth.getUser();
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
      // Para pessoal: escutar eventos pessoais E eventos de bandas do usuário
      // Buscar bandas do usuário uma vez para criar filtros específicos
      const userBands = await bandService.fetchUserBands();
      const userBandIds = userBands.map(b => b.id);
      
      // Cache das bandas para uso rápido na verificação
      const bandIdsSet = new Set(userBandIds);
      
      // Escutar eventos pessoais do usuário
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
          
          // Verificar se é evento pessoal (band_id IS NULL)
          const isPersonal = (newGig && newGig.band_id === null) || (oldGig && oldGig.band_id === null);
          
          if (!isPersonal) {
            // Não é evento pessoal, ignorar (será capturado pela subscription de bandas)
            return;
          }
          
          console.log('🎵 Realtime event (personal gig):', payload.eventType);
          
          // Recarregar dados atualizados do banco
          try {
            const gigs = await gigService.fetchGigs(null);
            console.log('✅ Recarregados', gigs.length, 'gigs na agenda pessoal após evento pessoal');
            callback(gigs);
          } catch (error) {
            console.error('❌ Erro ao recarregar gigs após mudança realtime:', error);
          }
        }
      );
      
      // Escutar eventos de todas as bandas do usuário
      // Criar uma subscription para cada banda para melhor performance
      if (userBandIds.length > 0) {
        userBandIds.forEach(bandIdToListen => {
          channel.on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'gigs',
              filter: `band_id=eq.${bandIdToListen}`
            },
            async (payload) => {
              console.log('🎵 Realtime event (band gig in personal):', payload.eventType, {
                bandId: bandIdToListen,
                new: payload.new,
                old: payload.old
              });
              
              // Recarregar dados atualizados do banco
              try {
                const gigs = await gigService.fetchGigs(null);
                console.log('✅ Recarregados', gigs.length, 'gigs na agenda pessoal após evento de banda');
                callback(gigs);
              } catch (error) {
                console.error('❌ Erro ao recarregar gigs após mudança realtime:', error);
              }
            }
          );
        });
      }
    }
    
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`✅ Subscribed to realtime changes for ${bandId || 'personal'} agenda`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Erro na subscription de realtime:', status);
      } else {
        console.log('🔄 Subscription status:', status);
      }
    });

    return channel;
  }
};
