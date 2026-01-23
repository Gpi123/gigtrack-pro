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

  // Delete all gigs for the current user
  deleteAllGigs: async (): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('gigs')
      .delete()
      .eq('user_id', user.id);

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
    
    const channel = supabase
      .channel(`gigs_changes_${bandId || 'personal'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gigs',
          filter: filter
        },
        async (payload) => {
          // Só recarregar se realmente necessário (evitar reloads desnecessários)
          // O callback será chamado apenas quando houver mudanças reais
          const gigs = await gigService.fetchGigs(bandId);
          callback(gigs);
        }
      )
      .subscribe();

    return channel;
  }
};
