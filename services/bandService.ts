import { supabase } from './supabase';
import { Band, BandMember, BandInvite } from '../types';

export const bandService = {
  // Criar uma nova banda
  createBand: async (name: string, description?: string): Promise<Band> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: band, error: bandError } = await supabase
      .from('bands')
      .insert({
        name,
        description,
        owner_id: user.id
      })
      .select()
      .single();

    if (bandError) throw bandError;

    // Adicionar o owner como membro
    await supabase
      .from('band_members')
      .insert({
        band_id: band.id,
        user_id: user.id,
        role: 'owner'
      });

    return band;
  },

  // Buscar todas as bandas do usuário
  fetchUserBands: async (): Promise<Band[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('bands')
      .select('*')
      .or(`owner_id.eq.${user.id},id.in.(select band_id from band_members where user_id.eq.${user.id})`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Buscar membros de uma banda
  fetchBandMembers: async (bandId: string): Promise<BandMember[]> => {
    const { data, error } = await supabase
      .from('band_members')
      .select(`
        *,
        profile:profiles!band_members_user_id_fkey(id, email, full_name, avatar_url)
      `)
      .eq('band_id', bandId)
      .order('joined_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Convidar usuário por email
  inviteUser: async (bandId: string, email: string): Promise<BandInvite> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Gerar token único
    const token = btoa(`${bandId}:${email}:${Date.now()}`).replace(/[^a-zA-Z0-9]/g, '');
    
    // Expira em 7 dias
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data, error } = await supabase
      .from('band_invites')
      .insert({
        band_id: bandId,
        email: email.toLowerCase().trim(),
        invited_by: user.id,
        token,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Buscar convites pendentes de uma banda
  fetchBandInvites: async (bandId: string): Promise<BandInvite[]> => {
    const { data, error } = await supabase
      .from('band_invites')
      .select('*')
      .eq('band_id', bandId)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Aceitar convite
  acceptInvite: async (token: string): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Buscar convite
    const { data: invite, error: inviteError } = await supabase
      .from('band_invites')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single();

    if (inviteError) throw new Error('Convite inválido ou expirado');

    // Verificar se expirou
    if (new Date(invite.expires_at) < new Date()) {
      throw new Error('Convite expirado');
    }

    // Verificar se email corresponde
    if (invite.email.toLowerCase() !== user.email?.toLowerCase()) {
      throw new Error('Este convite não é para o seu email');
    }

    // Adicionar como membro
    const { error: memberError } = await supabase
      .from('band_members')
      .insert({
        band_id: invite.band_id,
        user_id: user.id,
        role: 'member'
      });

    if (memberError) {
      // Se já é membro, apenas atualizar o convite
      if (memberError.code === '23505') {
        await supabase
          .from('band_invites')
          .update({ status: 'accepted' })
          .eq('id', invite.id);
        return;
      }
      throw memberError;
    }

    // Atualizar status do convite
    await supabase
      .from('band_invites')
      .update({ status: 'accepted' })
      .eq('id', invite.id);
  },

  // Remover membro da banda
  removeMember: async (bandId: string, userId: string): Promise<void> => {
    const { error } = await supabase
      .from('band_members')
      .delete()
      .eq('band_id', bandId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  // Deletar banda
  deleteBand: async (bandId: string): Promise<void> => {
    const { error } = await supabase
      .from('bands')
      .delete()
      .eq('id', bandId);

    if (error) throw error;
  },

  // Verificar convites pendentes do usuário atual
  checkPendingInvites: async (): Promise<BandInvite[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('band_invites')
      .select('*, band:bands!band_invites_band_id_fkey(id, name)')
      .eq('email', user.email?.toLowerCase() || '')
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};
