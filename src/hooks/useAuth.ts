import type { LoginData } from '@/pages/auth/types/login.types';
import type { RegisterData } from '@/pages/auth/types/register.types';
import api from '@/utils/api';
import { showToast } from '@/utils/toast';
import { useEffect, useSyncExternalStore } from 'react';
import { isAxiosError } from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import { bootstrap, getAuthState, loginSession, logoutSession, onIdentityChange, subscribeAuth } from '@/auth/session';
export function useAuth() {
  const state = useSyncExternalStore(subscribeAuth, getAuthState);
  const client = useQueryClient();
  useEffect(() => onIdentityChange(() => { void client.cancelQueries(); client.clear(); }), [client]);
  useEffect(() => { void bootstrap(); }, []);
  async function register(data: RegisterData) {
    const { confirmPassword: _confirm, ...input } = data;
    void _confirm;
    try { await api.post('/users', input); showToast('Conta criada com sucesso! Faça o login para continuar'); return true; }
    catch (error) { showToast(isAxiosError(error) ? error.response?.data?.message ?? 'Verifique sua conexão e tente novamente.' : 'Erro inesperado', 'error'); return false; }
  }
  async function login(input: LoginData) {
    try { await loginSession(input); showToast('Login realizado com sucesso!'); return true; }
    catch (error) { showToast(isAxiosError(error) ? error.response?.data?.message ?? 'Verifique sua conexão e tente novamente.' : error instanceof Error ? error.message : 'Erro inesperado', 'error'); return false; }
  }
  function logout() { void logoutSession(); showToast('Você saiu neste navegador.'); }
  return { authenticated: state.status === 'authenticated', loading: state.status === 'loading',
    sessionError: state.status === 'unavailable' ? state.error : undefined, retrySession: bootstrap, register, login, logout };
}
