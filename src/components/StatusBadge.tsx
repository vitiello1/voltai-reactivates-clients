import { cn } from '@/lib/utils';
import { ClientStatus } from '@/lib/mock-data';

const statusConfig: Record<ClientStatus, { label: string; dotClass: string; bgClass: string; textClass: string }> = {
  em_dia: { label: 'Em dia', dotClass: 'bg-status-green', bgClass: 'bg-status-green-bg', textClass: 'text-status-green' },
  atencao: { label: 'Atenção', dotClass: 'bg-status-orange', bgClass: 'bg-status-orange-bg', textClass: 'text-status-orange' },
  inativo: { label: 'Inativo', dotClass: 'bg-status-red', bgClass: 'bg-status-red-bg', textClass: 'text-status-red' },
};

interface StatusBadgeProps {
  status: ClientStatus;
  showDot?: boolean;
  className?: string;
}

export function StatusBadge({ status, showDot = true, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill label-text', config.bgClass, config.textClass, className)}>
      {showDot && <span className={cn('w-2 h-2 rounded-full', config.dotClass)} />}
      {config.label}
    </span>
  );
}

export function StatusDot({ status, className }: { status: ClientStatus; className?: string }) {
  const config = statusConfig[status];
  return <span className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', config.dotClass, className)} />;
}
