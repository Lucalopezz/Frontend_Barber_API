export const appointmentStatus = (status: string) =>
  ({
    scheduled: "Agendado",
    completed: "Concluído",
    cancelled: "Cancelado",
  })[status] ?? status;
