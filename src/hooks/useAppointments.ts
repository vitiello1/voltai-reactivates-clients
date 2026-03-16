import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Appointment } from '@/lib/mock-data';

export function useAppointments(professionalId: string | undefined) {
  return useQuery({
    queryKey: ['appointments', professionalId],
    queryFn: async () => {
      if (!professionalId) return [];
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('professional_id', professionalId)
        .order('date', { ascending: false });
      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!professionalId,
  });
}

export function useAddAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (appointment: Omit<Appointment, 'id' | 'created_at'>) => {
      const { error } = await supabase.from('appointments').insert(appointment);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}
