// Mock data for development without Supabase

export interface Professional {
  id: string;
  name: string;
  salon_name: string;
  email: string;
  whatsapp_number: string | null;
  whatsapp_connected: boolean;
}

export interface Service {
  id: string;
  professional_id: string;
  name: string;
  interval_days: number;
  message_template: string;
  is_custom: boolean;
}

export interface Client {
  id: string;
  professional_id: string;
  name: string;
  phone: string;
}

export interface Appointment {
  id: string;
  professional_id: string;
  client_id: string;
  service_id: string;
  date: string;
  return_date: string;
}

export interface Reminder {
  id: string;
  appointment_id: string;
  professional_id: string;
  sent_at: string;
  status: 'sent' | 'failed';
  returned_at: string | null;
}

export type ClientStatus = 'em_dia' | 'atencao' | 'inativo';

export interface ClientWithStatus extends Client {
  status: ClientStatus;
  lastService: string;
  lastDate: string;
  daysInfo: string;
  daysOverdue: number;
  lastAppointment?: Appointment;
}

const DEFAULT_TEMPLATE = "Oi {nome}! 😊 Já faz {dias} dias desde o seu {serviço} aqui no salão. Que tal renovar? Tenho horário disponível essa semana — me chama aqui e já garantimos o seu! 🗓️";

export const defaultServices: Service[] = [
  { id: "s1", professional_id: "p1", name: "Corte feminino", interval_days: 30, message_template: DEFAULT_TEMPLATE, is_custom: false },
  { id: "s2", professional_id: "p1", name: "Corte masculino", interval_days: 21, message_template: DEFAULT_TEMPLATE, is_custom: false },
  { id: "s3", professional_id: "p1", name: "Coloração", interval_days: 45, message_template: DEFAULT_TEMPLATE, is_custom: false },
  { id: "s4", professional_id: "p1", name: "Mechas", interval_days: 60, message_template: DEFAULT_TEMPLATE, is_custom: false },
  { id: "s5", professional_id: "p1", name: "Escova", interval_days: 21, message_template: DEFAULT_TEMPLATE, is_custom: false },
  { id: "s6", professional_id: "p1", name: "Hidratação", interval_days: 30, message_template: DEFAULT_TEMPLATE, is_custom: false },
  { id: "s7", professional_id: "p1", name: "Relaxamento", interval_days: 90, message_template: DEFAULT_TEMPLATE, is_custom: false },
  { id: "s8", professional_id: "p1", name: "Manicure", interval_days: 15, message_template: DEFAULT_TEMPLATE, is_custom: false },
  { id: "s9", professional_id: "p1", name: "Pedicure", interval_days: 15, message_template: DEFAULT_TEMPLATE, is_custom: false },
];

export const mockClients: Client[] = [
  { id: "c1", professional_id: "p1", name: "Maria Silva", phone: "11999001234" },
  { id: "c2", professional_id: "p1", name: "Ana Oliveira", phone: "11998765432" },
  { id: "c3", professional_id: "p1", name: "Juliana Santos", phone: "11997654321" },
  { id: "c4", professional_id: "p1", name: "Camila Ferreira", phone: "11996543210" },
  { id: "c5", professional_id: "p1", name: "Bruna Costa", phone: "11995432109" },
];

export const mockAppointments: Appointment[] = [
  { id: "a1", professional_id: "p1", client_id: "c1", service_id: "s1", date: "2025-02-10", return_date: "2025-03-12" },
  { id: "a2", professional_id: "p1", client_id: "c2", service_id: "s3", date: "2025-01-15", return_date: "2025-03-01" },
  { id: "a3", professional_id: "p1", client_id: "c3", service_id: "s6", date: "2025-03-01", return_date: "2025-03-31" },
  { id: "a4", professional_id: "p1", client_id: "c4", service_id: "s8", date: "2025-03-10", return_date: "2025-03-25" },
  { id: "a5", professional_id: "p1", client_id: "c5", service_id: "s4", date: "2024-12-20", return_date: "2025-02-18" },
];

export const mockReminders: Reminder[] = [
  { id: "r1", appointment_id: "a2", professional_id: "p1", sent_at: "2025-03-02", status: "sent", returned_at: null },
  { id: "r2", appointment_id: "a5", professional_id: "p1", sent_at: "2025-02-20", status: "sent", returned_at: null },
  { id: "r3", appointment_id: "a1", professional_id: "p1", sent_at: "2025-03-13", status: "failed", returned_at: null },
];

export function getClientStatus(client: Client, appointments: Appointment[], services: Service[]): ClientWithStatus {
  const clientAppts = appointments
    .filter(a => a.client_id === client.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (clientAppts.length === 0) {
    return { ...client, status: 'inativo', lastService: 'Sem atendimento', lastDate: '', daysInfo: 'Novo cliente', daysOverdue: 0 };
  }

  const lastAppt = clientAppts[0];
  const service = services.find(s => s.id === lastAppt.service_id);
  const returnDate = new Date(lastAppt.return_date);
  const today = new Date();
  const diffDays = Math.floor((today.getTime() - returnDate.getTime()) / (1000 * 60 * 60 * 24));

  let status: ClientStatus;
  let daysInfo: string;

  if (diffDays > 0) {
    status = 'inativo';
    daysInfo = `${diffDays} dias atrasado`;
  } else if (diffDays > -7) {
    status = 'atencao';
    daysInfo = `Vence em ${Math.abs(diffDays)} dias`;
  } else {
    status = 'em_dia';
    daysInfo = 'Em dia';
  }

  return {
    ...client,
    status,
    lastService: service?.name || 'Serviço',
    lastDate: lastAppt.date,
    daysInfo,
    daysOverdue: diffDays,
    lastAppointment: lastAppt,
  };
}

export const mockProfessional: Professional = {
  id: "p1",
  name: "Carolina",
  salon_name: "Studio Carolina",
  email: "carolina@email.com",
  whatsapp_number: "+55 11 99900-1234",
  whatsapp_connected: true,
};
