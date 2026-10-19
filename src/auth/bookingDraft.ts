import { getIdentity } from "@/auth/session";
import type { RequestNotSent } from "@/auth/requestNotSent";
export const BOOKING_DRAFT_KEY = 'barber.booking.draft.v1';
export interface BookingDraft {
 version: 1; userId: string; shopId: string; appointmentId?: string;
 serviceId: string; date: string; slot: string;
 uncertain?: { operationId: string; generation: string; serviceId: string; date: string; appointmentId?: string };
}
export function readDraft(userId: string, shopId: string, appointmentId?: string): BookingDraft | undefined {
 try {
  const value=JSON.parse(sessionStorage.getItem(BOOKING_DRAFT_KEY)??'null');
  if(value?.userId!==userId) { sessionStorage.removeItem(BOOKING_DRAFT_KEY); return; }
  if(value.version===1 && value.shopId===shopId && value.appointmentId===appointmentId &&
    typeof value.serviceId==='string' && typeof value.date==='string' && typeof value.slot==='string' &&
    (!value.uncertain || (typeof value.uncertain.operationId==='string' && typeof value.uncertain.generation==='string' && typeof value.uncertain.serviceId==='string' && typeof value.uncertain.date==='string' && value.uncertain.appointmentId===appointmentId))) return value;
 } catch { sessionStorage.removeItem(BOOKING_DRAFT_KEY); }
}
export function discardOtherAccountDraft(userId: string) {
 try { if(JSON.parse(sessionStorage.getItem(BOOKING_DRAFT_KEY)??'null')?.userId!==userId) sessionStorage.removeItem(BOOKING_DRAFT_KEY); }
 catch { sessionStorage.removeItem(BOOKING_DRAFT_KEY); }
}
export function saveDraft(draft: BookingDraft) { sessionStorage.setItem(BOOKING_DRAFT_KEY,JSON.stringify(draft)); }

export function clearUnsentAttempt(expected: BookingDraft, error: RequestNotSent): BookingDraft | undefined {
 const attempt=expected.uncertain;
 if(!attempt || attempt.generation!==error.operationGeneration || getIdentity().generation!==error.allowedGeneration) return;
 let stored: unknown;
 try { stored=JSON.parse(sessionStorage.getItem(BOOKING_DRAFT_KEY)??'null'); } catch { return; }
 if(!stored || typeof stored!=='object' || !('userId' in stored) || stored.userId!==expected.userId) return;
 const current=readDraft(expected.userId,expected.shopId,expected.appointmentId);
 if(!current?.uncertain || current.uncertain.operationId!==attempt.operationId || current.uncertain.generation!==attempt.generation) return;
 const next={...current,uncertain:undefined};
 saveDraft(next);
 return next;
}
