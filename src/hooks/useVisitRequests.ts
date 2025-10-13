import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { VisitRequest, VisitRequestWithDetails } from '@/types';

export const useVisitRequests = (filters?: {
  propertyId?: string;
  requesterId?: string;
  status?: string;
}) => {
  return useQuery({
    queryKey: ['visit-requests', filters],
    queryFn: async () => {
      let query = supabase
        .from('property_visit_requests')
        .select(`
          *,
          properties (
            title,
            monthly_rent,
            city,
            main_image
          ),
          profiles:requester_id (
            full_name,
            phone,
            avatar_url,
            is_verified,
            oneci_verified,
            cnam_verified
          )
        `)
        .order('priority_score', { ascending: false })
        .order('created_at', { ascending: false });

      if (filters?.propertyId) {
        query = query.eq('property_id', filters.propertyId);
      }

      if (filters?.requesterId) {
        query = query.eq('requester_id', filters.requesterId);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as VisitRequestWithDetails[];
    },
  });
};

export const useCreateVisitRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestData: {
      property_id: string;
      request_type: 'flexible' | 'specific';
      preferred_dates?: any;
      specific_slot_id?: string;
      availability_notes?: string;
      visitor_count: number;
      motivation?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('property_visit_requests')
        .insert({
          ...requestData,
          requester_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as VisitRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-requests'] });
      toast.success('Demande de visite envoyée avec succès');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
};

export const useRespondToRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      status,
      agentResponse,
      proposedSlots,
    }: {
      requestId: string;
      status: 'accepted' | 'declined';
      agentResponse: string;
      proposedSlots?: any;
    }) => {
      const { data, error } = await supabase
        .from('property_visit_requests')
        .update({
          status,
          agent_response: agentResponse,
          agent_response_at: new Date().toISOString(),
          proposed_slots: proposedSlots,
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-requests'] });
      toast.success('Réponse envoyée');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
};

export const useExpireStaleRequests = () => {
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('expire_stale_visit_requests');
      if (error) throw error;
    },
  });
};
