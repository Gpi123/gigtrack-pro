// Cache de autenticação para evitar múltiplas chamadas simultâneas
import { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AuthCache {
  user: User | null;
  timestamp: number;
  promise: Promise<{ data: { user: User | null } }> | null;
}

const CACHE_DURATION = 5000; // 5 segundos
let authCache: AuthCache = {
  user: null,
  timestamp: 0,
  promise: null
};

export const getCachedUser = async (): Promise<User | null> => {
  const now = Date.now();
  
  // Se temos um cache válido, retornar imediatamente
  if (authCache.user && (now - authCache.timestamp) < CACHE_DURATION) {
    return authCache.user;
  }
  
  // Se já há uma requisição em andamento, aguardar ela
  if (authCache.promise) {
    const result = await authCache.promise;
    authCache.user = result.data.user;
    authCache.timestamp = now;
    authCache.promise = null;
    return authCache.user;
  }
  
  // Criar nova requisição
  authCache.promise = supabase.auth.getUser();
  try {
    const result = await authCache.promise;
    authCache.user = result.data.user;
    authCache.timestamp = now;
    authCache.promise = null;
    return authCache.user;
  } catch (error) {
    authCache.promise = null;
    throw error;
  }
};

export const clearAuthCache = () => {
  authCache = {
    user: null,
    timestamp: 0,
    promise: null
  };
};

// Limpar cache quando usuário fizer logout
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      clearAuthCache();
    }
  });
}
