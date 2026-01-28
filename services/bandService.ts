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
    const startTime = performance.now();
    console.log(`🔍 [PERF] fetchUserBands INICIADO`, {
      timestamp: new Date().toISOString()
    });

    const authStart = performance.now();
    const { data: { user } } = await supabase.auth.getUser();
    const authTime = performance.now() - authStart;
    console.log(`🔐 [PERF] fetchUserBands - Auth.getUser() - ${authTime.toFixed(2)}ms`);

    if (!user) throw new Error('User not authenticated');

    // Buscar bandas onde o usuário é owner
    const query1Start = performance.now();
    const { data: ownedBands, error: ownedError } = await supabase
      .from('bands')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });
    const query1Time = performance.now() - query1Start;
    
    console.log(`📊 [PERF] fetchUserBands - Query bandas próprias - ${query1Time.toFixed(2)}ms`, {
      count: ownedBands?.length || 0
    });

    if (ownedError) {
      console.error(`❌ [PERF] Erro ao buscar bandas próprias:`, ownedError);
      throw ownedError;
    }

    // Buscar bandas onde o usuário é membro
    const query2Start = performance.now();
    const { data: memberBands, error: memberError } = await supabase
      .from('band_members')
      .select('band_id, bands(*)')
      .eq('user_id', user.id);
    const query2Time = performance.now() - query2Start;
    
    console.log(`📊 [PERF] fetchUserBands - Query bandas como membro - ${query2Time.toFixed(2)}ms`, {
      count: memberBands?.length || 0
    });

    if (memberError) {
      console.error(`❌ [PERF] Erro ao buscar bandas como membro:`, memberError);
      throw memberError;
    }

    // Combinar e remover duplicatas
    const combineStart = performance.now();
    const allBands: Band[] = [];
    const bandIds = new Set<string>();

    // Adicionar bandas próprias
    if (ownedBands) {
      ownedBands.forEach(band => {
        if (!bandIds.has(band.id)) {
          bandIds.add(band.id);
          allBands.push(band);
        }
      });
    }

    // Adicionar bandas onde é membro
    if (memberBands) {
      memberBands.forEach((item: any) => {
        if (item.bands && !bandIds.has(item.bands.id)) {
          bandIds.add(item.bands.id);
          allBands.push(item.bands);
        }
      });
    }

    // Ordenar por created_at
    const sortedBands = allBands.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const combineTime = performance.now() - combineStart;
    
    const totalTime = performance.now() - startTime;
    console.log(`✅ [PERF] fetchUserBands CONCLUÍDO - Total: ${totalTime.toFixed(2)}ms`, {
      breakdown: {
        auth: `${authTime.toFixed(2)}ms`,
        query1_owned: `${query1Time.toFixed(2)}ms`,
        query2_member: `${query2Time.toFixed(2)}ms`,
        combine: `${combineTime.toFixed(2)}ms`,
        total: `${totalTime.toFixed(2)}ms`
      },
      counts: {
        owned: ownedBands?.length || 0,
        member: memberBands?.length || 0,
        total: sortedBands.length
      }
    });

    return sortedBands;
  },

  // Buscar membros de uma banda
  fetchBandMembers: async (bandId: string): Promise<BandMember[]> => {
    const { data: members, error: membersError } = await supabase
      .from('band_members')
      .select('*')
      .eq('band_id', bandId)
      .order('joined_at', { ascending: true });

    if (membersError) throw membersError;
    if (!members || members.length === 0) return [];

    // Buscar perfis dos membros
    const userIds = members.map(m => m.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url')
      .in('id', userIds);

    if (profilesError) throw profilesError;

    // Combinar membros com perfis
    return members.map(member => ({
      ...member,
      profile: profiles?.find(p => p.id === member.user_id) || undefined
    })) as BandMember[];
  },

  // Convidar usuário por email
  inviteUser: async (bandId: string, email: string): Promise<BandInvite> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Verificar se o usuário tem permissão (owner ou member da banda)
    const { data: band, error: bandError } = await supabase
      .from('bands')
      .select('id, owner_id')
      .eq('id', bandId)
      .single();

    if (bandError) throw new Error(`Banda não encontrada: ${bandError.message}`);
    
    // Verificar se é owner
    const isOwner = band.owner_id === user.id;
    
    // Verificar se é member
    const { data: member } = await supabase
      .from('band_members')
      .select('role')
      .eq('band_id', bandId)
      .eq('user_id', user.id)
      .single();

    if (!isOwner && !member) {
      throw new Error('Você não tem permissão para convidar membros desta banda');
    }

    // Gerar token único
    const token = btoa(`${bandId}:${email}:${Date.now()}`).replace(/[^a-zA-Z0-9]/g, '');
    
    // Expira em 7 dias
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Se email estiver vazio, usar string vazia (permite qualquer usuário aceitar)
    const emailValue = email && email.trim() ? email.toLowerCase().trim() : '';
    
    const { data, error } = await supabase
      .from('band_invites')
      .insert({
        band_id: bandId,
        email: emailValue,
        invited_by: user.id,
        token,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar convite:', error);
      throw new Error(`Erro ao criar convite: ${error.message}. Verifique se você tem permissão.`);
    }

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
  acceptInvite: async (token: string): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Buscar convite
    const { data: invite, error: inviteError } = await supabase
      .from('band_invites')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single();

    if (inviteError) {
      console.error('Erro ao buscar convite:', inviteError);
      // Melhorar mensagem de erro
      if (inviteError.code === 'PGRST116') {
        throw new Error('Convite não encontrado. Verifique se o link está correto.');
      }
      throw new Error(`Convite inválido ou expirado: ${inviteError.message}`);
    }

    if (!invite) {
      throw new Error('Convite não encontrado');
    }

    // Verificar se expirou
    if (new Date(invite.expires_at) < new Date()) {
      throw new Error('Convite expirado');
    }

    // Verificar se email corresponde (apenas se o convite tiver email específico)
    // Se o email do convite estiver vazio, permite qualquer usuário aceitar
    if (invite.email && invite.email.trim() !== '' && invite.email.toLowerCase() !== user.email?.toLowerCase()) {
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
        return invite.band_id;
      }
      throw memberError;
    }

    // Atualizar status do convite
    await supabase
      .from('band_invites')
      .update({ status: 'accepted' })
      .eq('id', invite.id);

    // Retornar o band_id para selecionar automaticamente
    return invite.band_id;
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

  // Atualizar banda
  updateBand: async (bandId: string, updates: { name?: string; description?: string }): Promise<Band> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Verificar se é owner
    const { data: band, error: bandError } = await supabase
      .from('bands')
      .select('owner_id')
      .eq('id', bandId)
      .single();

    if (bandError) throw bandError;
    if (band.owner_id !== user.id) {
      throw new Error('Apenas o dono da banda pode atualizá-la');
    }

    const { data, error } = await supabase
      .from('bands')
      .update(updates)
      .eq('id', bandId)
      .select()
      .single();

    if (error) throw error;
    return data;
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
    if (!user || !user.email) return [];

    // Buscar perfil para garantir que temos o email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.email) return [];

    const { data, error } = await supabase
      .from('band_invites')
      .select('*, band:bands!band_invites_band_id_fkey(id, name)')
      .eq('email', profile.email.toLowerCase())
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};
