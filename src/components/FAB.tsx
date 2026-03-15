import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FABProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export function FAB({ onClick, label = "Registrar", className }: FABProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-primary text-primary-foreground',
        'px-5 py-3.5 rounded-pill shadow-fab',
        'hover:scale-105 active:scale-95 transition-transform duration-150',
        'font-semibold text-[15px]',
        className
      )}
    >
      <Plus className="w-5 h-5" />
      {label}
    </button>
  );
}
