// Cache de bandas para evitar múltiplas chamadas simultâneas
import { Band } from '../types';
import { bandService } from './bandService';

interface BandsCache {
  bands: Band[];
  timestamp: number;
  promise: Promise<Band[]> | null;
  userId: string | null;
  isRefreshing: boolean;
}

const CACHE_DURATION = 30000; // 30 segundos (aumentado para evitar loops)
let bandsCache: BandsCache = {
  bands: [],
  timestamp: 0,
  promise: null,
  userId: null,
  isRefreshing: false
};

export const getCachedUserBands = async (userId: string, forceRefresh = false): Promise<Band[]> => {
  const now = Date.now();
  
  // Se o usuário mudou, limpar cache
  if (bandsCache.userId !== userId) {
    bandsCache = {
      bands: [],
      timestamp: 0,
      promise: null,
      userId: userId,
      isRefreshing: false
    };
  }
  
  // Se temos um cache válido E não está forçando refresh, retornar imediatamente
  if (!forceRefresh && bandsCache.bands.length > 0 && (now - bandsCache.timestamp) < CACHE_DURATION) {
    console.log(`💾 [PERF] getCachedUserBands - Retornando do cache (${((now - bandsCache.timestamp) / 1000).toFixed(1)}s restantes)`);
    return bandsCache.bands;
  }
  
  // Se já há uma requisição em andamento, aguardar ela (evita múltiplas chamadas)
  if (bandsCache.promise && !forceRefresh) {
    console.log(`⏳ [PERF] getCachedUserBands - Aguardando requisição em andamento`);
    try {
      const bands = await bandsCache.promise;
      // Atualizar cache mesmo se estava aguardando
      bandsCache.bands = bands;
      bandsCache.timestamp = Date.now();
      return bands;
    } catch (error) {
      // Se deu erro, limpar promise para permitir nova tentativa
      bandsCache.promise = null;
      bandsCache.isRefreshing = false;
      throw error;
    }
  }
  
  // Criar nova requisição apenas se não estiver em refresh
  if (!bandsCache.isRefreshing || forceRefresh) {
    bandsCache.isRefreshing = true;
    bandsCache.promise = bandService.fetchUserBands();
    try {
      const bands = await bandsCache.promise;
      bandsCache.bands = bands;
      bandsCache.timestamp = Date.now();
      bandsCache.promise = null;
      bandsCache.isRefreshing = false;
      return bands;
    } catch (error) {
      bandsCache.promise = null;
      bandsCache.isRefreshing = false;
      throw error;
    }
  }
  
  // Fallback: retornar cache mesmo se expirado
  if (bandsCache.bands.length > 0) {
    console.log(`⚠️ [PERF] getCachedUserBands - Retornando cache expirado como fallback`);
    return bandsCache.bands;
  }
  
  // Último recurso: fazer nova requisição
  bandsCache.isRefreshing = true;
  bandsCache.promise = bandService.fetchUserBands();
  const bands = await bandsCache.promise;
  bandsCache.bands = bands;
  bandsCache.timestamp = Date.now();
  bandsCache.promise = null;
  bandsCache.isRefreshing = false;
  return bands;
};

export const clearBandsCache = () => {
  bandsCache = {
    bands: [],
    timestamp: 0,
    promise: null,
    userId: null,
    isRefreshing: false
  };
};

export const invalidateBandsCache = () => {
  // Invalidar apenas o timestamp, mas manter a promise se estiver em andamento
  // Isso evita múltiplas requisições simultâneas
  const wasRefreshing = bandsCache.isRefreshing;
  bandsCache.timestamp = 0;
  // Não limpar promise se estiver em andamento para evitar loops
  if (!wasRefreshing) {
    bandsCache.promise = null;
  }
};
