import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Reminder } from '@/lib/mock-data';

export function useReminders(professionalId: string | undefined) {
  return useQuery({
    queryKey: ['reminders', professionalId],
    queryFn: async () => {
      if (!professionalId) return [];
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('professional_id', professionalId)
        .order('sent_at', { ascending: false });
      if (error) throw error;
      return data as Reminder[];
    },
    enabled: !!professionalId,
  });
}

export function useAddReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reminder: Omit<Reminder, 'id' | 'created_at'>) => {
      const { error } = await supabase.from('reminders').insert(reminder);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}

export function useMarkReturned() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reminderId: string) => {
      const { error } = await supabase
        .from('reminders')
        .update({ returned_at: new Date().toISOString() })
        .eq('id', reminderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}
