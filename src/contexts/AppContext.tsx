import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  Professional, Service, Client, Appointment, Reminder, ClientWithStatus,
  mockProfessional, defaultServices, mockClients, mockAppointments, mockReminders,
  getClientStatus,
} from '@/lib/mock-data';

interface AppContextType {
  professional: Professional | null;
  isAuthenticated: boolean;
  services: Service[];
  clients: Client[];
  appointments: Appointment[];
  reminders: Reminder[];
  clientsWithStatus: ClientWithStatus[];
  login: (email: string, password: string) => boolean;
  signup: (name: string, salonName: string, email: string, password: string) => boolean;
  logout: () => void;
  addAppointment: (clientId: string, serviceId: string, date: string) => void;
  addClient: (name: string, phone: string) => Client;
  addReminder: (appointmentId: string, status: 'sent' | 'failed') => void;
  markReturned: (clientId: string) => void;
  updateService: (serviceId: string, updates: Partial<Service>) => void;
  addService: (name: string, intervalDays: number) => void;
  updateProfessional: (updates: Partial<Professional>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [services, setServices] = useState<Service[]>(defaultServices);
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [reminders, setReminders] = useState<Reminder[]>(mockReminders);

  const clientsWithStatus = clients.map(c => getClientStatus(c, appointments, services))
    .sort((a, b) => b.daysOverdue - a.daysOverdue);

  const login = (email: string, _password: string) => {
    setProfessional({ ...mockProfessional, email });
    setIsAuthenticated(true);
    return true;
  };

  const signup = (name: string, salonName: string, email: string, _password: string) => {
    setProfessional({ ...mockProfessional, name, salon_name: salonName, email, whatsapp_connected: false, whatsapp_number: null });
    setIsAuthenticated(true);
    return true;
  };

  const logout = () => {
    setProfessional(null);
    setIsAuthenticated(false);
  };

  const addAppointment = (clientId: string, serviceId: string, date: string) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;
    const dateObj = new Date(date);
    dateObj.setDate(dateObj.getDate() + service.interval_days);
    const returnDate = dateObj.toISOString().split('T')[0];
    const newAppt: Appointment = {
      id: `a${Date.now()}`,
      professional_id: professional?.id || 'p1',
      client_id: clientId,
      service_id: serviceId,
      date,
      return_date: returnDate,
    };
    setAppointments(prev => [...prev, newAppt]);
  };

  const addClient = (name: string, phone: string): Client => {
    const newClient: Client = {
      id: `c${Date.now()}`,
      professional_id: professional?.id || 'p1',
      name,
      phone,
    };
    setClients(prev => [...prev, newClient]);
    return newClient;
  };

  const addReminder = (appointmentId: string, status: 'sent' | 'failed') => {
    const newReminder: Reminder = {
      id: `r${Date.now()}`,
      appointment_id: appointmentId,
      professional_id: professional?.id || 'p1',
      sent_at: new Date().toISOString(),
      status,
      returned_at: null,
    };
    setReminders(prev => [...prev, newReminder]);
  };

  const markReturned = (clientId: string) => {
    const clientAppts = appointments.filter(a => a.client_id === clientId);
    const lastAppt = clientAppts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    if (lastAppt) {
      const relatedReminder = reminders.find(r => r.appointment_id === lastAppt.id);
      if (relatedReminder) {
        setReminders(prev => prev.map(r => r.id === relatedReminder.id ? { ...r, returned_at: new Date().toISOString() } : r));
      }
      // Add a new "today" appointment to mark them as returned
      const service = services.find(s => s.id === lastAppt.service_id);
      if (service) {
        addAppointment(clientId, lastAppt.service_id, new Date().toISOString().split('T')[0]);
      }
    }
  };

  const updateService = (serviceId: string, updates: Partial<Service>) => {
    setServices(prev => prev.map(s => s.id === serviceId ? { ...s, ...updates } : s));
  };

  const addService = (name: string, intervalDays: number) => {
    const newService: Service = {
      id: `s${Date.now()}`,
      professional_id: professional?.id || 'p1',
      name,
      interval_days: intervalDays,
      message_template: "Oi {nome}! 😊 Já faz {dias} dias desde o seu {serviço} aqui no salão. Que tal renovar? Tenho horário disponível essa semana — me chama aqui e já garantimos o seu! 🗓️",
      is_custom: true,
    };
    setServices(prev => [...prev, newService]);
  };

  const updateProfessional = (updates: Partial<Professional>) => {
    if (professional) {
      setProfessional({ ...professional, ...updates });
    }
  };

  return (
    <AppContext.Provider value={{
      professional, isAuthenticated, services, clients, appointments, reminders,
      clientsWithStatus, login, signup, logout, addAppointment, addClient,
      addReminder, markReturned, updateService, addService, updateProfessional,
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
