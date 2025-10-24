import { supabase } from '@/lib/supabase';

export interface Dispute {
  id: string;
  title: string;
  description: string;
  type: 'payment' | 'property_damage' | 'contract_violation' | 'maintenance' | 'other';
  status: 'open' | 'in_progress' | 'under_mediation' | 'resolved' | 'escalated' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  plaintiff_id: string;
  defendant_id: string;
  mediator_id?: string;
  property_id?: string;
  lease_id?: string;
  resolution_summary?: string;
  resolution_details?: string;
  compensation_amount: number;
  resolution_date?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  escalated_at?: string;
}

export interface DisputeEvidence {
  id: string;
  dispute_id: string;
  type: 'document' | 'photo' | 'video' | 'witness_statement' | 'other';
  file_url: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  description?: string;
  uploaded_by: string;
  is_public: boolean;
  metadata: Record<string, any>;
  created_at: string;
}

export interface DisputeRequest {
  title: string;
  description: string;
  type: Dispute['type'];
  plaintiff_id: string;
  defendant_id: string;
  property_id?: string;
  lease_id?: string;
  priority: Dispute['priority'];
}

export interface DisputeResolution {
  dispute_id: string;
  mediator_id: string;
  resolution_summary: string;
  resolution_details: string;
  compensation_amount: number;
  status: 'resolved' | 'escalated' | 'dismissed';
}

class AdminDisputeService {
  // Obtenir tous les litiges avec filtres
  async getAllDisputes(
    filters: {
      status?: Dispute['status'];
      type?: Dispute['type'];
      priority?: Dispute['priority'];
      mediator_id?: string;
      date_from?: string;
      date_to?: string;
    } = {}
  ): Promise<{ data: (Dispute & { plaintiff: any; defendant: any; mediator?: any; property?: any })[] | null; error: any }> {
    let query = supabase
      .from('disputes')
      .select(`
        *,
        plaintiff:profiles(id, full_name, email, phone, user_type),
        defendant:profiles(id, full_name, email, phone, user_type),
        mediator:profiles(id, full_name, email, phone),
        property:properties(id, title, address, city)
      `)
      .order('created_at', { ascending: false });

    // Appliquer les filtres
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters.mediator_id) {
      query = query.eq('mediator_id', filters.mediator_id);
    }
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    return await query;
  }

  // Créer un nouveau litige
  async createDispute(
    request: DisputeRequest
  ): Promise<{ data: Dispute | null; error: any }> {
    // Appeler la fonction RPC pour créer le litige
    const { data, error } = await supabase.rpc('create_dispute', {
      p_title: request.title,
      p_description: request.description,
      p_type: request.type,
      p_plaintiff_id: request.plaintiff_id,
      p_defendant_id: request.defendant_id,
      p_property_id: request.property_id,
      p_lease_id: request.lease_id,
      p_priority: request.priority
    });

    if (error) {
      console.error('Erreur création litige:', error);
      return { data: null, error };
    }

    // Notifier les administrateurs
    await supabase.from('alerts').insert({
      alert_type: 'new_dispute',
      title: 'Nouveau litige ouvert',
      message: `Un nouveau litige de type "${request.type}" a été ouvert: "${request.title}"`,
      severity: request.priority === 'urgent' ? 'critical' :
                request.priority === 'high' ? 'high' : 'medium',
      target_role: 'admin_ansut',
      action_required: true,
      category: 'dispute'
    });

    return { data, error: null };
  }

  // Ajouter des preuves à un litige
  async addEvidence(
    disputeId: string,
    evidence: {
      type: DisputeEvidence['type'];
      file_url: string;
      file_name?: string;
      description?: string;
      uploaded_by: string;
    }
  ): Promise<{ data: DisputeEvidence | null; error: any }> {
    // Appeler la fonction RPC pour ajouter des preuves
    const { data, error } = await supabase.rpc('add_dispute_evidence', {
      p_dispute_id: disputeId,
      p_type: evidence.type,
      p_file_url: evidence.file_url,
      p_file_name: evidence.file_name,
      p_description: evidence.description,
      p_uploaded_by: evidence.uploaded_by
    });

    if (error) {
      console.error('Erreur ajout preuve:', error);
      return { data: null, error };
    }

    return { data, error: null };
  }

  // Résoudre un litige
  async resolveDispute(
    resolution: DisputeResolution
  ): Promise<{ data: Dispute | null; error: any }> {
    const updateData = {
      status: resolution.status,
      mediator_id: resolution.mediator_id,
      resolution_summary: resolution.resolution_summary,
      resolution_details: resolution.resolution_details,
      compensation_amount: resolution.compensation_amount,
      resolution_date: new Date().toISOString(),
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('disputes')
      .update(updateData)
      .eq('id', resolution.dispute_id)
      .select()
      .single();

    if (error) {
      console.error('Erreur résolution litige:', error);
      return { data: null, error };
    }

    // Notifier les parties concernées
    if (data) {
      await this.notifyDisputeResolution(data);
    }

    return { data, error: null };
  }

  // Assigner un médiateur
  async assignMediator(
    disputeId: string,
    mediatorId: string
  ): Promise<{ data: Dispute | null; error: any }> {
    const { data, error } = await supabase
      .from('disputes')
      .update({
        mediator_id: mediatorId,
        status: 'under_mediation',
        updated_at: new Date().toISOString()
      })
      .eq('id', disputeId)
      .select()
      .single();

    if (error) {
      console.error('Erreur assignation médiateur:', error);
      return { data: null, error };
    }

    // Notifier le médiateur
    await supabase.from('alerts').insert({
      alert_type: 'dispute_assignment',
      title: 'Nouveau litige à médier',
      message: `Vous avez été assigné comme médiateur pour le litige #${disputeId}`,
      severity: 'medium',
      target_user_id: mediatorId,
      action_required: true,
      category: 'dispute'
    });

    return { data, error: null };
  }

  // Obtenir les preuves d'un litige
  async getDisputeEvidence(
    disputeId: string
  ): Promise<{ data: DisputeEvidence[] | null; error: any }> {
    return await supabase
      .from('dispute_evidence')
      .select(`
        *,
        uploader:profiles(full_name, email, user_type)
      `)
      .eq('dispute_id', disputeId)
      .order('created_at', { ascending: true });
  }

  // Obtenir un litige par ID
  async getDisputeById(
    id: string
  ): Promise<{ data: (Dispute & { plaintiff: any; defendant: any; mediator?: any; property?: any }) | null; error: any }> {
    return await supabase
      .from('disputes')
      .select(`
        *,
        plaintiff:profiles(id, full_name, email, phone, user_type),
        defendant:profiles(id, full_name, email, phone, user_type),
        mediator:profiles(id, full_name, email, phone, user_type),
        property:properties(id, title, address, city)
      `)
      .eq('id', id)
      .single();
  }

  // Obtenir les litiges pour un utilisateur
  async getUserDisputes(
    userId: string
  ): Promise<{ data: Dispute[] | null; error: any }> {
    return await supabase
      .from('disputes')
      .select(`
        *,
        property:properties(title, address),
        defendant:profiles(full_name),
        plaintiff:profiles(full_name)
      `)
      .or(`plaintiff_id.eq.${userId},defendant_id.eq.${userId},mediator_id.eq.${userId}`)
      .order('created_at', { ascending: false });
  }

  // Obtenir les statistiques des litiges
  async getDisputeStats(
    period: { start_date: string; end_date: string }
  ): Promise<{ data: any | null; error: any }> {
    const { data, error } = await supabase
      .from('disputes')
      .select('type, status, priority, count(*)')
      .gte('created_at', period.start_date)
      .lte('created_at', period.end_date)
      .group('type, status, priority');

    return { data, error };
  }

  // Mettre à jour le statut d'un litige
  async updateDisputeStatus(
    disputeId: string,
    status: Dispute['status'],
    notes?: string
  ): Promise<{ data: Dispute | null; error: any }> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'escalated') {
      updateData.escalated_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('disputes')
      .update(updateData)
      .eq('id', disputeId)
      .select()
      .single();

    if (error) {
      console.error('Erreur mise à jour statut litige:', error);
      return { data: null, error };
    }

    // Ajouter aux métadonnées si des notes sont fournies
    if (notes) {
      await this.updateDisputeMetadata(disputeId, { status_update_notes: notes });
    }

    return { data, error: null };
  }

  // Mettre à jour les métadonnées
  private async updateDisputeMetadata(
    disputeId: string,
    metadata: Record<string, any>
  ): Promise<void> {
    await supabase
      .from('disputes')
      .update({
        metadata: supabase.sql`COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify(metadata)}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', disputeId);
  }

  // Notifier la résolution d'un litige
  private async notifyDisputeResolution(
    dispute: Dispute
  ): Promise<void> {
    // Notifier le demandeur
    await supabase.from('alerts').insert({
      alert_type: 'dispute_resolution',
      title: 'Litige résolu',
      message: `Votre litige "${dispute.title}" a été résolu. Compensation: ${dispute.compensation_amount} FCFA`,
      severity: 'low',
      target_user_id: dispute.plaintiff_id,
      action_required: false,
      category: 'dispute'
    });

    // Notifier le défendeur
    await supabase.from('alerts').insert({
      alert_type: 'dispute_resolution',
      title: 'Litige résolu',
      message: `Le litige "${dispute.title}" a été résolu. Compensation: ${dispute.compensation_amount} FCFA`,
      severity: 'low',
      target_user_id: dispute.defendant_id,
      action_required: false,
      category: 'dispute'
    });

    // Notifier les admins si besoin
    if (dispute.priority === 'high' || dispute.priority === 'urgent') {
      await supabase.from('alerts').insert({
        alert_type: 'dispute_resolution',
        title: 'Litige prioritaire résolu',
        message: `Le litige prioritaire "${dispute.title}" a été résolu`,
        severity: 'medium',
        target_role: 'admin_ansut',
        action_required: false,
        category: 'dispute'
      });
    }
  }

  // Exporter les litiges
  async exportDisputes(
    filters: any = {},
    format: 'csv' | 'json' = 'csv'
  ): Promise<{ data: any | null; error: any }> {
    const { data: disputes, error } = await this.getAllDisputes(filters);

    if (error || !disputes) {
      return { data: null, error };
    }

    if (format === 'csv') {
      return this.generateCSVExport(disputes);
    } else {
      return { data: JSON.stringify(disputes, null, 2), error: null };
    }
  }

  private generateCSVExport(disputes: any[]): { data: any; error: null } {
    const headers = [
      'ID',
      'Titre',
      'Type',
      'Statut',
      'Priorité',
      'Demandeur',
      'Défendeur',
      'Médiateur',
      'Date de création',
      'Date de résolution',
      'Montant compensation'
    ];

    const rows = disputes.map(dispute => [
      dispute.id,
      dispute.title,
      dispute.type,
      dispute.status,
      dispute.priority,
      dispute.plaintiff?.full_name || '',
      dispute.defendant?.full_name || '',
      dispute.mediator?.full_name || '',
      dispute.created_at,
      dispute.resolved_at || '',
      dispute.compensation_amount
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return { data: csvContent, error: null };
  }
}

export const adminDisputeService = new AdminDisputeService();
export default adminDisputeService;