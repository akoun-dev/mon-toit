import { supabase } from '@/lib/supabase';

export interface RoleChangeRequest {
  id: string;
  user_id: string;
  from_role: string;
  to_role: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  request_data: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    ownerType: 'particulier' | 'agence' | 'professionnel';
    agencyName?: string;
    agencyLicense?: string;
    idNumber: string;
    bankAccount: string;
    acceptTerms: boolean;
  };
  documents?: {
    idDocument?: string;
    proofOfAddress?: string;
    professionalCard?: string;
  };
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface RoleTransformationData {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  ownerType: 'particulier' | 'agence' | 'professionnel';
  agencyName?: string;
  agencyLicense?: string;
  idNumber: string;
  bankAccount: string;
  acceptTerms: boolean;
}

export interface DocumentUpload {
  type: 'idDocument' | 'proofOfAddress' | 'professionalCard';
  file: File;
  url?: string;
}

class RoleTransformationService {
  /**
   * Vérifie si l'utilisateur peut faire une demande de transformation en propriétaire
   */
  async validatePrerequisites(userId: string): Promise<{
    canUpgrade: boolean;
    missingRequirements: string[];
    completionPercentage: number;
    currentStep: number;
    totalSteps: number;
    verificationStatus: any;
    recommendations: string[];
  }> {
    const { data, error } = await supabase.rpc('validate_proprietaire_prerequisites', {
      p_user_id: userId
    });

    if (error) {
      console.error('Erreur validation prérequis:', error);
      return {
        canUpgrade: false,
        missingRequirements: ['Erreur de validation'],
        completionPercentage: 0,
        currentStep: 0,
        totalSteps: 5,
        verificationStatus: {},
        recommendations: ['Veuillez réessayer plus tard']
      };
    }

    return data?.[0] || {
      canUpgrade: false,
      missingRequirements: ['Utilisateur non trouvé'],
      completionPercentage: 0,
      currentStep: 0,
      totalSteps: 5,
      verificationStatus: {},
      recommendations: ['Veuillez compléter votre profil']
    };
  }

  /**
   * Vérifie si l'utilisateur a déjà une demande en cours
   */
  async hasPendingRequest(userId: string, targetRole: string = 'propriétaire'): Promise<boolean> {
    const { data, error } = await supabase
      .from('role_change_requests')
      .select('id')
      .eq('user_id', userId)
      .eq('to_role', targetRole)
      .in('status', ['pending', 'under_review'])
      .single();

    return !error && !!data;
  }

  /**
   * Soumet une demande de transformation en propriétaire
   */
  async submitTransformationRequest(
    userId: string,
    currentRole: string,
    transformationData: RoleTransformationData,
    documents: DocumentUpload[]
  ): Promise<{ success: boolean; requestId?: string; error?: string }> {
    try {
      // Vérifier si une demande est déjà en cours
      const hasPending = await this.hasPendingRequest(userId);
      if (hasPending) {
        return {
          success: false,
          error: 'Une demande de transformation est déjà en cours'
        };
      }

      // Uploader les documents et obtenir leurs URLs
      const documentUrls: Record<string, string> = {};

      for (const doc of documents) {
        if (doc.file) {
          const fileName = `${userId}_${doc.type}_${Date.now()}.${doc.file.name.split('.').pop()}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('role-transformation-docs')
            .upload(fileName, doc.file);

          if (uploadError) {
            console.error(`Erreur upload ${doc.type}:`, uploadError);
            return {
              success: false,
              error: `Erreur lors du téléchargement du document ${doc.type}`
            };
          }

          const { data: { publicUrl } } = supabase.storage
            .from('role-transformation-docs')
            .getPublicUrl(fileName);

          documentUrls[doc.type] = publicUrl;
        }
      }

      // Créer la demande de changement de rôle
      const { data, error } = await supabase.rpc('request_role_change', {
        p_user_id: userId,
        p_requested_role: 'propriétaire',
        p_request_data: {
          ...transformationData,
          documents: documentUrls,
          submittedAt: new Date().toISOString()
        }
      });

      if (error) {
        console.error('Erreur soumission demande:', error);
        return {
          success: false,
          error: error.message || 'Erreur lors de la soumission de la demande'
        };
      }

      // Créer une alerte pour les administrateurs
      await supabase.from('alerts').insert({
        alert_type: 'role_change_request',
        title: 'Nouvelle demande de transformation en propriétaire',
        message: `L'utilisateur ${transformationData.fullName} souhaite devenir propriétaire`,
        severity: 'medium',
        target_role: 'admin_ansut',
        action_required: true,
        category: 'role_management',
        metadata: {
          request_id: data?.id,
          user_id: userId,
          requested_role: 'propriétaire'
        }
      });

      return {
        success: true,
        requestId: data?.id
      };

    } catch (error) {
      console.error('Erreur inattendue:', error);
      return {
        success: false,
        error: 'Une erreur inattendue est survenue'
      };
    }
  }

  /**
   * Récupère le statut d'une demande de transformation
   */
  async getTransformationStatus(requestId: string): Promise<{
    data: RoleChangeRequest | null;
    error: any;
  }> {
    return await supabase
      .from('role_change_requests')
      .select(`
        *,
        reviewer:profiles(full_name, email),
        user:profiles(full_name, email)
      `)
      .eq('id', requestId)
      .single();
  }

  /**
   * Récupère toutes les demandes de transformation d'un utilisateur
   */
  async getUserTransformationHistory(userId: string): Promise<{
    data: RoleChangeRequest[] | null;
    error: any;
  }> {
    return await supabase
      .from('role_change_requests')
      .select(`
        *,
        reviewer:profiles(full_name, email)
      `)
      .eq('user_id', userId)
      .eq('to_role', 'propriétaire')
      .order('created_at', { ascending: false });
  }

  /**
   * Annule une demande de transformation en cours
   */
  async cancelTransformationRequest(
    requestId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('role_change_requests')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .eq('user_id', userId)
      .in('status', ['pending', 'under_review']);

    if (error) {
      return {
        success: false,
        error: error.message || 'Erreur lors de l\'annulation de la demande'
      };
    }

    return { success: true };
  }

  /**
   * Upload un document pour la demande de transformation
   */
  async uploadDocument(
    userId: string,
    documentType: 'idDocument' | 'proofOfAddress' | 'professionalCard',
    file: File
  ): Promise<{ url?: string; error?: string }> {
    try {
      const fileName = `${userId}_${documentType}_${Date.now()}.${file.name.split('.').pop()}`;

      const { data, error } = await supabase.storage
        .from('role-transformation-docs')
        .upload(fileName, file);

      if (error) {
        return { error: error.message };
      }

      const { data: { publicUrl } } = supabase.storage
        .from('role-transformation-docs')
        .getPublicUrl(fileName);

      return { url: publicUrl };

    } catch (error) {
      return { error: 'Erreur lors du téléchargement du document' };
    }
  }

  /**
   * Vérifie si un utilisateur a les permissions requises
   */
  async checkUserPermissions(userId: string): Promise<{
    canRequest: boolean;
    currentRole: string;
    restrictions: string[];
  }> {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('active_role, is_verified')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return {
        canRequest: false,
        currentRole: 'unknown',
        restrictions: ['Profil utilisateur non trouvé']
      };
    }

    const restrictions: string[] = [];

    if (!profile.is_verified) {
      restrictions.push('Email non vérifié');
    }

    if (profile.active_role === 'propriétaire') {
      restrictions.push('Déjà propriétaire');
    }

    if (profile.active_role === 'admin_ansut') {
      restrictions.push('Les administrateurs ne peuvent pas demander ce changement');
    }

    return {
      canRequest: restrictions.length === 0,
      currentRole: profile.active_role,
      restrictions
    };
  }

  /**
   * Obtenir les statistiques des demandes de transformation (pour admins)
   */
  async getTransformationStatistics(days: number = 30): Promise<{
    data: any;
    error: any;
  }> {
    const { data, error } = await supabase.rpc('get_role_request_statistics', {
      p_days: days
    });

    return { data, error };
  }
}

export const roleTransformationService = new RoleTransformationService();
export default roleTransformationService;