export type Appointment = {
  id: string;
  date: string;
  status: AppointmentStatus;
  clientId: string;
  serviceId: string;
  barberId: string;
  barberShopId: string;
  createdAt?: Date;
};

export const APPOINTMENT_STATUS = [
  "scheduled",
  "completed",
  "cancelled",
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUS)[number];
