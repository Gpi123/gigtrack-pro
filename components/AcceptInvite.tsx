import React, { useEffect, useState, useRef } from 'react';
import { Loader2, CheckCircle, XCircle, LogIn } from 'lucide-react';
import { authService } from '../services/authService';
import { bandService } from '../services/bandService';
import { useToast } from './Toast';

interface AcceptInviteProps {
  token: string;
  onComplete: (bandId: string) => void;
}

const AcceptInvite: React.FC<AcceptInviteProps> = ({ token, onComplete }) => {
  const [status, setStatus] = useState<'checking' | 'needs-login' | 'accepting' | 'success' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const processedRef = useRef(false);
  const toast = useToast();

  useEffect(() => {
    // Evitar processar múltiplas vezes
    if (processedRef.current) return;
    
    const processInvite = async () => {
      try {
        processedRef.current = true;
        
        // Verificar se usuário está autenticado
        const user = await authService.getCurrentUser();
        
        if (!user) {
          // Usuário não está logado, precisa fazer login
          processedRef.current = false; // Permitir tentar novamente após login
          setStatus('needs-login');
          return;
        }

        // Usuário está logado, aceitar convite
        setStatus('accepting');
        const bandId = await bandService.acceptInvite(token);
        setStatus('success');
        toast.success('Convite aceito! Você agora é membro da banda.');
        
        // Aguardar um pouco antes de redirecionar e selecionar a banda
        setTimeout(() => {
          onComplete(bandId);
        }, 2000);
      } catch (error: any) {
        console.error('Erro ao processar convite:', error);
        processedRef.current = false; // Permitir tentar novamente em caso de erro
        setStatus('error');
        setErrorMessage(error.message || 'Erro ao processar convite');
        toast.error(error.message || 'Erro ao processar convite');
      }
    };

    processInvite();
  }, [token, onComplete, toast]);

  const handleLogin = async () => {
    try {
      // Salvar token no localStorage para processar após login
      localStorage.setItem('pendingInviteToken', token);
      
      // Redirecionar para login com Google
      await authService.signInWithGoogle();
    } catch (error: any) {
      console.error('Erro ao iniciar login:', error);
      toast.error('Erro ao iniciar login');
    }
  };

  if (status === 'checking') {
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-md">
        <div className="bg-[#24272D] border border-[#31333B] rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 size={48} className="animate-spin text-[#3057F2]" />
            <p className="text-white text-center">Verificando convite...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'needs-login') {
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-md">
        <div className="bg-[#24272D] border border-[#31333B] rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="p-4 bg-[#3057F2]/20 rounded-full">
              <LogIn size={48} className="text-[#3057F2]" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-white">Login Necessário</h2>
              <p className="text-white/70 text-sm">
                Você precisa fazer login com sua conta Google para aceitar este convite.
              </p>
            </div>
            <button
              onClick={handleLogin}
              className="w-full px-6 py-3 bg-[#3057F2] hover:bg-[#2545D9] text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <LogIn size={20} />
              Entrar com Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'accepting') {
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-md">
        <div className="bg-[#24272D] border border-[#31333B] rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 size={48} className="animate-spin text-[#3057F2]" />
            <p className="text-white text-center">Aceitando convite...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-md">
        <div className="bg-[#24272D] border border-[#31333B] rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="p-4 bg-green-500/20 rounded-full">
              <CheckCircle size={48} className="text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-white text-center">Convite Aceito!</h2>
            <p className="text-white/70 text-sm text-center">
              Você agora é membro da banda. Redirecionando...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-md">
        <div className="bg-[#24272D] border border-[#31333B] rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="p-4 bg-red-500/20 rounded-full">
              <XCircle size={48} className="text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-white text-center">Erro</h2>
            <p className="text-white/70 text-sm text-center">{errorMessage}</p>
            <button
              onClick={onComplete}
              className="w-full px-6 py-3 bg-[#3057F2] hover:bg-[#2545D9] text-white rounded-xl font-semibold transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default AcceptInvite;
