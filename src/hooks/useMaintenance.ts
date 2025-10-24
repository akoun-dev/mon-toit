import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface MaintenanceRequest {
  id: string;
  property_id: string;
  tenant_id: string;
  owner_id: string;
  lease_id?: string;
  assigned_to_id?: string;
  title: string;
  description: string;
  category: 'plumbing' | 'electrical' | 'hvac' | 'appliance' | 'structural' | 'pest_control' | 'cleaning' | 'gardening' | 'security' | 'other';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  location_details?: string;
  requested_at: string;
  preferred_date_start?: string;
  preferred_date_end?: string;
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  status: 'pending' | 'confirmed' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'rejected' | 'on_hold';
  resolution_details?: string;
  tenant_rating?: number;
  tenant_feedback?: string;
  estimated_cost?: number;
  actual_cost?: number;
  payment_required: boolean;
  payment_status?: 'pending' | 'paid' | 'waived';
  photos: string[];
  documents: string[];
  before_photos: string[];
  after_photos: string[];
  notes: Array<{
    id: string;
    author_id: string;
    author_name: string;
    content: string;
    created_at: string;
  }>;
  last_message_at?: string;
  message_count: number;
  metadata: Record<string, any>;
  access_instructions?: string;
  emergency_contact?: string;
  created_at: string;
  updated_at: string;

  // Relations (inclues via select)
  property?: {
    id: string;
    title: string;
    address: string;
    photos?: string[];
  };
  tenant?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    phone?: string;
  };
  owner?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    phone?: string;
  };
  assigned_to?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    phone?: string;
  };
}

export interface MaintenanceFormData {
  property_id: string;
  title: string;
  description: string;
  category: MaintenanceRequest['category'];
  priority?: MaintenanceRequest['priority'];
  location_details?: string;
  preferred_date_start?: Date;
  preferred_date_end?: Date;
  access_instructions?: string;
  emergency_contact?: string;
  photos?: File[];
  documents?: File[];
}

export interface MaintenanceNote {
  content: string;
  attachments?: File[];
}

/**
 * Hook pour la gestion des demandes de maintenance
 */
export const useMaintenance = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Récupérer les demandes de maintenance du locataire
  const {
    data: requests,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['maintenance-requests', user?.id],
    queryFn: async (): Promise<MaintenanceRequest[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          property:properties(id, title, address, photos),
          tenant:profiles!maintenance_requests_tenant_id_fkey(id, full_name, avatar_url, phone),
          owner:profiles!maintenance_requests_owner_id_fkey(id, full_name, avatar_url, phone),
          assigned_to:profiles!maintenance_requests_assigned_to_id_fkey(id, full_name, avatar_url, phone)
        `)
        .eq('tenant_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as MaintenanceRequest[];
    },
    enabled: !!user?.id
  });

  // Récupérer les demandes pour un propriétaire
  const getOwnerRequests = (ownerId: string) => {
    return useQuery({
      queryKey: ['maintenance-requests', 'owner', ownerId],
      queryFn: async (): Promise<MaintenanceRequest[]> => {
        const { data, error } = await supabase
          .from('maintenance_requests')
          .select(`
            *,
            property:properties(id, title, address, photos),
            tenant:profiles!maintenance_requests_tenant_id_fkey(id, full_name, avatar_url, phone),
            owner:profiles!maintenance_requests_owner_id_fkey(id, full_name, avatar_url, phone),
            assigned_to:profiles!maintenance_requests_assigned_to_id_fkey(id, full_name, avatar_url, phone)
          `)
          .eq('owner_id', ownerId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data as MaintenanceRequest[];
      },
      enabled: !!ownerId
    });
  };

  // Récupérer les statistiques de maintenance
  const {
    data: stats,
    isLoading: isLoadingStats
  } = useQuery({
    queryKey: ['maintenance-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return {
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        urgent: 0,
        avgResponseTime: 0,
        avgResolutionTime: 0
      };

      const { data, error } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq('tenant_id', user.id);

      if (error) throw error;

      const requests = data as MaintenanceRequest[];

      const total = requests.length;
      const pending = requests.filter(r => ['pending', 'confirmed', 'scheduled'].includes(r.status)).length;
      const inProgress = requests.filter(r => r.status === 'in_progress').length;
      const completed = requests.filter(r => r.status === 'completed').length;
      const urgent = requests.filter(r => r.priority === 'urgent').length;

      // Calculer temps de réponse moyen
      const responseTimes = requests
        .filter(r => r.scheduled_at)
        .map(r => new Date(r.scheduled_at!).getTime() - new Date(r.requested_at).getTime());
      const avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length / (1000 * 60 * 60) // en heures
        : 0;

      // Calculer temps de résolution moyen
      const resolutionTimes = requests
        .filter(r => r.completed_at)
        .map(r => new Date(r.completed_at!).getTime() - new Date(r.requested_at).getTime());
      const avgResolutionTime = resolutionTimes.length > 0
        ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length / (1000 * 60 * 60) // en heures
        : 0;

      return {
        total,
        pending,
        inProgress,
        completed,
        urgent,
        avgResponseTime,
        avgResolutionTime
      };
    },
    enabled: !!user?.id
  });

  // Créer une demande de maintenance
  const createRequest = useMutation({
    mutationFn: async (formData: MaintenanceFormData): Promise<MaintenanceRequest> => {
      if (!user?.id) throw new Error('Utilisateur non authentifié');

      // Uploader les photos
      const photoUrls: string[] = [];
      if (formData.photos) {
        for (const photo of formData.photos) {
          const fileExt = photo.name.split('.').pop();
          const fileName = `${user.id}/maintenance/${Date.now()}-photo.${fileExt}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('maintenance-files')
            .upload(fileName, photo);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('maintenance-files')
            .getPublicUrl(fileName);

          photoUrls.push(publicUrl);
        }
      }

      // Uploader les documents
      const documentUrls: string[] = [];
      if (formData.documents) {
        for (const doc of formData.documents) {
          const fileExt = doc.name.split('.').pop();
          const fileName = `${user.id}/maintenance/${Date.now()}-doc.${fileExt}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('maintenance-files')
            .upload(fileName, doc);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('maintenance-files')
            .getPublicUrl(fileName);

          documentUrls.push(publicUrl);
        }
      }

      // Récupérer le propriétaire du bien
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('owner_id')
        .eq('id', formData.property_id)
        .single();

      if (propertyError) throw propertyError;

      const requestData = {
        property_id: formData.property_id,
        tenant_id: user.id,
        owner_id: property.owner_id,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority || 'normal',
        location_details: formData.location_details,
        preferred_date_start: formData.preferred_date_start?.toISOString(),
        preferred_date_end: formData.preferred_date_end?.toISOString(),
        access_instructions: formData.access_instructions,
        emergency_contact: formData.emergency_contact,
        photos: photoUrls,
        documents: documentUrls,
        before_photos: photoUrls,
        notes: [],
        message_count: 0,
        metadata: {}
      };

      const { data, error } = await supabase
        .from('maintenance_requests')
        .insert(requestData)
        .select(`
          *,
          property:properties(id, title, address, photos),
          tenant:profiles!maintenance_requests_tenant_id_fkey(id, full_name, avatar_url, phone),
          owner:profiles!maintenance_requests_owner_id_fkey(id, full_name, avatar_url, phone)
        `)
        .single();

      if (error) throw error;
      return data as MaintenanceRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-stats', user?.id] });
    }
  });

  // Mettre à jour le statut d'une demande
  const updateStatus = useMutation({
    mutationFn: async ({ requestId, status, notes }: { requestId: string; status: MaintenanceRequest['status']; notes?: string }) => {
      const updateData: any = { status };

      // Ajouter les timestamps selon le statut
      if (status === 'scheduled') {
        updateData.scheduled_at = new Date().toISOString();
      } else if (status === 'in_progress') {
        updateData.started_at = new Date().toISOString();
      } else if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      // Ajouter des notes si fournies
      if (notes) {
        const { data: currentRequest } = await supabase
          .from('maintenance_requests')
          .select('notes')
          .eq('id', requestId)
          .single();

        const newNote = {
          id: crypto.randomUUID(),
          author_id: user?.id,
          author_name: user?.user_metadata?.full_name || 'Utilisateur',
          content: notes,
          created_at: new Date().toISOString()
        };

        updateData.notes = [...(currentRequest?.notes || []), newNote];
      }

      const { data, error } = await supabase
        .from('maintenance_requests')
        .update(updateData)
        .eq('id', requestId)
        .select(`
          *,
          property:properties(id, title, address, photos),
          tenant:profiles!maintenance_requests_tenant_id_fkey(id, full_name, avatar_url, phone),
          owner:profiles!maintenance_requests_owner_id_fkey(id, full_name, avatar_url, phone)
        `)
        .single();

      if (error) throw error;
      return data as MaintenanceRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-stats', user?.id] });
    }
  });

  // Ajouter une note à une demande
  const addNote = useMutation({
    mutationFn: async ({ requestId, note, attachments }: { requestId: string; note: string; attachments?: File[] }) => {
      // Uploader les pièces jointes si présentes
      const attachmentUrls: string[] = [];
      if (attachments) {
        for (const attachment of attachments) {
          const fileExt = attachment.name.split('.').pop();
          const fileName = `${user?.id}/maintenance/${requestId}/${Date.now()}-note.${fileExt}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('maintenance-files')
            .upload(fileName, attachment);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('maintenance-files')
            .getPublicUrl(fileName);

          attachmentUrls.push(publicUrl);
        }
      }

      // Récupérer les notes existantes
      const { data: currentRequest } = await supabase
        .from('maintenance_requests')
        .select('notes')
        .eq('id', requestId)
        .single();

      const newNote = {
        id: crypto.randomUUID(),
        author_id: user?.id,
        author_name: user?.user_metadata?.full_name || 'Utilisateur',
        content: note,
        attachments: attachmentUrls,
        created_at: new Date().toISOString()
      };

      const updatedNotes = [...(currentRequest?.notes || []), newNote];

      const { data, error } = await supabase
        .from('maintenance_requests')
        .update({
          notes: updatedNotes,
          last_message_at: new Date().toISOString(),
          message_count: updatedNotes.length
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data as MaintenanceRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests', user?.id] });
    }
  });

  // Noter la satisfaction après résolution
  const rateService = useMutation({
    mutationFn: async ({ requestId, rating, feedback }: { requestId: string; rating: number; feedback?: string }) => {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .update({
          tenant_rating: rating,
          tenant_feedback: feedback
        })
        .eq('id', requestId)
        .eq('tenant_id', user?.id)
        .select()
        .single();

      if (error) throw error;
      return data as MaintenanceRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests', user?.id] });
    }
  });

  // Annuler une demande
  const cancelRequest = useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .update({
          status: 'cancelled',
          notes: [{
            id: crypto.randomUUID(),
            author_id: user?.id,
            author_name: user?.user_metadata?.full_name || 'Utilisateur',
            content: 'Demande annulée par le locataire',
            created_at: new Date().toISOString()
          }]
        })
        .eq('id', requestId)
        .eq('tenant_id', user?.id)
        .select()
        .single();

      if (error) throw error;
      return data as MaintenanceRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-stats', user?.id] });
    }
  });

  return {
    requests,
    stats,
    isLoading,
    isLoadingStats,
    error,
    refetch,
    getOwnerRequests,
    createRequest,
    updateStatus,
    addNote,
    rateService,
    cancelRequest
  };
};