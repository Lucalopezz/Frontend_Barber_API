import { SessionEnded } from "@/auth/requestNotSent";
import axios, { isAxiosError } from 'axios';

export interface SessionTokens {
  accessToken: string;
  sessionId: string;
  accessTokenExpiresAt: string;
  sessionExpiresAt: string;
}
interface PendingLogout { sessionId: string; operation: string }
interface Marker { version: 1; generation: string; sessionId?: string; pending: PendingLogout[]; discoveryAllowed?: boolean; unknownLogout?: string; discardDraft?: boolean }
export interface AuthState {
  status: 'loading' | 'authenticated' | 'anonymous' | 'unavailable';
  generation: string;
  error?: string;
}
const KEY = 'barber.session.v1';
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const fresh = (): Marker => ({ version: 1, generation: crypto.randomUUID(), pending: [], discoveryAllowed: true });
function read(): Marker {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (value?.version === 1 && uuid.test(value.generation) &&
      (value.sessionId === undefined || uuid.test(value.sessionId)) &&
      Array.isArray(value.pending) && value.pending.length <= 64 &&
      (value.discoveryAllowed === undefined || typeof value.discoveryAllowed === 'boolean') &&
      (value.discardDraft === undefined || typeof value.discardDraft === 'boolean') &&
      (value.unknownLogout === undefined || uuid.test(value.unknownLogout)) &&
      value.pending.every((p: PendingLogout) => uuid.test(p.sessionId) && uuid.test(p.operation))) return value;
  } catch { /* Invalid metadata never selects a session. */ }
  const marker = fresh();
  if (localStorage.getItem(KEY) !== null) { marker.discoveryAllowed = false; marker.unknownLogout = crypto.randomUUID(); }
  localStorage.setItem(KEY, JSON.stringify(marker));
  return marker;
}
localStorage.removeItem('token');
sessionStorage.removeItem('token');
let marker = read();
let tokens: SessionTokens | undefined;
let state: AuthState = { status: 'loading', generation: marker.generation };
const listeners = new Set<() => void>();
const transitions = new Set<() => void>();
const channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel('barber.sessions.v1') : undefined;
const transport = axios.create({ baseURL: import.meta.env.VITE_API_URL, withCredentials: true, timeout: 10000,
  headers: { 'X-Barber-Session': '1', 'Content-Type': 'application/json' } });
const emit = (status: AuthState['status'], error?: string) => {
  state = { status, generation: marker.generation, error };
  listeners.forEach(fn => fn());
};
function invalidate(next: Marker, status: AuthState['status'] = 'anonymous') {
  if (next.discardDraft && next.generation !== marker.generation) sessionStorage.removeItem('barber.booking.draft.v1');
  marker = next;
  tokens = undefined;
  transitions.forEach(fn => fn());
  emit(status, status === 'unavailable' ? 'Você saiu neste navegador. A saída no servidor está pendente; reconecte e tente novamente.' : undefined);
}
function persist(next: Marker) {
  localStorage.setItem(KEY, JSON.stringify(next));
  invalidate(next);
  channel?.postMessage({ type: 'identity', generation: next.generation });
}
function current(generation: string) { return read().generation === generation; }
function valid(value: SessionTokens): boolean {
  return typeof value?.accessToken === 'string' && value.accessToken.length > 0 && uuid.test(value.sessionId) &&
    Number.isFinite(Date.parse(value.accessTokenExpiresAt)) && Number.isFinite(Date.parse(value.sessionExpiresAt));
}
function accept(value: SessionTokens, generation: string) {
  const latest = read();
  if (!current(generation) || latest.pending.length || latest.unknownLogout || latest.sessionId !== value.sessionId || !valid(value)) return false;
  marker = latest;
  tokens = value;
  emit('authenticated');
  return true;
}
channel?.addEventListener('message', ({ data }) => {
  const latest = read();
  if (data?.type === 'snapshot-request' && data.generation === latest.generation &&
    marker.generation === latest.generation && tokens && state.status === 'authenticated') {
    channel.postMessage({ type: 'snapshot', request: data.request, generation: marker.generation, tokens });
  }
  if (data?.type === 'identity' && (latest.generation !== marker.generation || latest.sessionId !== marker.sessionId)) {
    invalidate(latest, latest.sessionId ? 'loading' : latest.pending.length ? 'unavailable' : 'anonymous');
    if (latest.sessionId && !latest.pending.length) void bootstrap();
  }
});
window.addEventListener('storage', event => {
  if (event.key !== KEY) return;
  const latest = read();
  if ((latest.generation !== marker.generation || latest.sessionId !== marker.sessionId)) {
    invalidate(latest, latest.sessionId ? 'loading' : latest.pending.length ? 'unavailable' : 'anonymous');
    if (latest.sessionId && !latest.pending.length) void bootstrap();
  }
});
async function snapshot(generation: string, rejectedToken?: string) {
  if (!channel) return;
  await new Promise<void>(resolve => {
    const request = crypto.randomUUID();
    const finish = () => { clearTimeout(timer); channel.removeEventListener('message', receive); resolve(); };
    const receive = ({ data }: MessageEvent) => {
      if (data?.type === 'snapshot' && data.request === request && data.generation === generation &&
        valid(data.tokens) && data.tokens.accessToken !== rejectedToken && Date.parse(data.tokens.accessTokenExpiresAt) > Date.now()) {
        accept(data.tokens, generation);
        finish();
      }
    };
    const timer = setTimeout(finish, 80);
    channel.addEventListener('message', receive);
    channel.postMessage({ type: 'snapshot-request', request, generation });
  });
}
async function locked<T>(run: () => Promise<T>) {
  if (!navigator.locks || !channel) {
    emit('unavailable', 'Este navegador não permite coordenar a sessão com segurança. Use um navegador atualizado.');
    throw new Error('Coordenação de sessão indisponível.');
  }
  return navigator.locks.request('barber.session.operations.v1', { mode: 'exclusive' }, run);
}
async function queueOrphan(value: SessionTokens) {
  if (!valid(value)) return;
  const latest = read();
  const next = { ...latest, pending: [...latest.pending, { sessionId: value.sessionId, operation: crypto.randomUUID() }] };
  localStorage.setItem(KEY, JSON.stringify(next));
  await drainPending();
}
async function drainPending() {
  const unknownOperation = read().unknownLogout;
  if (unknownOperation) {
    try {
      const response = await transport.post<SessionTokens>('/auth/refresh', {});
      if (!valid(response.data)) throw new Error('Resposta de sessão inválida.');
      await transport.post('/auth/logout', { sessionId: response.data.sessionId });
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401 && error.response.data?.code === 'AUTH_SESSION_AMBIGUOUS') {
        const ids: unknown = error.response.data.sessionIds;
        if (!Array.isArray(ids) || !ids.length || ids.length > 64 || !ids.every(id => typeof id === 'string' && uuid.test(id))) throw error;
        for (const sessionId of ids) await transport.post('/auth/logout', { sessionId });
      } else if (!(isAxiosError(error) && error.response?.status === 401 && error.response.data?.code === 'AUTH_SESSION_INVALID')) throw error;
    }
    const latest = read();
    const next = { ...latest, unknownLogout: latest.unknownLogout === unknownOperation ? undefined : latest.unknownLogout };
    localStorage.setItem(KEY, JSON.stringify(next));
    if (marker.generation === next.generation) marker = next;
  }
  for (const pending of read().pending) {
    await transport.post('/auth/logout', { sessionId: pending.sessionId });
    const latest = read();
    // A late confirmation may remove only its own operation, never a new identity.
    const next = { ...latest, pending: latest.pending.filter(p => p.operation !== pending.operation) };
    localStorage.setItem(KEY, JSON.stringify(next));
    if (marker.generation === next.generation) marker = next;
  }
}
function networkFailure() {
  tokens = undefined;
  transitions.forEach(fn => fn());
  emit('unavailable', read().pending.length || read().unknownLogout
    ? 'Você saiu neste navegador. A saída no servidor está pendente; reconecte e tente novamente.'
    : 'Não foi possível recuperar sua sessão. Verifique a conexão e tente novamente.');
}
function expired(generation: string, notify: boolean) {
  if (!current(generation)) return;
  if (notify) sessionStorage.setItem('sessionExpired', 'true');
  const latest = read();
  const next = { ...latest, sessionId: undefined, discardDraft: false, discoveryAllowed: false,
    // A failed anonymous bootstrap has no identity to invalidate. Keeping its generation
    // lets a login already queued behind that refresh proceed.
    generation: latest.sessionId || notify ? crypto.randomUUID() : latest.generation };
  persist(next);
  return next.generation;
}
let recovering: Promise<void> | undefined;
async function recover(rejectedToken?: string) {
  const requestedGeneration = read().generation;
  await locked(async () => {
    if (!current(requestedGeneration)) return;
    try {
      await drainPending();
      marker = read();
      if (!current(requestedGeneration)) return;
      if (tokens && tokens.accessToken !== rejectedToken && Date.parse(tokens.accessTokenExpiresAt) > Date.now()) return;
      await snapshot(requestedGeneration, rejectedToken);
      if (!current(requestedGeneration)) return;
      if (tokens && tokens.accessToken !== rejectedToken && Date.parse(tokens.accessTokenExpiresAt) > Date.now()) return;
      const sid = marker.sessionId;
      if (!sid && marker.discoveryAllowed === false) { emit('anonymous'); return; }
      const response = await transport.post<SessionTokens>('/auth/refresh', sid ? { sessionId: sid } : {});
      if (!current(requestedGeneration)) { await queueOrphan(response.data); return; }
      if (!valid(response.data) || (sid && response.data.sessionId !== sid)) throw new Error('Resposta de sessão inválida.');
      if (!sid) {
        const next = { ...read(), sessionId: response.data.sessionId };
        localStorage.setItem(KEY, JSON.stringify(next));
        marker = next;
      }
      if (accept(response.data, requestedGeneration)) channel?.postMessage({ type: 'identity', generation: requestedGeneration });
    } catch (error) {
      if (!current(requestedGeneration)) return;
      if (isAxiosError(error) && error.response?.status === 401 && ['AUTH_SESSION_INVALID', 'AUTH_SESSION_AMBIGUOUS'].includes(error.response.data?.code)) {
        const endedGeneration = expired(requestedGeneration, !!marker.sessionId);
        if (endedGeneration) throw new SessionEnded(error, requestedGeneration, endedGeneration);
      } else networkFailure();
      throw error;
    }
  });
}
export function bootstrap() {
  if (state.status === 'authenticated' && !isAccessExpired()) return Promise.resolve();
  if (!recovering) {
    emit('loading');
    recovering = recover().catch(() => { if (state.status === 'loading') networkFailure(); }).finally(() => { recovering = undefined; });
  }
  return recovering;
}
export async function refreshSession(rejectedToken?: string) {
  if (!recovering) recovering = recover(rejectedToken).finally(() => { recovering = undefined; });
  await recovering;
  if (state.status !== 'authenticated') throw new Error('Sessão não recuperada.');
}
export async function loginSession(input: { email: string; password: string }) {
  const intentGeneration = read().generation;
  return locked(async () => {
    if (!current(intentGeneration)) throw new Error('Login cancelado por uma alteração de sessão.');
    try { await drainPending(); } catch (error) { networkFailure(); throw error; }
    if (!current(intentGeneration)) throw new Error('Login cancelado por uma alteração de sessão.');
    const old = read();
    if (old.sessionId) {
      const pending = { sessionId: old.sessionId, operation: crypto.randomUUID() };
      persist({ version: 1, generation: crypto.randomUUID(), pending: [...old.pending, pending], discoveryAllowed: false });
      const revokedGeneration = read().generation;
      try { await drainPending(); } catch (error) { networkFailure(); throw error; }
      if (!current(revokedGeneration)) throw new Error('Login cancelado por uma alteração de sessão.');
    }
    const next = { ...read(), generation: crypto.randomUUID(), sessionId: undefined, discardDraft: false };
    persist(next);
    const response = await transport.post<SessionTokens>('/users/login', input);
    if (!current(next.generation)) { await queueOrphan(response.data); throw new Error('A identidade mudou durante o login.'); }
    if (!valid(response.data)) throw new Error('Resposta de sessão inválida.');
    const established = { ...read(), sessionId: response.data.sessionId };
    localStorage.setItem(KEY, JSON.stringify(established));
    if (!accept(response.data, established.generation)) throw new Error('Login interrompido.');
    channel?.postMessage({ type: 'identity', generation: established.generation });
  });
}
export function logoutSession() {
  const latest = read();
  const pending = latest.sessionId ? [...latest.pending, { sessionId: latest.sessionId, operation: crypto.randomUUID() }] : latest.pending;
  persist({ version: 1, generation: crypto.randomUUID(), pending, discoveryAllowed: false, discardDraft: true, unknownLogout: latest.unknownLogout ?? (!latest.sessionId ? crypto.randomUUID() : undefined) });
  sessionStorage.removeItem('barber.booking.draft.v1');
  return locked(async () => {
    try { await drainPending(); if (!read().sessionId) emit('anonymous'); }
    catch { networkFailure(); }
  }).catch(() => networkFailure());
}
export function endRejectedSession(generation: string) { expired(generation, true); }
export function passwordChanged() {
  sessionStorage.removeItem('barber.booking.draft.v1');
  persist({ ...read(), sessionId: undefined, discardDraft: true, discoveryAllowed: false, generation: crypto.randomUUID() });
  sessionStorage.setItem('sessionExpired', 'true');
}
export const getAuthState = () => state;
export const subscribeAuth = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
export const onIdentityChange = (fn: () => void) => { transitions.add(fn); return () => { transitions.delete(fn); }; };
export function getSessionSnapshot() {
  const durable = read();
  if (state.status !== 'authenticated' || !tokens || durable.pending.length || durable.unknownLogout ||
    durable.generation !== marker.generation || durable.sessionId !== marker.sessionId || tokens.sessionId !== marker.sessionId) return;
  return { ...tokens, generation: marker.generation };
}
export function synchronizeIdentity() {
  const durable = read();
  if (durable.generation !== marker.generation || durable.sessionId !== marker.sessionId) {
    invalidate(durable, durable.sessionId ? 'loading' : durable.pending.length || durable.unknownLogout ? 'unavailable' : 'anonymous');
    if (durable.sessionId && !durable.pending.length && !durable.unknownLogout) void bootstrap();
  }
}
export const getAccessToken = () => getSessionSnapshot()?.accessToken;
export const getIdentity = () => ({ generation: read().generation, sessionId: read().sessionId });
export const isCurrentIdentity = (generation: string) => current(generation);
export const isAccessExpired = () => !tokens || Math.min(Date.parse(tokens.accessTokenExpiresAt), Date.parse(tokens.sessionExpiresAt)) <= Date.now();
