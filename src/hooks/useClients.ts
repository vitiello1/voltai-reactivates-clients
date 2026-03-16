import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Client } from '@/lib/mock-data';

export function useClients(professionalId: string | undefined) {
  return useQuery({
    queryKey: ['clients', professionalId],
    queryFn: async () => {
      if (!professionalId) return [];
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('professional_id', professionalId)
        .order('name');
      if (error) throw error;
      return data as Client[];
    },
    enabled: !!professionalId,
  });
}

export function useAddClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (client: Omit<Client, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('clients')
        .insert(client)
        .select()
        .single();
      if (error) throw error;
      return data as Client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}
