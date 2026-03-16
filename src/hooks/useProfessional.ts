import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Professional } from '@/lib/mock-data';

export function useProfessional(userId: string | undefined) {
  return useQuery({
    queryKey: ['professional', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw error;
      return data as Professional;
    },
    enabled: !!userId,
  });
}

export function useUpdateProfessional() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Professional> }) => {
      const { error } = await supabase
        .from('professionals')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['professional', id] });
    },
  });
}
