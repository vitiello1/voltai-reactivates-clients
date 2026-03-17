import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { Professional, Service, Client, Appointment, Reminder, ClientWithStatus, getClientStatus } from '@/lib/mock-data';
import { useAuth } from '@/hooks/useAuth';
import { useProfessional, useUpdateProfessional } from '@/hooks/useProfessional';
import { useServices, useUpdateService, useAddService } from '@/hooks/useServices';
import { useClients, useAddClient } from '@/hooks/useClients';
import { useAppointments, useAddAppointment } from '@/hooks/useAppointments';
import { useReminders, useAddReminder, useMarkReturned } from '@/hooks/useReminders';

interface AppContextType {
  user: ReturnType<typeof useAuth>['user'];
  isAuthenticated: boolean;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, salonName: string) => Promise<void>;
  logout: () => Promise<void>;
  professional: Professional | null;
  services: Service[];
  clients: Client[];
  appointments: Appointment[];
  reminders: Reminder[];
  clientsWithStatus: ClientWithStatus[];
  addAppointment: (clientId: string, serviceId: string, date: string) => Promise<void>;
  addClient: (name: string, phone: string) => Promise<Client>;
  addReminder: (appointmentId: string, status: 'sent' | 'failed') => void;
  markReturned: (clientId: string) => void;
  updateService: (serviceId: string, updates: Partial<Service>) => void;
  addService: (name: string, intervalDays: number) => void;
  updateProfessional: (updates: Partial<Professional>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading, login, signup, logout } = useAuth();
  const professionalId = user?.id;

  const { data: professional = null } = useProfessional(professionalId);
  const { data: services = [] } = useServices(professionalId);
  const { data: clients = [] } = useClients(professionalId);
  const { data: appointments = [] } = useAppointments(professionalId);
  const { data: reminders = [] } = useReminders(professionalId);

  const { mutate: updateProfessionalMutation } = useUpdateProfessional();
  const { mutate: updateServiceMutation } = useUpdateService();
  const { mutateAsync: addServiceMutation } = useAddService();
  const { mutateAsync: addClientMutation } = useAddClient();
  const { mutateAsync: addAppointmentMutation } = useAddAppointment();
  const { mutate: addReminderMutation } = useAddReminder();
  const { mutate: markReturnedMutation } = useMarkReturned();

  const clientsWithStatus = useMemo(() =>
    clients
      .map(c => getClientStatus(c, appointments, services))
      .sort((a, b) => b.daysOverdue - a.daysOverdue),
    [clients, appointments, services]
  );

  const addAppointment = async (clientId: string, serviceId: string, date: string): Promise<void> => {
    const service = services.find(s => s.id === serviceId);
    if (!service || !professionalId) return;
    const dateObj = new Date(date);
    dateObj.setDate(dateObj.getDate() + service.interval_days);
    const returnDate = dateObj.toISOString().split('T')[0];
    await addAppointmentMutation({
      professional_id: professionalId,
      client_id: clientId,
      service_id: serviceId,
      date,
      return_date: returnDate,
    });
  };

  const addClient = async (name: string, phone: string): Promise<Client> => {
    if (!professionalId) throw new Error('Not authenticated');
    return addClientMutation({ professional_id: professionalId, name, phone });
  };

  const addReminder = (appointmentId: string, status: 'sent' | 'failed') => {
    if (!professionalId) return;
    addReminderMutation({
      appointment_id: appointmentId,
      professional_id: professionalId,
      sent_at: new Date().toISOString(),
      status,
      returned_at: null,
    });
  };

  const markReturned = async (clientId: string) => {
    const clientAppts = appointments
      .filter(a => a.client_id === clientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastAppt = clientAppts[0];
    if (!lastAppt || !professionalId) return;
    const relatedReminder = reminders.find(r => r.appointment_id === lastAppt.id);
    if (relatedReminder) markReturnedMutation(relatedReminder.id);
    await addAppointment(clientId, lastAppt.service_id, new Date().toISOString().split('T')[0]);
  };

  const updateService = (serviceId: string, updates: Partial<Service>) => {
    updateServiceMutation({ id: serviceId, updates });
  };

  const addService = (name: string, intervalDays: number) => {
    if (!professionalId) return;
    addServiceMutation({
      professional_id: professionalId,
      name,
      interval_days: intervalDays,
      message_template: "Oi {nome}! 😊 Já faz {dias} dias desde o seu {serviço} aqui no salão. Que tal renovar? Tenho horário disponível essa semana — me chama aqui e já garantimos o seu! 🗓️",
      is_custom: true,
    });
  };

  const updateProfessional = (updates: Partial<Professional>) => {
    if (!professionalId) return;
    updateProfessionalMutation({ id: professionalId, updates });
  };

  return (
    <AppContext.Provider value={{
      user,
      isAuthenticated: !!user,
      authLoading,
      login,
      signup,
      logout,
      professional,
      services,
      clients,
      appointments,
      reminders,
      clientsWithStatus,
      addAppointment,
      addClient,
      addReminder,
      markReturned,
      updateService,
      addService,
      updateProfessional,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
