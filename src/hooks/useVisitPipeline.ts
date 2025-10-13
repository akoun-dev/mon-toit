import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { PipelineStage, PipelineProspect } from '@/types';

export const usePipelineStages = () => {
  return useQuery({
    queryKey: ['pipeline-stages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visit_pipeline_stages')
        .select('*')
        .eq('is_active', true)
        .order('stage_order');

      if (error) throw error;
      return data as PipelineStage[];
    },
  });
};

export const usePipelineProspects = (filters?: {
  propertyId?: string;
  stageId?: string;
  leadTemperature?: string;
}) => {
  return useQuery({
    queryKey: ['pipeline-prospects', filters],
    queryFn: async () => {
      let query = supabase
        .from('visit_pipeline_movements')
        .select(`
          *,
          visitor:visitor_id (
            full_name,
            avatar_url,
            phone
          ),
          property:property_id (
            title,
            monthly_rent
          ),
          stage:current_stage_id (
            stage_name,
            stage_key,
            stage_color,
            stage_order
          )
        `)
        .order('created_at', { ascending: false });

      if (filters?.propertyId) {
        query = query.eq('property_id', filters.propertyId);
      }

      if (filters?.stageId) {
        query = query.eq('current_stage_id', filters.stageId);
      }

      if (filters?.leadTemperature) {
        query = query.eq('lead_temperature', filters.leadTemperature);
      }

      const { data, error } = await query;

      if (error) throw error;

      const latestProspects = data.reduce((acc, movement) => {
        const key = `${movement.visitor_id}-${movement.property_id}`;
        if (!acc[key] || new Date(movement.created_at) > new Date(acc[key].created_at)) {
          acc[key] = movement;
        }
        return acc;
      }, {} as Record<string, any>);

      return Object.values(latestProspects) as PipelineProspect[];
    },
  });
};

export const useMoveProspect = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      visitorId,
      propertyId,
      newStageId,
      reason,
    }: {
      visitorId: string;
      propertyId: string;
      newStageId: string;
      reason?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const currentStage = await supabase.rpc('get_current_pipeline_stage', {
        p_visitor_id: visitorId,
        p_property_id: propertyId,
      });

      const { data, error } = await supabase
        .from('visit_pipeline_movements')
        .insert({
          visitor_id: visitorId,
          property_id: propertyId,
          current_stage_id: newStageId,
          previous_stage_id: currentStage.data,
          moved_by: user.id,
          movement_type: 'manual',
          movement_reason: reason,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-prospects'] });
      toast.success('Prospect déplacé');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
};

export const useUpdateProspectMetadata = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: {
        lead_temperature?: string;
        conversion_probability?: number;
        total_interactions?: number;
        last_interaction_at?: string;
      };
    }) => {
      const { data, error } = await supabase
        .from('visit_pipeline_movements')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-prospects'] });
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
};
