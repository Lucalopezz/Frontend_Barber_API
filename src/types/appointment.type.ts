export type Appointment = {
  id: string;
  date: Date;
  status: AppointmentStatus;
  clientId: string;
  serviceId: string;
  barberShopId: string;
  createdAt?: Date;
};

export const APPOINTMENT_STATUS = [
  "scheduled",
  "completed",
  "cancelled",
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUS)[number];
