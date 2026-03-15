import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ArrowLeft, Pencil, Plus, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { professional, services, updateService, addService, updateProfessional, logout } = useApp();

  const [editServiceId, setEditServiceId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDays, setEditDays] = useState('');

  const [templateServiceId, setTemplateServiceId] = useState<string | null>(null);
  const [templateText, setTemplateText] = useState('');

  const [addingService, setAddingService] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDays, setNewServiceDays] = useState('');

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [profName, setProfName] = useState(professional?.name || '');
  const [salonName, setSalonName] = useState(professional?.salon_name || '');

  const openEditService = (s: typeof services[0]) => {
    setEditServiceId(s.id);
    setEditName(s.name);
    setEditDays(String(s.interval_days));
  };

  const saveEditService = () => {
    if (!editServiceId || !editName.trim() || !editDays) return;
    updateService(editServiceId, { name: editName.trim(), interval_days: parseInt(editDays) });
    setEditServiceId(null);
    toast.success('Serviço atualizado!');
  };

  const openTemplate = (s: typeof services[0]) => {
    setTemplateServiceId(s.id);
    setTemplateText(s.message_template);
  };

  const saveTemplate = () => {
    if (!templateServiceId) return;
    updateService(templateServiceId, { message_template: templateText });
    setTemplateServiceId(null);
    toast.success('Template salvo!');
  };

  const handleAddService = () => {
    if (!newServiceName.trim() || !newServiceDays) return;
    addService(newServiceName.trim(), parseInt(newServiceDays));
    setAddingService(false);
    setNewServiceName('');
    setNewServiceDays('');
    toast.success('Serviço adicionado!');
  };

  const handleSaveProfile = () => {
    updateProfessional({ name: profName, salon_name: salonName });
    toast.success('Perfil atualizado!');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const previewTemplate = (template: string) => {
    return template
      .replace('{nome}', 'Maria')
      .replace('{serviço}', 'corte feminino')
      .replace('{dias}', '32');
  };

  const templateService = services.find(s => s.id === templateServiceId);

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-6">
        <button onClick={() => navigate(-1)} className="text-muted-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="heading-lg">Configurações</h1>
      </div>

      {/* WhatsApp */}
      <section className="px-5 mb-8">
        <h2 className="label-text text-muted-foreground mb-3 uppercase">WhatsApp</h2>
        <div className="p-4 bg-surface rounded-card shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="body-lg">{professional?.whatsapp_number || 'Não conectado'}</span>
            <div className="flex items-center gap-1.5">
              <span className={cn('w-2 h-2 rounded-full', professional?.whatsapp_connected ? 'bg-status-green' : 'bg-status-red')} />
              <span className={cn('label-text', professional?.whatsapp_connected ? 'text-status-green' : 'text-status-red')}>
                {professional?.whatsapp_connected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/onboarding')} className="w-full rounded-md">
            Reconectar WhatsApp
          </Button>
        </div>
      </section>

      {/* Services */}
      <section className="px-5 mb-8">
        <h2 className="label-text text-muted-foreground mb-3 uppercase">Serviços e Intervalos</h2>
        <div className="space-y-2">
          {services.map(s => (
            <div key={s.id} className="flex items-center justify-between p-4 bg-surface rounded-card shadow-card">
              <div>
                <p className="body-lg font-medium">{s.name}</p>
                <p className="body-sm text-muted-foreground">{s.interval_days} dias</p>
              </div>
              <button onClick={() => openEditService(s)} className="text-muted-foreground">
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => setAddingService(true)}
          className="flex items-center gap-1.5 mt-3 body-sm text-primary font-medium"
        >
          <Plus className="w-4 h-4" /> Adicionar serviço
        </button>
      </section>

      {/* Templates */}
      <section className="px-5 mb-8">
        <h2 className="label-text text-muted-foreground mb-3 uppercase">Templates de Mensagem</h2>
        <div className="space-y-2">
          {services.map(s => (
            <button
              key={s.id}
              onClick={() => openTemplate(s)}
              className="w-full text-left p-4 bg-surface rounded-card shadow-card"
            >
              <p className="body-lg font-medium mb-1">{s.name}</p>
              <p className="body-sm text-muted-foreground line-clamp-2">{s.message_template}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Account */}
      <section className="px-5 mb-8">
        <h2 className="label-text text-muted-foreground mb-3 uppercase">Conta</h2>
        <div className="p-4 bg-surface rounded-card shadow-card space-y-4">
          <div>
            <label className="label-text text-muted-foreground mb-1.5 block">Nome</label>
            <Input value={profName} onChange={e => setProfName(e.target.value)} className="h-11 rounded-md bg-card" />
          </div>
          <div>
            <label className="label-text text-muted-foreground mb-1.5 block">Salão</label>
            <Input value={salonName} onChange={e => setSalonName(e.target.value)} className="h-11 rounded-md bg-card" />
          </div>
          <div>
            <label className="label-text text-muted-foreground mb-1.5 block">E-mail</label>
            <Input value={professional?.email || ''} disabled className="h-11 rounded-md bg-muted" />
          </div>
          <Button variant="outline" onClick={handleSaveProfile} className="w-full rounded-md">Salvar alterações</Button>
        </div>
        <button onClick={() => setShowLogoutConfirm(true)} className="mt-4 body-sm text-status-red font-medium flex items-center gap-1.5">
          <LogOut className="w-4 h-4" /> Sair da conta
        </button>
      </section>

      {/* Edit Service Dialog */}
      <Dialog open={!!editServiceId} onOpenChange={() => setEditServiceId(null)}>
        <DialogContent className="rounded-modal">
          <DialogHeader>
            <DialogTitle className="heading-md">Editar Serviço</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="label-text text-muted-foreground mb-1.5 block">Nome</label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-11 rounded-md" />
            </div>
            <div>
              <label className="label-text text-muted-foreground mb-1.5 block">Intervalo (dias)</label>
              <Input type="number" value={editDays} onChange={e => setEditDays(e.target.value)} className="h-11 rounded-md" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveEditService} className="w-full rounded-md">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Service Dialog */}
      <Dialog open={addingService} onOpenChange={setAddingService}>
        <DialogContent className="rounded-modal">
          <DialogHeader>
            <DialogTitle className="heading-md">Novo Serviço</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="label-text text-muted-foreground mb-1.5 block">Nome</label>
              <Input value={newServiceName} onChange={e => setNewServiceName(e.target.value)} placeholder="Ex: Progressiva" className="h-11 rounded-md" />
            </div>
            <div>
              <label className="label-text text-muted-foreground mb-1.5 block">Intervalo (dias)</label>
              <Input type="number" value={newServiceDays} onChange={e => setNewServiceDays(e.target.value)} placeholder="Ex: 60" className="h-11 rounded-md" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddService} className="w-full rounded-md">Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Edit Dialog */}
      <Dialog open={!!templateServiceId} onOpenChange={() => setTemplateServiceId(null)}>
        <DialogContent className="rounded-modal max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="heading-md">{templateService?.name} — Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Textarea
              value={templateText}
              onChange={e => setTemplateText(e.target.value)}
              rows={5}
              className="rounded-md resize-none"
            />
            <p className="label-text text-muted-foreground">
              Variáveis: <span className="text-primary">{'{nome}'}</span> <span className="text-primary">{'{serviço}'}</span> <span className="text-primary">{'{dias}'}</span>
            </p>
            <div className="p-3 bg-status-green-bg rounded-card">
              <p className="label-text text-muted-foreground mb-1">Pré-visualização:</p>
              <p className="body-sm">{previewTemplate(templateText)}</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveTemplate} className="w-full rounded-md">SALVAR TEMPLATE</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logout Confirm */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent className="rounded-modal">
          <DialogHeader>
            <DialogTitle className="heading-md">Sair da conta?</DialogTitle>
          </DialogHeader>
          <p className="body-sm text-muted-foreground">Tem certeza que deseja sair?</p>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowLogoutConfirm(false)} className="flex-1 rounded-md">Cancelar</Button>
            <Button variant="destructive" onClick={handleLogout} className="flex-1 rounded-md">Sair</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
