import { useState } from 'react';
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
import { CheckCircle2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Client } from '@/lib/mock-data';

interface ReturnedSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
  lastServiceId?: string;
}

export function ReturnedSheet({ open, onOpenChange, client, lastServiceId }: ReturnedSheetProps) {
  const { services, addAppointment, markReturned } = useApp();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedServices, setSelectedServices] = useState<string[]>(
    lastServiceId ? [lastServiceId] : []
  );
  const [addingExtra, setAddingExtra] = useState(false);
  const [extraServiceId, setExtraServiceId] = useState('');
  const [saving, setSaving] = useState(false);

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId) ? prev.filter(s => s !== serviceId) : [...prev, serviceId]
    );
  };

  const addExtraService = () => {
    if (extraServiceId && !selectedServices.includes(extraServiceId)) {
      setSelectedServices(prev => [...prev, extraServiceId]);
    }
    setExtraServiceId('');
    setAddingExtra(false);
  };

  const handleConfirm = async () => {
    if (selectedServices.length === 0) {
      toast.error('Selecione ao menos um serviço');
      return;
    }
    setSaving(true);
    try {
      // Mark reminder as returned (updates the last reminder)
      markReturned(client.id);
      // Add appointments for each selected service on the return date
      for (const serviceId of selectedServices) {
        await addAppointment(client.id, serviceId, date);
      }
      toast.success(`${client.name} marcado como retornou!`);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const availableForExtra = services.filter(s => !selectedServices.includes(s.id));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-modal px-5 pb-8 max-h-[85vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="w-10 h-1 bg-muted rounded-pill mx-auto mb-3" />
          <SheetTitle className="heading-md text-left">Cliente Retornou 🎉</SheetTitle>
        </SheetHeader>

        <div className="space-y-5">
          {/* Client name */}
          <div className="p-3 bg-primary-light rounded-md">
            <p className="body-lg font-semibold text-primary">{client.name}</p>
            <p className="label-text text-muted-foreground">{client.phone}</p>
          </div>

          {/* Date */}
          <div>
            <label className="label-text text-muted-foreground mb-1.5 block">Data do retorno</label>
            <Input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="h-12 rounded-md bg-card"
            />
          </div>

          {/* Services done */}
          <div>
            <label className="label-text text-muted-foreground mb-2 block">Serviço(s) realizado(s)</label>
            <div className="space-y-2">
              {services.map(s => (
                <button
                  key={s.id}
                  onClick={() => toggleService(s.id)}
                  className={`w-full flex items-center justify-between h-12 px-4 rounded-md border transition-colors ${
                    selectedServices.includes(s.id)
                      ? 'bg-primary-light border-primary'
                      : 'bg-card border-border'
                  }`}
                >
                  <span className="body-sm font-medium">{s.name}</span>
                  {selectedServices.includes(s.id) && (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Add extra service */}
          {!addingExtra && availableForExtra.length > 0 && (
            <button
              onClick={() => setAddingExtra(true)}
              className="flex items-center gap-2 label-text text-primary font-medium"
            >
              <Plus className="w-4 h-4" /> Adicionar outro serviço
            </button>
          )}

          {addingExtra && (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Select value={extraServiceId} onValueChange={setExtraServiceId}>
                  <SelectTrigger className="h-11 rounded-md bg-card">
                    <SelectValue placeholder="Selecione o serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableForExtra.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" onClick={addExtraService} disabled={!extraServiceId} className="h-11">
                Adicionar
              </Button>
              <button onClick={() => { setAddingExtra(false); setExtraServiceId(''); }}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          )}

          {/* Next reminder preview */}
          {selectedServices.length > 0 && (
            <div className="p-3 bg-card rounded-md space-y-1">
              <p className="label-text text-muted-foreground font-semibold">Próximos lembretes:</p>
              {selectedServices.map(sid => {
                const svc = services.find(s => s.id === sid);
                if (!svc) return null;
                const d = new Date(date);
                d.setDate(d.getDate() + svc.interval_days);
                return (
                  <p key={sid} className="body-sm">
                    {svc.name}: <span className="text-primary font-medium">{d.toLocaleDateString('pt-BR')}</span> ({svc.interval_days} dias)
                  </p>
                );
              })}
            </div>
          )}

          <Button
            onClick={handleConfirm}
            disabled={saving || selectedServices.length === 0}
            size="lg"
            className="w-full h-12 text-[16px] font-semibold rounded-md"
          >
            {saving ? 'Salvando...' : 'CONFIRMAR RETORNO'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
