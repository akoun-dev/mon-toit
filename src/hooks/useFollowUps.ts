import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { FollowUpTask } from '@/types';

export const useFollowUps = (filters?: {
  agentId?: string;
  status?: string;
  dueDateBefore?: string;
  dueDateAfter?: string;
}) => {
  return useQuery({
    queryKey: ['follow-ups', filters],
    queryFn: async () => {
      let query = supabase
        .from('visit_follow_ups')
        .select('*')
        .order('scheduled_date', { ascending: true });

      if (filters?.agentId) {
        query = query.eq('agent_id', filters.agentId);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.dueDateBefore) {
        query = query.lte('scheduled_date', filters.dueDateBefore);
      }

      if (filters?.dueDateAfter) {
        query = query.gte('scheduled_date', filters.dueDateAfter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as FollowUpTask[];
    },
  });
};

export const useCompleteFollowUp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      completedNotes,
    }: {
      id: string;
      completedNotes?: string;
    }) => {
      const { data, error } = await supabase
        .from('visit_follow_ups')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completed_notes: completedNotes,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as FollowUpTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
      toast.success('Tâche marquée comme terminée');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
};

export const useMarkOverdueFollowUps = () => {
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('mark_overdue_follow_ups');
      if (error) throw error;
    },
  });
};
