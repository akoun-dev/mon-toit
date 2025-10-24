import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface PropertyVisit {
  id: string;
  property_id: string;
  visitor_id: string;
  host_id: string;
  rental_application_id?: string;
  visit_date: string;
  duration_minutes: number;
  visit_type: 'individual' | 'group' | 'open_house' | 'virtual';
  status: 'requested' | 'confirmed' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';
  visitor_contact?: string;
  special_instructions?: string;
  access_code?: string;
  requested_at: string;
  confirmed_at?: string;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  rescheduled_to?: string;
  visitor_notes?: string;
  host_notes?: string;
  visitor_rating?: number;
  host_rating?: number;
  follow_up_required: boolean;
  follow_up_actions: Array<{
    id: string;
    action: string;
    assigned_to: string;
    due_date: string;
    completed: boolean;
  }>;
  photos_during_visit: string[];
  virtual_meeting_link?: string;
  virtual_meeting_platform?: string;
  reminder_sent: boolean;
  reminder_sent_at?: string;
  feedback_requested: boolean;
  feedback_requested_at?: string;
  metadata: Record<string, any>;
  cancellation_reason?: string;
  rescheduling_count: number;
  created_at: string;
  updated_at: string;

  // Relations (inclues via select)
  property?: {
    id: string;
    title: string;
    address: string;
    photos?: string[];
    price?: number;
    bedrooms?: number;
    bathrooms?: number;
    area?: number;
  };
  visitor?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    phone?: string;
    email?: string;
  };
  host?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    phone?: string;
    email?: string;
  };
}

export interface VisitFormData {
  property_id: string;
  visit_date: Date;
  duration_minutes?: number;
  visit_type?: PropertyVisit['visit_type'];
  visitor_contact?: string;
  special_instructions?: string;
  message?: string;
}

export interface VisitSlot {
  slot_datetime: string;
  is_available: boolean;
  reason: string;
}

export interface VisitStats {
  totalVisits: number;
  completedVisits: number;
  upcomingVisits: number;
  cancelledVisits: number;
  noShowRate: number;
  averageRating: number;
  conversionRate: number; // visits -> applications
}

/**
 * Hook pour la gestion des visites de biens
 */
export const usePropertyVisits = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Récupérer les visites du visiteur
  const {
    data: visitorVisits,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['visits', 'visitor', user?.id],
    queryFn: async (): Promise<PropertyVisit[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('property_visits')
        .select(`
          *,
          property:properties(id, title, address, photos, price, bedrooms, bathrooms, area),
          visitor:profiles!property_visits_visitor_id_fkey(id, full_name, avatar_url, phone, email),
          host:profiles!property_visits_host_id_fkey(id, full_name, avatar_url, phone, email)
        `)
        .eq('visitor_id', user.id)
        .order('visit_date', { ascending: false });

      if (error) throw error;
      return data as PropertyVisit[];
    },
    enabled: !!user?.id
  });

  // Récupérer les visites pour un hôte (propriétaire)
  const getHostVisits = (hostId: string) => {
    return useQuery({
      queryKey: ['visits', 'host', hostId],
      queryFn: async (): Promise<PropertyVisit[]> => {
        const { data, error } = await supabase
          .from('property_visits')
          .select(`
            *,
            property:properties(id, title, address, photos, price, bedrooms, bathrooms, area),
            visitor:profiles!property_visits_visitor_id_fkey(id, full_name, avatar_url, phone, email),
            host:profiles!property_visits_host_id_fkey(id, full_name, avatar_url, phone, email)
          `)
          .eq('host_id', hostId)
          .order('visit_date', { ascending: false });

        if (error) throw error;
        return data as PropertyVisit[];
      },
      enabled: !!hostId
    });
  };

  // Récupérer les créneaux disponibles pour un bien
  const getAvailableSlots = (propertyId: string, startDate: Date, endDate: Date, durationMinutes: number = 30) => {
    return useQuery({
      queryKey: ['visit-slots', propertyId, startDate, endDate, durationMinutes],
      queryFn: async (): Promise<VisitSlot[]> => {
        const { data, error } = await supabase
          .rpc('get_available_visit_slots', {
            p_property_id: propertyId,
            p_start_date: startDate.toISOString().split('T')[0],
            p_end_date: endDate.toISOString().split('T')[0],
            p_duration_minutes: durationMinutes
          });

        if (error) throw error;
        return data as VisitSlot[];
      },
      enabled: !!propertyId && !!startDate && !!endDate
    });
  };

  // Demander une visite
  const requestVisit = useMutation({
    mutationFn: async (formData: VisitFormData): Promise<PropertyVisit> => {
      if (!user?.id) throw new Error('Utilisateur non authentifié');

      // Récupérer le propriétaire du bien
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('owner_id')
        .eq('id', formData.property_id)
        .single();

      if (propertyError) throw propertyError;

      // Vérifier si le locataire peut postuler à ce bien
      const { data: eligibility } = await supabase
        .rpc('can_apply_to_property', {
          p_tenant_id: user.id,
          p_property_id: formData.property_id
        });

      if (!eligibility?.[0]?.can_apply) {
        throw new Error(eligibility?.[0]?.reason || 'Vous ne pouvez pas demander de visite pour ce bien');
      }

      const visitData = {
        property_id: formData.property_id,
        visitor_id: user.id,
        host_id: property.owner_id,
        visit_date: formData.visit_date.toISOString(),
        duration_minutes: formData.duration_minutes || 30,
        visit_type: formData.visit_type || 'individual',
        visitor_contact: formData.visitor_contact,
        special_instructions: formData.special_instructions,
        status: 'requested',
        requested_at: new Date().toISOString(),
        metadata: {
          message: formData.message
        }
      };

      const { data, error } = await supabase
        .from('property_visits')
        .insert(visitData)
        .select(`
          *,
          property:properties(id, title, address, photos, price, bedrooms, bathrooms, area),
          visitor:profiles!property_visits_visitor_id_fkey(id, full_name, avatar_url, phone, email),
          host:profiles!property_visits_host_id_fkey(id, full_name, avatar_url, phone, email)
        `)
        .single();

      if (error) throw error;
      return data as PropertyVisit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits', 'visitor', user?.id] });
    }
  });

  // Confirmer une visite (pour le propriétaire)
  const confirmVisit = useMutation({
    mutationFn: async ({ visitId, instructions, accessCode }: { visitId: string; instructions?: string; accessCode?: string }) => {
      const updateData: any = {
        status: 'confirmed',
        confirmed_at: new Date().toISOString()
      };

      if (instructions) updateData.special_instructions = instructions;
      if (accessCode) updateData.access_code = accessCode;

      const { data, error } = await supabase
        .from('property_visits')
        .update(updateData)
        .eq('id', visitId)
        .select(`
          *,
          property:properties(id, title, address, photos),
          visitor:profiles!property_visits_visitor_id_fkey(id, full_name, avatar_url, phone, email),
          host:profiles!property_visits_host_id_fkey(id, full_name, avatar_url, phone, email)
        `)
        .single();

      if (error) throw error;
      return data as PropertyVisit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits', 'visitor', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['visits', 'host'] });
    }
  });

  // Planifier une visite (fixer la date)
  const scheduleVisit = useMutation({
    mutationFn: async ({ visitId, visitDate }: { visitId: string; visitDate: Date }) => {
      const { data, error } = await supabase
        .from('property_visits')
        .update({
          status: 'scheduled',
          visit_date: visitDate.toISOString()
        })
        .eq('id', visitId)
        .select(`
          *,
          property:properties(id, title, address, photos),
          visitor:profiles!property_visits_visitor_id_fkey(id, full_name, avatar_url, phone, email),
          host:profiles!property_visits_host_id_fkey(id, full_name, avatar_url, phone, email)
        `)
        .single();

      if (error) throw error;
      return data as PropertyVisit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits', 'visitor', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['visits', 'host'] });
    }
  });

  // Démarrer une visite
  const startVisit = useMutation({
    mutationFn: async (visitId: string) => {
      const { data, error } = await supabase
        .from('property_visits')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', visitId)
        .select()
        .single();

      if (error) throw error;
      return data as PropertyVisit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits', 'visitor', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['visits', 'host'] });
    }
  });

  // Compléter une visite
  const completeVisit = useMutation({
    mutationFn: async ({ visitId, hostNotes, photos }: { visitId: string; hostNotes?: string; photos?: File[] }) => {
      let photoUrls: string[] = [];

      // Uploader les photos si présentes
      if (photos) {
        for (const photo of photos) {
          const fileExt = photo.name.split('.').pop();
          const fileName = `${user?.id}/visits/${visitId}/${Date.now()}.${fileExt}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('visit-photos')
            .upload(fileName, photo);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('visit-photos')
            .getPublicUrl(fileName);

          photoUrls.push(publicUrl);
        }
      }

      const updateData: any = {
        status: 'completed',
        completed_at: new Date().toISOString(),
        feedback_requested: true,
        feedback_requested_at: new Date().toISOString()
      };

      if (hostNotes) updateData.host_notes = hostNotes;
      if (photoUrls.length > 0) updateData.photos_during_visit = photoUrls;

      const { data, error } = await supabase
        .from('property_visits')
        .update(updateData)
        .eq('id', visitId)
        .select()
        .single();

      if (error) throw error;
      return data as PropertyVisit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits', 'visitor', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['visits', 'host'] });
    }
  });

  // Annuler une visite
  const cancelVisit = useMutation({
    mutationFn: async ({ visitId, reason }: { visitId: string; reason: string }) => {
      const { data, error } = await supabase
        .from('property_visits')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason
        })
        .eq('id', visitId)
        .or(`visitor_id.eq.${user?.id},host_id.eq.${user?.id}`)
        .select()
        .single();

      if (error) throw error;
      return data as PropertyVisit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits', 'visitor', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['visits', 'host'] });
    }
  });

  // Reporter une visite
  const rescheduleVisit = useMutation({
    mutationFn: async ({ visitId, newDate, reason }: { visitId: string; newDate: Date; reason: string }) => {
      const { data, error } = await supabase
        .from('property_visits')
        .update({
          status: 'rescheduled',
          rescheduled_to: newDate.toISOString(),
          cancellation_reason: reason
        })
        .eq('id', visitId)
        .or(`visitor_id.eq.${user?.id},host_id.eq.${user?.id}`)
        .select()
        .single();

      if (error) throw error;
      return data as PropertyVisit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits', 'visitor', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['visits', 'host'] });
    }
  });

  // Noter une visite
  const rateVisit = useMutation({
    mutationFn: async ({ visitId, rating, notes, role }: { visitId: string; rating: number; notes?: string; role: 'visitor' | 'host' }) => {
      const updateData: any = {};

      if (role === 'visitor') {
        updateData.visitor_rating = rating;
        updateData.visitor_notes = notes;
      } else {
        updateData.host_rating = rating;
        updateData.host_notes = notes;
      }

      const { data, error } = await supabase
        .from('property_visits')
        .update(updateData)
        .eq('id', visitId)
        .select()
        .single();

      if (error) throw error;
      return data as PropertyVisit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits', 'visitor', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['visits', 'host'] });
    }
  });

  // Marquer comme no-show
  const markNoShow = useMutation({
    mutationFn: async (visitId: string) => {
      const { data, error } = await supabase
        .from('property_visits')
        .update({
          status: 'no_show',
          host_notes: 'Le visiteur ne s\'est pas présenté'
        })
        .eq('id', visitId)
        .select()
        .single();

      if (error) throw error;
      return data as PropertyVisit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits', 'visitor', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['visits', 'host'] });
    }
  });

  // Obtenir les statistiques de visites
  const getVisitStats = (userId: string, role: 'visitor' | 'host') => {
    return useQuery({
      queryKey: ['visit-stats', userId, role],
      queryFn: async (): Promise<VisitStats> => {
        const { data, error } = await supabase
          .from('property_visits')
          .select('*')
          .eq(role === 'visitor' ? 'visitor_id' : 'host_id', userId);

        if (error) throw error;

        const visits = data as PropertyVisit[];

        const totalVisits = visits.length;
        const completedVisits = visits.filter(v => v.status === 'completed').length;
        const upcomingVisits = visits.filter(v => ['requested', 'confirmed', 'scheduled'].includes(v.status)).length;
        const cancelledVisits = visits.filter(v => v.status === 'cancelled').length;
        const noShowVisits = visits.filter(v => v.status === 'no_show').length;

        const noShowRate = totalVisits > 0 ? (noShowVisits / totalVisits) * 100 : 0;

        const ratings = role === 'visitor'
          ? visits.map(v => v.host_rating).filter(r => r !== undefined)
          : visits.map(v => v.visitor_rating).filter(r => r !== undefined);

        const averageRating = ratings.length > 0
          ? ratings.reduce((sum, rating) => sum + (rating || 0), 0) / ratings.length
          : 0;

        // Calculer le taux de conversion (visites -> candidatures)
        // Ceci nécessiterait une jointure avec la table rental_applications
        const conversionRate = 0; // Placeholder

        return {
          totalVisits,
          completedVisits,
          upcomingVisits,
          cancelledVisits,
          noShowRate,
          averageRating,
          conversionRate
        };
      },
      enabled: !!userId
    });
  };

  return {
    visitorVisits,
    isLoading,
    error,
    refetch,
    getHostVisits,
    getAvailableSlots,
    getVisitStats,
    requestVisit,
    confirmVisit,
    scheduleVisit,
    startVisit,
    completeVisit,
    cancelVisit,
    rescheduleVisit,
    rateVisit,
    markNoShow
  };
};