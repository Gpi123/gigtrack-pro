
import { Gig } from "../types";

// Usamos keyvalue.xyz que é extremamente simples e permite chaves customizadas (PINs numéricos)
const API_BASE = "https://api.keyvalue.xyz";
// Um sufixo para evitar colisões com outros usuários do serviço público
const APP_SUFFIX = "_gtpro";

export interface SyncPackage {
  lastModified: number;
  gigs: Gig[];
}

export const syncService = {
  // Gera um PIN aleatório de 6 dígitos
  generateNumericId: (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  createCloudStorage: async (gigs: Gig[]): Promise<string> => {
    const syncId = syncService.generateNumericId();
    const pkg: SyncPackage = {
      lastModified: Date.now(),
      gigs: gigs || []
    };
    
    try {
      // No keyvalue.xyz, basta fazer um POST para a URL com o ID
      // Não usamos headers complexos para evitar Preflight CORS errors
      const response = await fetch(`${API_BASE}/${syncId}${APP_SUFFIX}`, {
        method: 'POST',
        body: JSON.stringify(pkg)
      });
      
      if (!response.ok) throw new Error("Servidor recusou a criação");
      return syncId;
    } catch (error) {
      console.error("Cloud Create Error:", error);
      throw error;
    }
  },

  updateCloudData: async (syncId: string, gigs: Gig[]): Promise<number> => {
    if (!syncId || syncId.length < 5) return 0;
    
    const lastModified = Date.now();
    const pkg: SyncPackage = {
      lastModified,
      gigs: gigs || []
    };
    
    try {
      const response = await fetch(`${API_BASE}/${syncId}${APP_SUFFIX}`, {
        method: 'POST',
        body: JSON.stringify(pkg)
      });
      
      if (!response.ok) throw new Error("Falha ao atualizar");
      return lastModified;
    } catch (error) {
      console.error("Sync Update Error:", error);
      return 0;
    }
  },

  fetchCloudData: async (syncId: string): Promise<SyncPackage | null> => {
    if (!syncId || syncId.length < 5) return null;
    
    try {
      const response = await fetch(`${API_BASE}/${syncId}${APP_SUFFIX}`, {
        method: 'GET',
        cache: 'no-store'
      });
      
      if (!response.ok) return null;
      const data = await response.json();
      
      if (data && typeof data === 'object' && Array.isArray(data.gigs)) {
        return data as SyncPackage;
      }
      return null;
    } catch (error) {
      console.error("Fetch Cloud Error:", error);
      return null;
    }
  }
};
