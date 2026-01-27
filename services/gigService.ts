import { supabase } from './supabase';
import { Gig, GigStatus } from '../types';

export const gigService = {
  // Fetch all gigs for the current user or a specific band
  fetchGigs: async (bandId?: string | null): Promise<Gig[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    let query = supabase
      .from('gigs')
      .select('*');

    if (bandId) {
      // Buscar gigs da banda
      query = query.eq('band_id', bandId);
    } else {
      // Buscar gigs pessoais (band_id IS NULL)
      query = query.is('band_id', null).eq('user_id', user.id);
    }

    const { data, error } = await query.order('date', { ascending: true });

    if (error) throw error;
    return data || [];
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
    const filter = bandId 
      ? `band_id=eq.${bandId}`
      : `user_id=eq.${user.id}.and(band_id.is.null)`;
    
    const channelName = `gigs_changes_${bandId || 'personal'}_${Date.now()}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'gigs',
          filter: filter
        },
        async (payload) => {
          console.log('Realtime event:', payload.eventType, payload.new || payload.old);
          
          // Recarregar dados atualizados do banco
          try {
            const gigs = await gigService.fetchGigs(bandId);
            callback(gigs);
          } catch (error) {
            console.error('Erro ao recarregar gigs após mudança realtime:', error);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to realtime changes for ${bandId || 'personal'} agenda`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Erro na subscription de realtime');
        }
      });

    return channel;
  }
};
