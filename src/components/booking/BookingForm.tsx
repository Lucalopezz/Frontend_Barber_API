import { RequestNotSent } from "@/auth/requestNotSent";
import { useGetUser } from "@/hooks/queries/user/useGetUser";
import { clearUnsentAttempt, readDraft, saveDraft, type BookingDraft } from "@/auth/bookingDraft";
import type { Appointment } from "@/types/appointment.type";
import { getIdentity, getSessionSnapshot, isCurrentIdentity, synchronizeIdentity } from "@/auth/session";
import { useState } from "react";
import { isAxiosError } from "axios";
import { useListServices } from "@/hooks/queries/services/useListServices";
import {
  useBookingMutation,
  useSlots,
} from "@/hooks/queries/appointments/useBooking";
import { Button } from "@/components/ui/button";
import api from "@/utils/api";
import { Link } from "react-router-dom";
interface BookingProps { shopId: string; appointmentId?: string; initialServiceId?: string }
export function BookingForm(props: BookingProps) {
  const user=useGetUser();
  if (!user.data) return <p role={user.isError ? 'alert' : 'status'}>Validando sua conta… {user.isError && <button onClick={()=>void user.refetch()}>Tentar novamente</button>}</p>;
  return <AccountBookingForm key={`${user.data.id}:${props.shopId}:${props.appointmentId??''}`} {...props} userId={user.data.id} />;
}
function AccountBookingForm({shopId,appointmentId,initialServiceId='',userId}:BookingProps & {userId:string}) {
  const [formGeneration] = useState(() => getIdentity().generation);
  const [draft,setDraft]=useState<BookingDraft>(()=>readDraft(userId,shopId,appointmentId)??{
    version:1,userId,shopId,appointmentId,serviceId:initialServiceId,date:'',slot:''
  });
  const {serviceId,date,slot,uncertain}=draft;
  const [message,setMessage]=useState('');
  const [reconciled,setReconciled]=useState(false);
  const [reconciling,setReconciling]=useState(false);
  function update(patch: Partial<BookingDraft>) {
    const next={...draft,...patch};
    saveDraft(next); // Persist synchronously before auth transitions can unmount the route.
    setDraft(next);
  }
  const services = useListServices(shopId),
    slots = useSlots(shopId, serviceId, date);
  const mutation = useBookingMutation<void>(async () => {
    const input = { serviceId, date: slot };
    if (appointmentId)
      await api.put(`/appointments/${appointmentId}`, input);
    else await api.post("/appointments", input);
  });
  const pending = mutation.isPending || reconciling;
  async function reconcile(attempt: NonNullable<BookingDraft['uncertain']>) {
    const generation=getIdentity().generation;
    setReconciling(true);
    try {
      const reservations:Appointment[]=[];
      let lastPage=1;
      for(let page=1;page<=lastPage;page++) {
        const response=await api.get<{data:Appointment[];meta:{lastPage:number}}>('/appointments',{params:{page,perPage:50}});
        if(!Array.isArray(response.data.data) || !Number.isInteger(response.data.meta?.lastPage) || response.data.meta.lastPage<1) throw new Error('Lista incompleta.');
        reservations.push(...response.data.data);
        lastPage=response.data.meta.lastPage;
      }
      if(!isCurrentIdentity(generation)) return;
      const matching=reservations.filter(a=>(attempt.appointmentId || a.clientId===userId) && a.barberShopId===shopId && a.serviceId===attempt.serviceId &&
        new Date(a.date).getTime()===new Date(attempt.date).getTime() && a.status!=='cancelled' && (!attempt.appointmentId || a.id===attempt.appointmentId));
      if(matching.length===1) {
        update({uncertain:undefined,slot:''});setReconciled(true);setMessage('Agendamento confirmado após consultar suas reservas.');
      } else setMessage('Não foi possível confirmar o resultado. Revise seus agendamentos antes de fazer outra reserva.');
    } catch {
      if(isCurrentIdentity(generation)) setMessage('Não foi possível confirmar o resultado. Revise seus agendamentos antes de fazer outra reserva.');
    } finally {setReconciling(false);}
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isCurrentIdentity(formGeneration) || !getSessionSnapshot()) { synchronizeIdentity(); return; }
    if (pending || !slot || uncertain || !slots.data?.slots.some(s=>s.startsAt===slot) || services.isError || slots.isError) return;
    setMessage('');setReconciled(false);
    const generation=getIdentity().generation;
    const attempt={operationId:crypto.randomUUID(),generation,serviceId,date:slot,appointmentId};
    update({uncertain:attempt}); // Reload while a mutation is in flight must also prevent blind resubmission.
    try {
      await mutation.mutateAsync(undefined);
      if(!isCurrentIdentity(generation)) return;
      update({uncertain:undefined,slot:''});
      setMessage(appointmentId ? 'Agendamento remarcado.' : 'Agendamento criado.');
    } catch (error) {
      if(error instanceof RequestNotSent) {
        const cleared=clearUnsentAttempt({...draft,uncertain:attempt},error);
        if(cleared && isCurrentIdentity(formGeneration)) setDraft(cleared);
        return;
      }
      if(!isCurrentIdentity(generation)) return;
      if (isAxiosError(error) && error.response) {
        update({uncertain:undefined,...(error.response.status===409?{slot:''}:{})});
        if(error.response.status===409){setMessage('Horário indisponível. Os horários foram atualizados; escolha novamente.');await slots.refetch();}
        else setMessage('Erro ao salvar agendamento. Verifique sua sessão e tente novamente.');
      } else await reconcile(attempt);
    }
  }
  return (
    <form onSubmit={submit} aria-busy={pending} className="space-y-6 panel">
      <h2 className="text-xl font-semibold">
        {appointmentId ? "Remarcar agendamento" : "Escolha serviço e horário"}
      </h2>
      <p className="text-sm text-muted-foreground">
        Escolha o serviço e a data para ver os horários disponíveis.
      </p>
      {services.isLoading && <p>Carregando serviços…</p>}
      {services.isError && (
        <p role="alert">
          Erro ao carregar serviços.{" "}
          <button type="button" onClick={() => services.refetch()}>
            Tentar novamente
          </button>
        </p>
      )}
      {services.data?.data.length === 0 && (
        <p>Nenhum serviço disponível nesta barbearia.</p>
      )}
      <label className="block">
        Serviço
        <select
          aria-label="Serviço"
          className="mt-2 block w-full"
          required
          disabled={pending || !!uncertain}
          value={serviceId}
          onChange={(e) => {
            update({serviceId:e.target.value,slot:""});
            setMessage("");
          }}
        >
          <option value="">Selecione</option>
          {services.data?.data.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} —{" "}
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(Number(s.price))}{" "}
              — {s.duration} min
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        Data
        <input
          className="mt-2 block w-full"
          type="date"
          required
          value={date}
          disabled={pending || !!uncertain}
          onChange={(e) => {
            update({date:e.target.value,slot:""});
            setMessage("");
          }}
        />
      </label>
      {slots.data && (
        <p className="text-sm text-muted-foreground">
          Horários no fuso {slots.data.timezone}.
        </p>
      )}
      {slots.isFetching && <p>Consultando horários…</p>}
      {slots.isError && (
        <p role="alert">
          Erro ao consultar horários.{" "}
          <button type="button" onClick={() => slots.refetch()}>
            Tentar novamente
          </button>
        </p>
      )}
      {slots.data && !slots.isFetching && slots.data.slots.length === 0 && (
        <p>Nenhum horário disponível nesta data.</p>
      )}
      <div className="flex flex-wrap gap-2">
        {!slots.isFetching &&
          slots.data?.slots.map((s) => (
            <Button
              key={s.startsAt}
              type="button"
              variant={slot === s.startsAt ? "default" : "outline"}
              aria-pressed={slot === s.startsAt}
              disabled={pending || !!uncertain}
              onClick={() => {
                update({slot:s.startsAt});
                setMessage("");
              }}
            >
              {new Intl.DateTimeFormat("pt-BR", {
                timeZone: slots.data.timezone,
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date(s.startsAt))}
            </Button>
          ))}
      </div>
      <details className="text-sm text-muted-foreground">
        <summary>Prazo de reserva e cancelamento</summary>
        <p className="mt-2">
          Agende entre 30 minutos e 60 dias de antecedência, nos horários
          oferecidos. Você pode cancelar até 24 horas antes do atendimento.
        </p>
      </details>
      <Button
        className="w-full sm:w-auto"
        disabled={pending || !!uncertain || !slot || slots.isFetching || slots.isError || services.isError || !slots.data?.slots.some(s=>s.startsAt===slot)}
        type="submit"
      >
        {pending
          ? "Salvando…"
          : appointmentId
            ? "Confirmar remarcação"
            : "Confirmar agendamento"}
      </Button>
      {uncertain && <div role="alert">
        {message || 'Não foi possível confirmar o resultado. Revise seus agendamentos antes de fazer outra reserva.'}
        {' '}<Link className="underline" to="/appointments">Revisar meus agendamentos</Link>
        {' '}<button type="button" disabled={pending} onClick={()=>void reconcile(uncertain)}>Consultar resultado novamente</button>
      </div>}
      {message && !uncertain && (
        <p role={mutation.isError && !reconciled ? "alert" : "status"}>
          {message}{" "}
          {(mutation.isSuccess || reconciled) && (
            <Link className="underline" to="/appointments">
              Ver agendamentos
            </Link>
          )}
        </p>
      )}
    </form>
  );
}
