import { RequestNotSent } from "@/auth/requestNotSent";
import api from '@/utils/api';
import { CanceledError, type InternalAxiosRequestConfig } from 'axios';
import { endRejectedSession, getSessionSnapshot, synchronizeIdentity, getIdentity, isAccessExpired, isCurrentIdentity, refreshSession } from '@/auth/session';
interface SessionRequest extends InternalAxiosRequestConfig { authGeneration?: string; authRetried?: boolean }
const publicRequest = (url?: string) => url === '/users/login' || url === '/users' || url?.startsWith('/auth/');
api.interceptors.request.use(async (config: SessionRequest) => {
  if (publicRequest(config.url)) return config;
  const identity = getIdentity();
  try {
    if (!getSessionSnapshot()) { synchronizeIdentity(); throw new Error('Sessão indisponível.'); }
    if (isAccessExpired()) await refreshSession();
    const snapshot = getSessionSnapshot();
    if (!snapshot || snapshot.generation !== identity.generation) throw new Error('Identidade alterada.');
    config.authGeneration = snapshot.generation;
    config.headers.set('Authorization', `Bearer ${snapshot.accessToken}`);
  } catch (error) { throw new RequestNotSent(error, identity.generation); }
  return config;
});
api.interceptors.response.use(response => {
  const config = response.config as SessionRequest;
  if (config.authGeneration && !isCurrentIdentity(config.authGeneration)) throw new CanceledError('Resposta de identidade anterior.');
  return response;
}, async error => {
  const config: SessionRequest | undefined = error.config;
  if (config?.authGeneration && !isCurrentIdentity(config.authGeneration)) throw new CanceledError('Resposta de identidade anterior.');
  if (config && !publicRequest(config.url) && !config.authRetried && error.response?.status === 401 &&
    error.response.data?.code === 'AUTHENTICATION_REQUIRED') {
    config.authRetried = true;
    const rejectedToken = String(config.headers.get('Authorization') ?? '').replace(/^Bearer /, '');
    await refreshSession(rejectedToken);
    if (!isCurrentIdentity(config.authGeneration!)) throw new CanceledError('Identidade alterada.');
    return api.request(config);
  }
  if (config?.authRetried && config.authGeneration && error.response?.status === 401 && error.response.data?.code === 'AUTHENTICATION_REQUIRED') endRejectedSession(config.authGeneration);
  return Promise.reject(error);
});
