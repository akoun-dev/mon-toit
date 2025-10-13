import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface VisitRequest {
  id: string;
  property_id: string;
  requester_id: string;
  request_type: 'flexible' | 'specific';
  preferred_dates: string[] | null;
  specific_slot_id: string | null;
  availability_notes: string | null;
  visitor_count: number;
  motivation: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'converted';
  priority_score: number;
  score_breakdown: Record<string, any> | null;
  agent_response: string | null;
  agent_response_at: string | null;
  proposed_slots: any[] | null;
  selected_slot_id: string | null;
  expires_at: string;
  converted_to_booking_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateVisitRequestData {
  property_id: string;
  request_type: 'flexible' | 'specific';
  visitor_count: number;
  motivation?: string | null;
  preferred_dates?: string[] | null;
  availability_notes?: string | null;
  specific_slot_id?: string | null;
}

export interface UpdateVisitRequestData {
  status?: 'pending' | 'accepted' | 'declined' | 'expired' | 'converted';
  agent_response?: string;
  proposed_slots?: any[];
  selected_slot_id?: string;
}

export const useVisitRequests = (filters?: {
  propertyId?: string;
  requesterId?: string;
  status?: string;
  sortByPriority?: boolean;
}) => {
  return useQuery({
    queryKey: ['visit-requests', filters],
    queryFn: async () => {
      let query = supabase
        .from('property_visit_requests')
        .select(`
          *,
          property:properties(id, title, address, city, type, price),
          requester:profiles!property_visit_requests_requester_id_fkey(
            id,
            full_name,
            avatar_url,
            is_verified
          )
        `);

      if (filters?.propertyId) {
        query = query.eq('property_id', filters.propertyId);
      }

      if (filters?.requesterId) {
        query = query.eq('requester_id', filters.requesterId);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.sortByPriority) {
        query = query.order('priority_score', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching visit requests:', error);
        throw new Error(`Erreur lors de la récupération des demandes: ${error.message}`);
      }

      return data as VisitRequest[];
    },
    staleTime: 30000,
  });
};

export const useVisitRequestById = (requestId: string | undefined) => {
  return useQuery({
    queryKey: ['visit-request', requestId],
    queryFn: async () => {
      if (!requestId) throw new Error('Request ID is required');

      const { data, error } = await supabase
        .from('property_visit_requests')
        .select(`
          *,
          property:properties(id, title, address, city, type, price, owner_id),
          requester:profiles!property_visit_requests_requester_id_fkey(
            id,
            full_name,
            avatar_url,
            phone,
            email,
            is_verified
          )
        `)
        .eq('id', requestId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching visit request:', error);
        throw new Error(`Erreur lors de la récupération de la demande: ${error.message}`);
      }

      if (!data) {
        throw new Error('Demande de visite introuvable');
      }

      return data as VisitRequest;
    },
    enabled: !!requestId,
  });
};

export const useCreateVisitRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestData: CreateVisitRequestData) => {
      console.log('Creating visit request:', requestData);

      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('Vous devez être connecté pour faire une demande de visite');
      }

      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('id, status, owner_id, title')
        .eq('id', requestData.property_id)
        .maybeSingle();

      if (propertyError) {
        console.error('Error checking property:', propertyError);
        throw new Error(`Erreur lors de la vérification de la propriété: ${propertyError.message}`);
      }

      if (!property) {
        throw new Error('Cette propriété n\'existe pas ou n\'est plus disponible');
      }

      if (property.status !== 'disponible') {
        throw new Error(`Cette propriété n'est plus disponible pour les visites (statut: ${property.status})`);
      }

      if (property.owner_id === user.id) {
        throw new Error('Vous ne pouvez pas demander une visite de votre propre propriété');
      }

      const { data: existingRequest, error: existingError } = await supabase
        .from('property_visit_requests')
        .select('id, status')
        .eq('property_id', requestData.property_id)
        .eq('requester_id', user.id)
        .in('status', ['pending', 'accepted'])
        .maybeSingle();

      if (existingError && existingError.code !== 'PGRST116') {
        console.error('Error checking existing requests:', existingError);
      }

      if (existingRequest) {
        const statusText = existingRequest.status === 'pending' ? 'en attente' : 'acceptée';
        throw new Error(`Vous avez déjà une demande ${statusText} pour cette propriété`);
      }

      const insertData = {
        ...requestData,
        requester_id: user.id,
        motivation: requestData.motivation || null,
        preferred_dates: requestData.preferred_dates || null,
        availability_notes: requestData.availability_notes || null,
        specific_slot_id: requestData.specific_slot_id || null,
      };

      const { data, error } = await supabase
        .from('property_visit_requests')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Error creating visit request:', error);

        if (error.code === '23503') {
          throw new Error('Référence invalide. Veuillez réessayer ou actualiser la page.');
        }

        if (error.code === '23505') {
          throw new Error('Vous avez déjà une demande en cours pour cette propriété');
        }

        if (error.code === '23514') {
          throw new Error('Données invalides. Veuillez vérifier votre saisie.');
        }

        throw new Error(`Erreur lors de la création de la demande: ${error.message}`);
      }

      console.log('Visit request created successfully:', data);
      return data as VisitRequest;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['visit-requests'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });

      toast.success('Demande de visite envoyée avec succès', {
        description: 'Vous recevrez une réponse sous 48 heures maximum',
      });
    },
    onError: (error: Error) => {
      console.error('Visit request creation failed:', error);

      toast.error('Erreur lors de l\'envoi de la demande', {
        description: error.message,
      });
    },
  });
};

export const useUpdateVisitRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      updates
    }: {
      requestId: string;
      updates: UpdateVisitRequestData
    }) => {
      console.log('Updating visit request:', requestId, updates);

      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('Vous devez être connecté pour modifier une demande');
      }

      const { data: request, error: fetchError } = await supabase
        .from('property_visit_requests')
        .select('id, requester_id, property_id, properties(owner_id)')
        .eq('id', requestId)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching request:', fetchError);
        throw new Error(`Erreur lors de la récupération de la demande: ${fetchError.message}`);
      }

      if (!request) {
        throw new Error('Demande de visite introuvable');
      }

      const isOwner = request.properties?.owner_id === user.id;
      const isRequester = request.requester_id === user.id;

      if (!isOwner && !isRequester) {
        throw new Error('Vous n\'êtes pas autorisé à modifier cette demande');
      }

      const updateData: any = { ...updates };

      if (updates.agent_response) {
        updateData.agent_response_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('property_visit_requests')
        .update(updateData)
        .eq('id', requestId)
        .select()
        .single();

      if (error) {
        console.error('Error updating visit request:', error);
        throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
      }

      console.log('Visit request updated successfully:', data);
      return data as VisitRequest;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['visit-requests'] });
      queryClient.invalidateQueries({ queryKey: ['visit-request', variables.requestId] });

      const statusMessages: Record<string, string> = {
        accepted: 'Demande acceptée avec succès',
        declined: 'Demande refusée',
        converted: 'Visite confirmée et convertie en réservation',
      };

      const message = variables.updates.status
        ? statusMessages[variables.updates.status] || 'Demande mise à jour'
        : 'Demande mise à jour avec succès';

      toast.success(message);
    },
    onError: (error: Error) => {
      console.error('Visit request update failed:', error);

      toast.error('Erreur lors de la mise à jour', {
        description: error.message,
      });
    },
  });
};

export const useDeleteVisitRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      console.log('Deleting visit request:', requestId);

      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('Vous devez être connecté');
      }

      const { data: request, error: fetchError } = await supabase
        .from('property_visit_requests')
        .select('id, requester_id, status')
        .eq('id', requestId)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching request:', fetchError);
        throw new Error(`Erreur: ${fetchError.message}`);
      }

      if (!request) {
        throw new Error('Demande introuvable');
      }

      if (request.requester_id !== user.id) {
        throw new Error('Vous ne pouvez pas supprimer cette demande');
      }

      if (request.status === 'accepted' || request.status === 'converted') {
        throw new Error('Vous ne pouvez pas supprimer une demande acceptée ou convertie');
      }

      const { error } = await supabase
        .from('property_visit_requests')
        .delete()
        .eq('id', requestId);

      if (error) {
        console.error('Error deleting visit request:', error);
        throw new Error(`Erreur lors de la suppression: ${error.message}`);
      }

      return requestId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-requests'] });
      toast.success('Demande supprimée avec succès');
    },
    onError: (error: Error) => {
      console.error('Visit request deletion failed:', error);
      toast.error('Erreur lors de la suppression', {
        description: error.message,
      });
    },
  });
};
