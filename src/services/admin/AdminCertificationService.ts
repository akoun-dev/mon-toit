import { supabase } from '@/lib/supabase';

export interface AnsutCertification {
  id: string;
  lease_id: string;
  certification_number: string;
  request_date: string;
  review_date?: string;
  approval_date?: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'expired' | 'revoked';
  reviewer_id?: string;
  reviewer_notes?: string;
  documents: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CertificationRequest {
  lease_id: string;
  documents: string[];
  requester_notes?: string;
}

export interface CertificationReview {
  certification_id: string;
  status: 'approved' | 'rejected';
  reviewer_notes?: string;
}

class AdminCertificationService {
  // Obtenir toutes les certifications (admin)
  async getAllCertifications(
    filters: {
      status?: string;
      reviewer_id?: string;
      date_from?: string;
      date_to?: string;
    } = {}
  ): Promise<{ data: AnsutCertification[] | null; error: any }> {
    let query = supabase
      .from('ansut_certifications')
      .select(`
        *,
        lease:leases(id, lease_number, monthly_rent, properties(title, address)),
        reviewer:profiles(full_name, email)
      `)
      .order('created_at', { ascending: false });

    // Appliquer les filtres
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.reviewer_id) {
      query = query.eq('reviewer_id', filters.reviewer_id);
    }
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    return await query;
  }

  // Soumettre une demande de certification
  async submitCertification(
    request: CertificationRequest
  ): Promise<{ data: any | null; error: any }> {
    // Appeler la fonction RPC pour soumettre
    const { data, error } = await supabase.rpc('submit_lease_certification', {
      p_lease_id: request.lease_id,
      p_documents: request.documents,
      p_requester_notes: request.requester_notes
    });

    if (error) {
      console.error('Erreur soumission certification:', error);
      return { data: null, error };
    }

    // Créer une alerte pour les admins
    await supabase.from('alerts').insert({
      alert_type: 'certification_required',
      title: 'Nouvelle demande de certification',
      message: `Une nouvelle demande de certification a été soumise pour le bail ${request.lease_id}`,
      severity: 'medium',
      target_role: 'admin_ansut',
      action_required: true,
      category: 'certification'
    });

    return { data, error: null };
  }

  // Approuver ou rejeter une certification
  async reviewCertification(
    review: CertificationReview,
    reviewerId: string
  ): Promise<{ data: any | null; error: any }> {
    // Appeler la fonction RPC pour la revue
    const { data, error } = await supabase.rpc('review_lease_certification', {
      p_certification_id: review.certification_id,
      p_status: review.status,
      p_reviewer_id: reviewerId,
      p_reviewer_notes: review.reviewer_notes
    });

    if (error) {
      console.error('Erreur revue certification:', error);
      return { data: null, error };
    }

    // Notifier les parties concernées
    const certification = await this.getCertificationById(review.certification_id);
    if (certification?.data) {
      await this.notifyCertificationUpdate(certification.data, review.status);
    }

    return { data, error: null };
  }

  // Obtenir une certification par ID
  async getCertificationById(
    id: string
  ): Promise<{ data: AnsutCertification | null; error: any }> {
    return await supabase
      .from('ansut_certifications')
      .select(`
        *,
        lease:leases(id, lease_number, monthly_rent, properties(title, address)),
        reviewer:profiles(full_name, email, phone)
      `)
      .eq('id', id)
      .single();
  }

  // Obtenir les certifications par bail
  async getCertificationsByLease(
    leaseId: string
  ): Promise<{ data: AnsutCertification[] | null; error: any }> {
    return await supabase
      .from('ansut_certifications')
      .select(`
        *,
        reviewer:profiles(full_name, email)
      `)
      .eq('lease_id', leaseId)
      .order('created_at', { ascending: false });
  }

  // Obtenir les statistiques de certification
  async getCertificationStats(
    period: { start_date: string; end_date: string }
  ): Promise<{ data: any | null; error: any }> {
    const { data, error } = await supabase
      .from('ansut_certifications')
      .select('status, count(*)')
      .gte('created_at', period.start_date)
      .lte('created_at', period.end_date)
      .group('status');

    return { data, error };
  }

  // Mettre à jour les métadonnées d'une certification
  async updateCertificationMetadata(
    id: string,
    metadata: Record<string, any>
  ): Promise<{ data: AnsutCertification | null; error: any }> {
    return await supabase
      .from('ansut_certifications')
      .update({ metadata, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
  }

  // Supprimer une certification (admin seulement)
  async deleteCertification(
    id: string
  ): Promise<{ data: any | null; error: any }> {
    return await supabase
      .from('ansut_certifications')
      .delete()
      .eq('id', id);
  }

  // Obtenir les certifications en attente de revue
  async getPendingCertifications(): Promise<{
    data: AnsutCertification[] | null;
    error: any
  }> {
    return await this.getAllCertifications({ status: 'pending' });
  }

  // Obtenir l'historique des certifications pour un utilisateur
  async getUserCertificationHistory(
    userId: string
  ): Promise<{ data: AnsutCertification[] | null; error: any }> {
    return await supabase
      .from('ansut_certifications')
      .select(`
        *,
        lease:leases(id, lease_number, monthly_rent, properties(title, address))
      `)
      .or(`lease.tenant_id.eq.${userId},lease.owner_id.eq.${userId}`)
      .order('created_at', { ascending: false });
  }

  // Méthodes privées de notification
  private async notifyCertificationUpdate(
    certification: AnsutCertification,
    status: string
  ): Promise<void> {
    const notificationTitle = status === 'approved'
      ? 'Certification approuvée'
      : 'Certification rejetée';

    const notificationMessage = status === 'approved'
      ? `Votre demande de certification ${certification.certification_number} a été approuvée`
      : `Votre demande de certification ${certification.certification_number} a été rejetée. ${certification.reviewer_notes || ''}`;

    // Notifier via le système d'alertes
    await supabase.from('alerts').insert({
      alert_type: 'certification_update',
      title: notificationTitle,
      message: notificationMessage,
      severity: status === 'approved' ? 'low' : 'medium',
      target_user_id: certification.lease_id, // À adapter selon le propriétaire du bail
      action_required: false,
      category: 'certification'
    });
  }

  // Exporter les certifications
  async exportCertifications(
    filters: any = {},
    format: 'csv' | 'json' | 'pdf' = 'csv'
  ): Promise<{ data: any | null; error: any }> {
    // Récupérer les données
    const { data: certifications, error } = await this.getAllCertifications(filters);

    if (error || !certifications) {
      return { data: null, error };
    }

    // Générer le fichier d'export
    if (format === 'csv') {
      return this.generateCSVExport(certifications);
    } else if (format === 'json') {
      return { data: JSON.stringify(certifications, null, 2), error: null };
    } else {
      // Pour PDF, utiliser une librairie comme jsPDF
      return { data: null, error: 'Export PDF non implémenté' };
    }
  }

  private generateCSVExport(certifications: AnsutCertification[]): { data: any; error: null } {
    const headers = [
      'Numéro de certification',
      'ID Bail',
      'Statut',
      'Date de demande',
      'Date de revue',
      'Date d\'approbation',
      'Notes du réviseur',
      'Documents'
    ];

    const rows = certifications.map(cert => [
      cert.certification_number,
      cert.lease_id,
      cert.status,
      cert.request_date,
      cert.review_date || '',
      cert.approval_date || '',
      cert.reviewer_notes || '',
      cert.documents.join(';')
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return { data: csvContent, error: null };
  }
}

export const adminCertificationService = new AdminCertificationService();
export default adminCertificationService;