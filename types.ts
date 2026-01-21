
export enum GigStatus {
  PENDING = 'PENDING',
  PAID = 'PAID'
}

export interface Gig {
  id: string;
  user_id?: string;
  title: string;
  date: string;
  location: string;
  value?: number;
  status: GigStatus;
  notes?: string;
  band_name?: string;
}

export interface FinancialStats {
  totalReceived: number;
  totalPending: number;
  overallTotal: number;
}
