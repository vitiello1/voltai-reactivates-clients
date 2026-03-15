import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { FAB } from '@/components/FAB';
import { NewAppointmentSheet } from '@/components/NewAppointmentSheet';
import { ArrowLeft, Phone, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ClientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { clientsWithStatus, appointments, services, reminders, addReminder, markReturned } = useApp();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const client = clientsWithStatus.find(c => c.id === id);
  if (!client) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="body-lg text-muted-foreground">Cliente não encontrado</p>
      </div>
    );
  }

  const clientAppointments = appointments
    .filter(a => a.client_id === id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSendReminder = () => {
    setSending(true);
    setTimeout(() => {
      const lastAppt = clientAppointments[0];
      if (lastAppt) {
        addReminder(lastAppt.id, 'sent');
        toast.success(`Lembrete enviado para ${client.name}!`);
      }
      setSending(false);
    }, 1500);
  };

  const handleMarkReturned = () => {
    markReturned(client.id);
    toast.success(`Ótimo! ${client.name} marcado como retornou`);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <button onClick={() => navigate(-1)} className="text-muted-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="heading-md flex-1 text-center">{client.name}</h1>
        <button className="text-muted-foreground">
          <Pencil className="w-4 h-4" />
        </button>
      </div>

      {/* Info */}
      <div className="px-5 space-y-3 mb-6">
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-status-green" />
          <span className="body-sm">{client.phone}</span>
        </div>
        <StatusBadge status={client.status} />
        {client.lastService !== 'Sem atendimento' && (
          <p className="body-sm text-muted-foreground">
            Último: {client.lastService} — {client.lastDate ? new Date(client.lastDate).toLocaleDateString('pt-BR') : ''}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 space-y-3 mb-8">
        <Button
          onClick={handleSendReminder}
          disabled={sending}
          size="lg"
          className="w-full h-12 text-[15px] font-semibold rounded-md"
        >
          {sending ? 'Enviando...' : 'ENVIAR LEMBRETE AGORA'}
        </Button>
        <Button
          onClick={handleMarkReturned}
          variant="outline-green"
          size="lg"
          className="w-full h-12 text-[15px] font-semibold rounded-md"
        >
          MARCAR COMO RETORNOU
        </Button>
      </div>

      {/* History */}
      <div className="px-5">
        <h2 className="heading-md mb-4">Histórico</h2>
        {clientAppointments.length === 0 ? (
          <p className="body-sm text-muted-foreground">Nenhum atendimento registrado</p>
        ) : (
          <div className="space-y-3">
            {clientAppointments.map(appt => {
              const service = services.find(s => s.id === appt.service_id);
              const apptReminders = reminders.filter(r => r.appointment_id === appt.id);
              return (
                <div key={appt.id} className="p-4 bg-surface rounded-card shadow-card">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="body-lg font-medium">{service?.name || 'Serviço'}</p>
                      <p className="body-sm text-muted-foreground">{new Date(appt.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  {apptReminders.map(r => (
                    <div key={r.id} className="mt-2">
                      <span className={cn(
                        'label-text',
                        r.status === 'sent' ? 'text-status-green' : 'text-status-red'
                      )}>
                        {r.status === 'sent' ? 'Lembrete enviado ✓' : 'Lembrete falhou ✗'}
                      </span>
                      {r.returned_at && (
                        <span className="label-text text-status-green ml-3">Cliente retornou ✓</span>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <FAB onClick={() => setSheetOpen(true)} label="Registrar atendimento" />
      <NewAppointmentSheet open={sheetOpen} onOpenChange={setSheetOpen} preselectedClientId={id} />
    </div>
  );
}
