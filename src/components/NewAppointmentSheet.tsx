import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

interface NewAppointmentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedClientId?: string;
}

export function NewAppointmentSheet({ open, onOpenChange, preselectedClientId }: NewAppointmentSheetProps) {
  const { clients, services, addAppointment, addClient } = useApp();
  const [search, setSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState(preselectedClientId || '');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [showResults, setShowResults] = useState(false);

  const filteredClients = useMemo(() => {
    if (!search.trim()) return [];
    return clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [search, clients]);

  const selectedService = services.find(s => s.id === selectedServiceId);
  const returnDate = useMemo(() => {
    if (!selectedServiceId || !date) return null;
    const service = services.find(s => s.id === selectedServiceId);
    if (!service) return null;
    const d = new Date(date);
    d.setDate(d.getDate() + service.interval_days);
    return { date: d.toLocaleDateString('pt-BR'), days: service.interval_days };
  }, [selectedServiceId, date, services]);

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const handleSave = () => {
    let clientId = selectedClientId;
    if (showNewClient) {
      if (!newClientName.trim() || !newClientPhone.trim()) {
        toast.error('Preencha nome e telefone do cliente');
        return;
      }
      const newClient = addClient(newClientName.trim(), newClientPhone.trim());
      clientId = newClient.id;
    }
    if (!clientId || !selectedServiceId || !date) {
      toast.error('Preencha todos os campos');
      return;
    }
    addAppointment(clientId, selectedServiceId, date);
    toast.success('Atendimento registrado!');
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setSearch('');
    setSelectedClientId('');
    setSelectedServiceId('');
    setDate(new Date().toISOString().split('T')[0]);
    setShowNewClient(false);
    setNewClientName('');
    setNewClientPhone('');
  };

  const selectClient = (id: string) => {
    setSelectedClientId(id);
    setSearch('');
    setShowResults(false);
    setShowNewClient(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-modal px-5 pb-8 max-h-[85vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="w-10 h-1 bg-muted rounded-pill mx-auto mb-3" />
          <SheetTitle className="heading-md text-left">Novo Atendimento</SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          {/* Client search */}
          {!showNewClient && !selectedClient && (
            <div className="relative">
              <label className="label-text text-muted-foreground mb-1.5 block">Cliente</label>
              <Input
                value={search}
                onChange={e => { setSearch(e.target.value); setShowResults(true); }}
                onFocus={() => setShowResults(true)}
                placeholder="Buscar cliente pelo nome..."
                className="h-12 rounded-md bg-card"
              />
              {showResults && search.trim() && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-surface rounded-card shadow-modal border border-border max-h-48 overflow-y-auto">
                  {filteredClients.map(c => (
                    <button
                      key={c.id}
                      onClick={() => selectClient(c.id)}
                      className="w-full px-4 py-3 text-left body-sm hover:bg-muted transition-colors"
                    >
                      {c.name}
                    </button>
                  ))}
                  <button
                    onClick={() => { setShowNewClient(true); setShowResults(false); setNewClientName(search); }}
                    className="w-full px-4 py-3 text-left body-sm text-primary font-medium flex items-center gap-2 hover:bg-primary-light transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Novo cliente
                  </button>
                </div>
              )}
            </div>
          )}

          {selectedClient && !showNewClient && (
            <div>
              <label className="label-text text-muted-foreground mb-1.5 block">Cliente</label>
              <div className="flex items-center justify-between h-12 px-3 bg-primary-light rounded-md">
                <span className="body-lg font-medium">{selectedClient.name}</span>
                <button onClick={() => { setSelectedClientId(''); setSearch(''); }} className="label-text text-primary">Trocar</button>
              </div>
            </div>
          )}

          {showNewClient && (
            <div className="space-y-3 p-4 bg-card rounded-card">
              <p className="label-text text-primary font-semibold">Novo cliente</p>
              <Input
                value={newClientName}
                onChange={e => setNewClientName(e.target.value)}
                placeholder="Nome do cliente"
                className="h-11 rounded-md bg-surface"
              />
              <Input
                value={newClientPhone}
                onChange={e => setNewClientPhone(e.target.value)}
                placeholder="Telefone (WhatsApp)"
                className="h-11 rounded-md bg-surface"
              />
              <button onClick={() => { setShowNewClient(false); setNewClientName(''); setNewClientPhone(''); }} className="label-text text-muted-foreground">
                ← Buscar cliente existente
              </button>
            </div>
          )}

          {/* Service */}
          <div>
            <label className="label-text text-muted-foreground mb-1.5 block">Serviço</label>
            <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
              <SelectTrigger className="h-12 rounded-md bg-card">
                <SelectValue placeholder="Selecione o serviço" />
              </SelectTrigger>
              <SelectContent>
                {services.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name} ({s.interval_days} dias)</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div>
            <label className="label-text text-muted-foreground mb-1.5 block">Data</label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-12 rounded-md bg-card" />
          </div>

          {/* Return date preview */}
          {returnDate && (
            <div className="p-3 bg-primary-light rounded-md">
              <p className="body-sm text-primary font-medium">
                Retorno previsto: {returnDate.date} ({returnDate.days} dias)
              </p>
            </div>
          )}

          <Button onClick={handleSave} size="lg" className="w-full h-12 text-[16px] font-semibold rounded-md mt-2">
            SALVAR ATENDIMENTO
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
