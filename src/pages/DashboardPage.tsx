import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { FAB } from '@/components/FAB';
import { StatusDot } from '@/components/StatusBadge';
import { SkeletonList } from '@/components/SkeletonList';
import { NewAppointmentSheet } from '@/components/NewAppointmentSheet';
import { Settings, Calendar } from 'lucide-react';
import { ClientStatus } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

type FilterTab = 'todos' | 'inativo' | 'atencao' | 'em_dia';

const tabs: { key: FilterTab; label: string; emoji?: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'inativo', label: 'Inativos', emoji: '🔴' },
  { key: 'atencao', label: 'Atenção', emoji: '🟡' },
  { key: 'em_dia', label: 'Em dia', emoji: '🟢' },
];

export default function DashboardPage() {
  const { professional, clientsWithStatus, isAuthenticated } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<FilterTab>('inativo');
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/'); return; }
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, [isAuthenticated, navigate]);

  const filtered = activeTab === 'todos'
    ? clientsWithStatus
    : clientsWithStatus.filter(c => c.status === activeTab);

  const counts: Record<FilterTab, number> = {
    todos: clientsWithStatus.length,
    inativo: clientsWithStatus.filter(c => c.status === 'inativo').length,
    atencao: clientsWithStatus.filter(c => c.status === 'atencao').length,
    em_dia: clientsWithStatus.filter(c => c.status === 'em_dia').length,
  };

  const attentionCount = counts.inativo + counts.atencao;

  const daysInfoColor = (status: ClientStatus) => {
    if (status === 'inativo') return 'text-status-red';
    if (status === 'atencao') return 'text-status-orange';
    return 'text-status-green';
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h1 className="heading-md text-primary">Voltai</h1>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center">
            <span className="label-text text-primary font-bold">{professional?.name?.charAt(0) || 'V'}</span>
          </div>
          <button onClick={() => navigate('/settings')} className="text-muted-foreground">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Greeting */}
      <div className="px-5 pb-4">
        <h2 className="heading-lg">Olá, {professional?.name || 'Profissional'}!</h2>
        {attentionCount > 0 && (
          <p className="body-sm text-muted-foreground mt-1">
            Você tem <span className="text-status-orange font-medium">{attentionCount} clientes</span> precisando de atenção
          </p>
        )}
      </div>

      {/* WhatsApp disconnect banner */}
      {professional && !professional.whatsapp_connected && (
        <div className="mx-5 mb-4 p-3 bg-status-red-bg rounded-card flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-status-red" />
          <span className="body-sm text-status-red flex-1">WhatsApp desconectado</span>
          <button onClick={() => navigate('/settings')} className="label-text text-status-red font-semibold">Reconectar</button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 px-5 pb-4 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-pill whitespace-nowrap body-sm transition-all',
              activeTab === tab.key
                ? 'bg-primary text-primary-foreground font-semibold'
                : 'bg-surface text-muted-foreground shadow-card'
            )}
          >
            {tab.emoji && <span>{tab.emoji}</span>}
            {tab.label}
            <span className={cn(
              'ml-1 px-1.5 py-0.5 rounded-pill label-text',
              activeTab === tab.key ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}>
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Client List */}
      <div className="px-5">
        {loading ? (
          <SkeletonList count={4} />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-primary-light rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-10 h-10 text-primary" />
            </div>
            <h3 className="heading-md mb-2">Nenhum cliente ainda</h3>
            <p className="body-sm text-muted-foreground mb-6">Comece registrando seu primeiro atendimento</p>
            <button onClick={() => setSheetOpen(true)} className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-semibold btn-press">
              REGISTRAR ATENDIMENTO
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map(client => (
              <button
                key={client.id}
                onClick={() => navigate(`/client/${client.id}`)}
                className="w-full flex items-center gap-3 p-4 bg-surface rounded-card shadow-card active:bg-muted transition-colors text-left"
              >
                <StatusDot status={client.status} />
                <div className="flex-1 min-w-0">
                  <p className="body-lg font-semibold truncate">{client.name}</p>
                  <p className="body-sm text-muted-foreground truncate">{client.lastService}</p>
                </div>
                <span className={cn('body-sm font-medium whitespace-nowrap', daysInfoColor(client.status))}>
                  {client.daysInfo}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <FAB onClick={() => setSheetOpen(true)} />
      <NewAppointmentSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}
