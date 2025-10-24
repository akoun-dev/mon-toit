import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/services/logger';

export interface MaintenanceRequest {
  id: string;
  property_id: string;
  tenant_id: string | null;
  owner_id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'rejected' | 'cancelled';
  category?: 'plumbing' | 'electrical' | 'hvac' | 'appliances' | 'structural' | 'pest_control' | 'cleaning' | 'other';
  estimated_cost?: number;
  actual_cost?: number;
  images?: string[];
  documents?: string[];
  owner_notes?: string;
  tenant_notes?: string;
  scheduled_date?: string;
  completed_at?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  // Données jointes
  property?: {
    title: string;
    address: string;
  };
  tenant?: {
    full_name: string;
    phone: string;
  };
  assigned_user?: {
    full_name: string;
    user_type: string;
  };
}

export interface MaintenanceRequestInput {
  property_id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: 'plumbing' | 'electrical' | 'hvac' | 'appliances' | 'structural' | 'pest_control' | 'cleaning' | 'other';
  estimated_cost?: number;
  images?: string[];
  documents?: string[];
  scheduled_date?: string;
}

/**
 * Hook pour gérer les demandes de maintenance
 */
export const useMaintenanceRequests = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Récupérer toutes les demandes de maintenance de l'utilisateur (propriétaire ou locataire)
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['maintenance-requests', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          property:properties(title, address),
          tenant:profiles!tenant_id(full_name, phone),
          assigned_user:profiles!assigned_to(full_name, user_type)
        `)
        .or(`owner_id.eq.${user.id},tenant_id.eq.${user.id},assigned_to.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as MaintenanceRequest[];
    },
    enabled: !!user,
  });

  // Créer une nouvelle demande de maintenance
  const createRequest = useMutation({
    mutationFn: async (requestData: MaintenanceRequestInput) => {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .insert({
          ...requestData,
          owner_id: user?.id, // Sera mis à jour par RLS si c'est un locataire
          tenant_id: user?.id, // Sera mis à jour par RLS si c'est un locataire
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] });
      toast({
        title: "Demande créée",
        description: "Votre demande de maintenance a été envoyée avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Impossible de créer la demande: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mettre à jour une demande de maintenance
  const updateRequest = useMutation({
    mutationFn: async ({
      requestId,
      updates
    }: {
      requestId: string;
      updates: Partial<MaintenanceRequest>;
    }) => {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .update(updates)
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] });
      toast({
        title: "Demande mise à jour",
        description: "La demande de maintenance a été mise à jour",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Impossible de mettre à jour la demande: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Approuver une demande
  const approveRequest = useMutation({
    mutationFn: async ({
      requestId,
      notes,
      estimatedCost,
      scheduledDate
    }: {
      requestId: string;
      notes?: string;
      estimatedCost?: number;
      scheduledDate?: string;
    }) => {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .update({
          status: 'approved',
          owner_notes: notes,
          estimated_cost: estimatedCost,
          scheduled_date: scheduledDate,
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] });
      toast({
        title: "Demande approuvée",
        description: "La demande de maintenance a été approuvée",
      });
      logger.info('Maintenance request approved', { requestId: variables.requestId });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Impossible d'approuver la demande: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Commencer les travaux
  const startWork = useMutation({
    mutationFn: async ({
      requestId,
      assignedTo
    }: {
      requestId: string;
      assignedTo?: string;
    }) => {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .update({
          status: 'in_progress',
          assigned_to: assignedTo,
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] });
      toast({
        title: "Travaux commencés",
        description: "Les travaux de maintenance ont commencé",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Impossible de commencer les travaux: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Compléter une demande
  const completeRequest = useMutation({
    mutationFn: async ({
      requestId,
      actualCost,
      notes
    }: {
      requestId: string;
      actualCost?: number;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .update({
          status: 'completed',
          actual_cost: actualCost,
          completed_at: new Date().toISOString(),
          owner_notes: notes,
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] });
      toast({
        title: "Travaux terminés",
        description: "Les travaux de maintenance ont été complétés",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Impossible de terminer les travaux: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Rejeter une demande
  const rejectRequest = useMutation({
    mutationFn: async ({
      requestId,
      reason
    }: {
      requestId: string;
      reason: string;
    }) => {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .update({
          status: 'rejected',
          owner_notes: reason,
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] });
      toast({
        title: "Demande rejetée",
        description: "La demande de maintenance a été rejetée",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Impossible de rejeter la demande: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Filtrer les demandes par statut
  const pendingRequests = requests.filter(r => r.status === 'pending');
  const inProgressRequests = requests.filter(r => r.status === 'in_progress');
  const completedRequests = requests.filter(r => r.status === 'completed');
  const urgentRequests = requests.filter(r => r.priority === 'urgent' && r.status !== 'completed');

  return {
    requests,
    isLoading,
    pendingRequests,
    inProgressRequests,
    completedRequests,
    urgentRequests,
    createRequest: createRequest.mutate,
    updateRequest: updateRequest.mutate,
    approveRequest: approveRequest.mutate,
    startWork: startWork.mutate,
    completeRequest: completeRequest.mutate,
    rejectRequest: rejectRequest.mutate,
  };
};