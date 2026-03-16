import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Service } from '@/lib/mock-data';

export function useServices(professionalId: string | undefined) {
  return useQuery({
    queryKey: ['services', professionalId],
    queryFn: async () => {
      if (!professionalId) return [];
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('professional_id', professionalId)
        .order('name');
      if (error) throw error;
      return data as Service[];
    },
    enabled: !!professionalId,
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Service> }) => {
      const { error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
}

export function useAddService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (service: Omit<Service, 'id' | 'created_at'>) => {
      const { error } = await supabase.from('services').insert(service);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
}
