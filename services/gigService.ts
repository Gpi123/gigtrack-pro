import { supabase } from './supabase';
import { Gig, GigStatus, GigPersonalOverride } from '../types';
import { getCachedUser } from './authCache';
import { getCachedUserBands } from './bandsCache';

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
      // Agenda pessoal: buscar bandas primeiro (rápido, cache), depois gigs pessoais e de bandas EM PARALELO
      const step2Start = performance.now();
      const userBands = await getCachedUserBands(user.id);
      const step2Time = performance.now() - step2Start;
      const bandIds = userBands.map(band => band.id);
      
      console.log(`👥 [PERF] Step 2 - fetchUserBands - ${step2Time.toFixed(2)}ms`, {
        bandsCount: userBands.length,
        bandIds: bandIds.length
      });

      // Executar em paralelo: gigs pessoais + gigs de bandas (reduz tempo total)
      const bandGigsQuery =
        bandIds.length === 0
          ? Promise.resolve({ data: [] as Gig[], error: null })
          : bandIds.length === 1
            ? supabase
                .from('gigs')
                .select('*')
                .eq('band_id', bandIds[0])
                .order('date', { ascending: true })
            : supabase
                .from('gigs')
                .select('*')
                .in('band_id', bandIds)
                .order('date', { ascending: true });

      const [personalResult, bandGigsResult] = await Promise.all([
        supabase
          .from('gigs')
          .select('*')
          .is('band_id', null)
          .eq('user_id', user.id)
          .order('date', { ascending: true }),
        bandGigsQuery
      ]);

      const personalGigs = personalResult.data || [];
      const personalError = personalResult.error;
      const bandGigs = bandGigsResult.data || [];
      const bandGigsError = bandGigsResult.error;

      if (personalError) {
        console.error(`❌ [PERF] Erro na query de gigs pessoais:`, personalError);
        throw personalError;
      }
      if (bandGigsError) {
        console.error(`❌ [PERF] Erro na query de gigs de bandas:`, bandGigsError);
        throw bandGigsError;
      }

      console.log(`📊 [PERF] Queries paralelas - pessoais: ${personalGigs.length}, bandas: ${bandGigs.length}`);

      // 4. Aplicar overrides pessoais nos shows de banda e filtrar ocultos
      const step4Start = performance.now();
      const bandGigIds = bandGigs.map(g => g.id);
      let overrides: GigPersonalOverride[] = [];
      if (bandGigIds.length > 0) {
        const { data: overridesData } = await supabase
          .from('gig_personal_overrides')
          .select('*')
          .eq('user_id', user.id)
          .in('gig_id', bandGigIds);
        overrides = overridesData || [];
      }
      const hiddenGigIds = new Set(overrides.filter(o => o.hidden).map(o => o.gig_id));
      const overrideByGigId = new Map(overrides.filter(o => !o.hidden).map(o => [o.gig_id, o]));

      const bandGigsMerged: Gig[] = bandGigs
        .filter(g => !hiddenGigIds.has(g.id))
        .map(g => {
          const override = overrideByGigId.get(g.id);
          if (!override) return { ...g, personal_override_id: null };
          const merged: Gig = {
            ...g,
            title: override.title ?? g.title,
            value: override.value !== null && override.value !== undefined ? Number(override.value) : g.value,
            status: (override.status as GigStatus) ?? g.status,
            notes: override.notes ?? g.notes,
            personal_override_id: override.id
          };
          return merged;
        });

      const allGigs = [...(personalGigs || []), ...bandGigsMerged];
      const sortedGigs = allGigs.sort((a, b) => a.date.localeCompare(b.date));
      const step4Time = performance.now() - step4Start;

      console.log(`🔄 [PERF] Step 4 - Overrides e ordenar - ${step4Time.toFixed(2)}ms`, {
        totalCount: sortedGigs.length
      });

      const totalTime = performance.now() - startTime;
      console.log(`✅ [PERF] fetchGigs CONCLUÍDO (pessoal) - Total: ${totalTime.toFixed(2)}ms`, {
        breakdown: {
          auth: `${authTime.toFixed(2)}ms`,
          bands_cache: `${step2Time.toFixed(2)}ms`,
          parallel_queries: `${(totalTime - authTime - step2Time - step4Time).toFixed(2)}ms`,
          sort: `${step4Time.toFixed(2)}ms`,
          total: `${totalTime.toFixed(2)}ms`
        },
        counts: {
          personal: personalGigs.length,
          band: bandGigsMerged.length,
          total: sortedGigs.length
        }
      });

      return sortedGigs;
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

  // Update an existing gig ou override pessoal (quando na agenda pessoal, show da banda)
  updateGig: async (id: string, updates: Partial<Gig>, isPersonalOverride?: boolean): Promise<Gig> => {
    const user = await getCachedUser();
    if (!user) throw new Error('User not authenticated');

    if (isPersonalOverride) {
      const { data: existing } = await supabase
        .from('gig_personal_overrides')
        .select('id')
        .eq('user_id', user.id)
        .eq('gig_id', id)
        .single();
      const payload = {
        title: updates.title ?? null,
        value: updates.value ?? null,
        status: updates.status ?? null,
        notes: updates.notes ?? null,
        updated_at: new Date().toISOString()
      };
      if (existing) {
        const { data, error } = await supabase
          .from('gig_personal_overrides')
          .update(payload)
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        const { data: gig } = await supabase.from('gigs').select('*').eq('id', id).single();
        if (!gig) throw new Error('Show não encontrado');
        return { ...gig, title: payload.title ?? gig.title, value: payload.value != null ? Number(payload.value) : gig.value, status: (payload.status as GigStatus) ?? gig.status, notes: payload.notes ?? gig.notes, personal_override_id: data.id } as Gig;
      } else {
        const { data, error } = await supabase
          .from('gig_personal_overrides')
          .insert({ user_id: user.id, gig_id: id, ...payload })
          .select()
          .single();
        if (error) throw error;
        const { data: gig } = await supabase.from('gigs').select('*').eq('id', id).single();
        if (!gig) throw new Error('Show não encontrado');
        return { ...gig, title: payload.title ?? gig.title, value: payload.value != null ? Number(payload.value) : gig.value, status: (payload.status as GigStatus) ?? gig.status, notes: payload.notes ?? gig.notes, personal_override_id: data.id } as Gig;
      }
    }

    const { data, error } = await supabase
      .from('gigs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a gig ou esconder da agenda pessoal (override)
  deleteGig: async (id: string, isPersonalOverride?: boolean): Promise<void> => {
    const user = await getCachedUser();
    if (!user) throw new Error('User not authenticated');

    if (isPersonalOverride) {
      const { data: existing } = await supabase
        .from('gig_personal_overrides')
        .select('id')
        .eq('user_id', user.id)
        .eq('gig_id', id)
        .single();
      if (existing) {
        const { error } = await supabase
          .from('gig_personal_overrides')
          .update({ hidden: true, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('gig_personal_overrides')
          .insert({ user_id: user.id, gig_id: id, hidden: true });
        if (error) throw error;
      }
      return;
    }

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

  // Toggle gig status (ou do override na agenda pessoal)
  toggleGigStatus: async (id: string, currentStatus: GigStatus, isPersonalOverride?: boolean): Promise<Gig> => {
    const newStatus = currentStatus === GigStatus.PAID ? GigStatus.PENDING : GigStatus.PAID;
    return gigService.updateGig(id, { status: newStatus }, isPersonalOverride);
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
      // Para pessoal: escutar eventos pessoais E eventos de bandas do usuário
      // Buscar bandas do usuário uma vez para criar filtros específicos (usando cache)
      const userBands = await getCachedUserBands(user.id);
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
