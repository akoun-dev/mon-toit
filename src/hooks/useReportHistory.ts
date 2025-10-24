import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/services/logger';

export interface ReportHistory {
  id: string;
  owner_id: string;
  report_type: 'monthly' | 'quarterly' | 'annual' | 'custom';
  period_start: string;
  period_end: string;
  generated_at: string;
  report_data: any;
  file_url?: string;
  file_size?: number;
  created_at: string;
}

export interface ReportData {
  overview: {
    total_properties: number;
    total_revenue: number;
    average_occupancy_rate: number;
    total_applications: number;
    total_maintenance_requests: number;
  };
  property_performance: Array<{
    property_id: string;
    title: string;
    views: number;
    applications: number;
    revenue: number;
    occupancy_rate: number;
    maintenance_costs: number;
  }>;
  trends: {
    monthly_revenue: Array<{ month: string; revenue: number }>;
    occupancy_trend: Array<{ month: string; rate: number }>;
    application_trend: Array<{ month: string; count: number }>;
  };
  demographics: {
    tenant_distribution: Record<string, number>;
    property_type_distribution: Record<string, number>;
    neighborhood_distribution: Record<string, number>;
  };
}

/**
 * Hook pour gérer l'historique des rapports propriétaire
 */
export const useReportHistory = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Récupérer l'historique des rapports
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['report-history', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('report_history')
        .select('*')
        .eq('owner_id', user.id)
        .order('period_start', { ascending: false });

      if (error) throw error;
      return data as ReportHistory[];
    },
    enabled: !!user,
  });

  // Générer un nouveau rapport
  const generateReport = useMutation({
    mutationFn: async ({
      reportType,
      periodStart,
      periodEnd,
      customData
    }: {
      reportType: 'monthly' | 'quarterly' | 'annual' | 'custom';
      periodStart: string;
      periodEnd: string;
      customData?: any;
    }) => {
      // Générer les données du rapport via RPC
      const { data: reportData, error: rpcError } = await supabase
        .rpc('generate_owner_report', {
          p_owner_id: user!.id,
          p_report_type: reportType,
          p_period_start: periodStart,
          p_period_end: periodEnd
        });

      if (rpcError) throw rpcError;

      // Insérer le rapport dans l'historique
      const { data, error } = await supabase
        .from('report_history')
        .insert({
          owner_id: user!.id,
          report_type: reportType,
          period_start: periodStart,
          period_end: periodEnd,
          report_data: reportData || customData,
          generated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (newReport) => {
      queryClient.invalidateQueries({ queryKey: ['report-history'] });
      toast({
        title: "Rapport généré",
        description: `Le rapport ${newReport.report_type} a été généré avec succès`,
      });
      logger.info('Report generated', {
        reportId: newReport.id,
        type: newReport.report_type,
        userId: user?.id
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Impossible de générer le rapport: ${error.message}`,
        variant: "destructive",
      });
      logger.error('Failed to generate report', { error, userId: user?.id });
    },
  });

  // Télécharger un rapport
  const downloadReport = useMutation({
    mutationFn: async (reportId: string) => {
      const { data: report, error } = await supabase
        .from('report_history')
        .select('*')
        .eq('id', reportId)
        .eq('owner_id', user!.id)
        .single();

      if (error) throw error;

      // Générer le fichier PDF/CSV
      const { data: fileData, error: fileError } = await supabase.functions.invoke('generate-report-file', {
        body: {
          reportData: report.report_data,
          reportType: report.report_type,
          format: 'pdf'
        }
      });

      if (fileError) throw fileError;

      // Mettre à jour l'URL du fichier
      const { data: updatedReport, error: updateError } = await supabase
        .from('report_history')
        .update({
          file_url: fileData.url,
          file_size: fileData.size
        })
        .eq('id', reportId)
        .select()
        .single();

      if (updateError) throw updateError;

      return updatedReport;
    },
    onSuccess: (updatedReport) => {
      queryClient.invalidateQueries({ queryKey: ['report-history'] });

      // Télécharger le fichier
      if (updatedReport.file_url) {
        const link = document.createElement('a');
        link.href = updatedReport.file_url;
        link.download = `rapport-${updatedReport.report_type}-${updatedReport.period_start}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast({
        title: "Téléchargement commencé",
        description: "Le rapport est en cours de téléchargement",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Impossible de télécharger le rapport: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Supprimer un rapport
  const deleteReport = useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase
        .from('report_history')
        .delete()
        .eq('id', reportId)
        .eq('owner_id', user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-history'] });
      toast({
        title: "Rapport supprimé",
        description: "Le rapport a été supprimé avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Impossible de supprimer le rapport: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Obtenir les rapports par type
  const getReportsByType = (type: ReportHistory['report_type']) => {
    return reports.filter(report => report.report_type === type);
  };

  // Obtenir le rapport le plus récent
  const getLatestReport = () => {
    return reports.length > 0 ? reports[0] : null;
  };

  // Vérifier si un rapport existe pour une période donnée
  const reportExistsForPeriod = (reportType: ReportHistory['report_type'], periodStart: string, periodEnd: string) => {
    return reports.some(report =>
      report.report_type === reportType &&
      report.period_start === periodStart &&
      report.period_end === periodEnd
    );
  };

  return {
    reports,
    isLoading,
    generateReport: generateReport.mutate,
    downloadReport: downloadReport.mutate,
    deleteReport: deleteReport.mutate,
    getReportsByType,
    getLatestReport,
    reportExistsForPeriod,
    isGenerating: generateReport.isPending,
    isDownloading: downloadReport.isPending,
  };
};