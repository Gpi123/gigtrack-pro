// Cache de bandas para evitar múltiplas chamadas simultâneas
import { Band } from '../types';
import { bandService } from './bandService';

interface BandsCache {
  bands: Band[];
  timestamp: number;
  promise: Promise<Band[]> | null;
  userId: string | null;
}

const CACHE_DURATION = 10000; // 10 segundos
let bandsCache: BandsCache = {
  bands: [],
  timestamp: 0,
  promise: null,
  userId: null
};

export const getCachedUserBands = async (userId: string): Promise<Band[]> => {
  const now = Date.now();
  
  // Se o usuário mudou, limpar cache
  if (bandsCache.userId !== userId) {
    bandsCache = {
      bands: [],
      timestamp: 0,
      promise: null,
      userId: userId
    };
  }
  
  // Se temos um cache válido, retornar imediatamente
  if (bandsCache.bands.length > 0 && (now - bandsCache.timestamp) < CACHE_DURATION) {
    return bandsCache.bands;
  }
  
  // Se já há uma requisição em andamento, aguardar ela
  if (bandsCache.promise) {
    const bands = await bandsCache.promise;
    bandsCache.bands = bands;
    bandsCache.timestamp = now;
    bandsCache.promise = null;
    return bands;
  }
  
  // Criar nova requisição
  bandsCache.promise = bandService.fetchUserBands();
  try {
    const bands = await bandsCache.promise;
    bandsCache.bands = bands;
    bandsCache.timestamp = now;
    bandsCache.promise = null;
    return bands;
  } catch (error) {
    bandsCache.promise = null;
    throw error;
  }
};

export const clearBandsCache = () => {
  bandsCache = {
    bands: [],
    timestamp: 0,
    promise: null,
    userId: null
  };
};

export const invalidateBandsCache = () => {
  bandsCache.timestamp = 0;
  bandsCache.promise = null;
};
