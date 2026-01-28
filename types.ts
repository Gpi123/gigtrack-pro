
export enum GigStatus {
  PENDING = 'PENDING',
  PAID = 'PAID'
}

export interface Gig {
  id: string;
  user_id?: string;
  band_id?: string | null; // NULL = agenda pessoal, UUID = agenda da banda
  title: string;
  date: string;
  location: string;
  value?: number;
  status: GigStatus;
  notes?: string;
  band_name?: string;
  /** Quando na agenda pessoal, se o show é da banda e o membro tem override, id do override para update/delete */
  personal_override_id?: string | null;
}

/** Override pessoal de um show da banda na agenda pessoal do membro */
export interface GigPersonalOverride {
  id: string;
  user_id: string;
  gig_id: string;
  title?: string | null;
  value?: number | null;
  status?: GigStatus | null;
  notes?: string | null;
  hidden: boolean;
  created_at: string;
  updated_at: string;
}

export interface FinancialStats {
  totalReceived: number;
  totalPending: number;
  overallTotal: number;
}

// Tipos para sistema de bandas
export interface Band {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface BandMember {
  id: string;
  band_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  profile?: {
    id: string;
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface BandInvite {
  id: string;
  band_id: string;
  email: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  token: string;
  expires_at: string;
  created_at: string;
}
