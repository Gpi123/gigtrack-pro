// Cache de autenticação: getSession() primeiro (rápido, memória) e getUser() só quando necessário
import { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AuthCache {
  user: User | null;
  timestamp: number;
  promise: Promise<{ data: { user: User | null } }> | null;
}

const CACHE_DURATION = 30_000; // 30 segundos (getSession é rápido; getUser só quando session ausente)
let authCache: AuthCache = {
  user: null,
  timestamp: 0,
  promise: null
};

export const getCachedUser = async (): Promise<User | null> => {
  const now = Date.now();
  
  // Cache em memória válido: retornar imediatamente
  if (authCache.user && (now - authCache.timestamp) < CACHE_DURATION) {
    return authCache.user;
  }
  
  // Rápido: ler sessão da memória/storage (sem rede). Só chamar getUser() se não houver sessão.
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      authCache.user = session.user;
      authCache.timestamp = now;
      return session.user;
    }
  } catch (_) {
    // getSession falhou, seguir para getUser()
  }
  
  // Se já há uma requisição getUser em andamento, aguardar
  if (authCache.promise) {
    const result = await authCache.promise;
    authCache.user = result.data.user;
    authCache.timestamp = now;
    authCache.promise = null;
    return authCache.user;
  }
  
  // Sessão ausente: validar com o servidor (lento, evite no hot path)
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
