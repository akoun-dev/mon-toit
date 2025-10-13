import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AgentAnnotation } from '@/types';

export const useAgentAnnotations = (filters?: {
  bookingId?: string;
  agentId?: string;
  propertyId?: string;
}) => {
  return useQuery({
    queryKey: ['agent-annotations', filters],
    queryFn: async () => {
      let query = supabase
        .from('visit_agent_annotations')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.bookingId) {
        query = query.eq('booking_id', filters.bookingId);
      }

      if (filters?.agentId) {
        query = query.eq('agent_id', filters.agentId);
      }

      if (filters?.propertyId) {
        query = query.eq('property_id', filters.propertyId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AgentAnnotation[];
    },
  });
};

export const useCreateAnnotation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (annotationData: Omit<AgentAnnotation, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('visit_agent_annotations')
        .insert(annotationData)
        .select()
        .single();

      if (error) throw error;
      return data as AgentAnnotation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-annotations'] });
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-movements'] });
      toast.success('Annotations enregistrées avec succès');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
};

export const useUpdateAnnotation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<AgentAnnotation>;
    }) => {
      const { data, error } = await supabase
        .from('visit_agent_annotations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as AgentAnnotation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-annotations'] });
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
      toast.success('Annotations mises à jour');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
};
