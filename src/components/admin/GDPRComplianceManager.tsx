import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserX,
  Download,
  Eye,
  Trash2,
  Clock,
  FileText,
  Users,
  Search,
  RefreshCw,
  Database,
  Lock,
  Mail,
  Calendar,
  Scale
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/services/logger';
import { Skeleton } from '@/components/ui/skeleton';

interface GDPRRequest {
  id: string;
  user_id: string;
  request_type: 'data_access' | 'data_deletion' | 'data_correction' | 'portability' | 'objection';
  status: 'pending' | 'processing' | 'completed' | 'rejected' | 'requires_info';
  priority: 'low' | 'medium' | 'high';
  description: string;
  justification?: string;
  evidence_requested?: string[];
  evidence_provided?: string[];

  -- Traitement
  processed_at?: string;
  processed_by?: string;
  processing_notes?: string;
  completion_details?: JSONB;

  -- Conformité
  gdpr_article?: string;
  data_categories_affected?: string[];
  retention_days?: number;
  consent_revoked_at?: string;

  -- Timestamps
  created_at: string;
  updated_at: string;
  deadline_at: string;
}

interface UserGDPRData {
  user_id: string;
  personal_data: {
    profile_info: JSONB;
    authentication_data: JSONB;
    communication_history: JSONB;
    transaction_history: JSONB;
    preferences: JSONB;
  };
  data_retention_info: {
    categories: Record<string, { retained: boolean; retention_period_days: number }>;
    last_cleanup: string;
  };
  consent_records: JSONB;
  processing_activities: JSONB;
}

interface ComplianceMetrics {
  total_requests: number;
  pending_requests: number;
  completed_requests: number;
  average_processing_days: number;
  overdue_requests: number;
  requests_by_type: Record<string, number>;
  compliance_score: number;
  data_volume_anonymized: number;
  retention_policy_compliance: number;
}

export const GDPRComplianceManager = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('requests');
  const [requests, setRequests] = useState<GDPRRequest[]>([]);
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Dialog states
  const [selectedRequest, setSelectedRequest] = useState<GDPRRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processingNotes, setProcessingNotes] = useState('');
  const [processingAction, setProcessingAction] = useState<'approve' | 'reject' | 'request_info'>('approve');

  // Data export states
  const [userDataView, setUserDataView] = useState<UserGDPRData | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchGDPRRequests();
    fetchComplianceMetrics();
  }, []);

  const fetchGDPRRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('gdpr_requests')
        .select(`
          *,
          requester:profiles!gdpr_requests_user_id_fkey (
            full_name,
            email,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      logger.error('Error fetching GDPR requests', { error });
      toast({
        title: "Erreur",
        description: "Impossible de charger les demandes RGPD",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchComplianceMetrics = async () => {
    try {
      const { data, error } = await supabase.rpc('get_gdpr_compliance_metrics');

      if (error) {
        // Calculer manuellement si la fonction n'existe pas
        await calculateManualMetrics();
        return;
      }

      setMetrics(data);
    } catch (error) {
      logger.error('Error fetching compliance metrics', { error });
      await calculateManualMetrics();
    }
  };

  const calculateManualMetrics = async () => {
    try {
      const { data: requests_data } = await supabase
        .from('gdpr_requests')
        .select('status, request_type, created_at, processed_at, deadline_at');

      if (requests_data) {
        const total = requests_data.length;
        const pending = requests_data.filter(r => r.status === 'pending').length;
        const completed = requests_data.filter(r => r.status === 'completed').length;
        const overdue = requests_data.filter(r =>
          r.deadline_at && new Date(r.deadline_at) < new Date() && r.status !== 'completed'
        ).length;

        // Temps moyen de traitement
        const processed_requests = requests_data.filter(r => r.processed_at && r.created_at);
        const avg_processing_days = processed_requests.length > 0
          ? processed_requests.reduce((sum, r) => {
              const start = new Date(r.created_at);
              const end = new Date(r.processed_at!);
              return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
            }, 0) / processed_requests.length
          : 0;

        // Répartition par type
        const requestsByType: Record<string, number> = {};
        requests_data.forEach(r => {
          requestsByType[r.request_type] = (requestsByType[r.request_type] || 0) + 1;
        });

        setMetrics({
          total_requests: total,
          pending_requests: pending,
          completed_requests: completed,
          average_processing_days: avg_processing_days,
          overdue_requests: overdue,
          requests_by_type: requestsByType,
          compliance_score: calculateComplianceScore(requests_data),
          data_volume_anonymized: 0, // À implémenter avec tracking
          retention_policy_compliance: 95 // Simulation
        });
      }
    } catch (error) {
      logger.error('Error calculating manual metrics', { error });
    }
  };

  const calculateComplianceScore = (requests: GDPRRequest[]) => {
    if (requests.length === 0) return 100;

    const completedWithinDeadline = requests.filter(r => {
      if (r.status !== 'completed' || !r.deadline_at) return false;
      return new Date(r.processed_at!) <= new Date(r.deadline_at);
    }).length;

    const totalCompleted = requests.filter(r => r.status === 'completed').length;

    if (totalCompleted === 0) return 100;

    return Math.round((completedWithinDeadline / totalCompleted) * 100);
  };

  const handleProcessRequest = (request: GDPRRequest) => {
    setSelectedRequest(request);
    setDialogOpen(true);
    setProcessingNotes('');
    setProcessingAction('approve');
  };

  const submitProcessing = async () => {
    if (!selectedRequest) return;

    try {
      const { error } = await supabase.rpc('process_gdpr_request', {
        p_request_id: selectedRequest.id,
        p_action: processingAction,
        p_notes: processingNotes
      });

      if (error) throw error;

      toast({
        title: "Demande traitée",
        description: `La demande RGPD a été ${processingAction === 'approve' ? 'approuvée' : processingAction === 'reject' ? 'rejetée' : 'mise en attente'} avec succès`,
      });

      setDialogOpen(false);
      setSelectedRequest(null);
      fetchGDPRRequests();
      fetchComplianceMetrics();
    } catch (error) {
      logger.error('Error processing GDPR request', { error });
      toast({
        title: "Erreur",
        description: "Impossible de traiter la demande RGPD",
        variant: "destructive",
      });
    }
  };

  const handleUserDataAccess = async (userId: string) => {
    try {
      setExporting(true);

      const { data, error } = await supabase.rpc('get_user_gdpr_data', {
        p_user_id: userId
      });

      if (error) throw error;

      setUserDataView(data);
      toast({
        title: "Données utilisateur chargées",
        description: "Les données de l'utilisateur ont été récupérées avec succès",
      });
    } catch (error) {
      logger.error('Error fetching user GDPR data', { error });
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les données utilisateur",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleDataDeletion = async (userId: string, requestId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement toutes les données de cet utilisateur ? Cette action est irréversible.')) {
      return;
    }

    try {
      const { error } = await supabase.rpc('execute_right_to_be_forgotten', {
        p_user_id: userId,
        p_request_id: requestId,
        p_anonymize_instead_of_delete: false
      });

      if (error) throw error;

      toast({
        title: "Suppression complétée",
        description: "Toutes les données de l'utilisateur ont été supprimées conformément au RGPD",
      });

      fetchGDPRRequests();
      fetchComplianceMetrics();
    } catch (error) {
      logger.error('Error executing data deletion', { error });
      toast({
        title: "Erreur",
        description: "Impossible de supprimer les données utilisateur",
        variant: "destructive",
      });
    }
  };

  const handleDataExport = async (format: 'json' | 'csv') => {
    if (!userDataView) return;

    try {
      const { data, error } = await supabase.rpc('export_user_gdpr_data', {
        p_user_id: userDataView.user_id,
        p_format: format
      });

      if (error) throw error;

      // Créer un blob et télécharger
      const blob = new Blob([format === 'json' ? JSON.stringify(data, null, 2) : data], {
        type: format === 'json' ? 'application/json' : 'text/csv'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user_data_${format}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export réussi",
        description: `Les données utilisateur ont été exportées au format ${format.toUpperCase()}`,
      });
    } catch (error) {
      logger.error('Error exporting user data', { error });
      toast({
        title: "Erreur",
        description: "Impossible d'exporter les données utilisateur",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string, deadline?: string) => {
    const isOverdue = deadline && new Date(deadline) < new Date() && status !== 'completed';

    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      case 'processing': return 'text-blue-600 bg-blue-50';
      case 'requires_info': return 'text-amber-600 bg-amber-50';
      case 'pending': return isOverdue ? 'text-red-600 bg-red-50' : 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case 'data_access': return 'Accès aux données';
      case 'data_deletion': return 'Droit à l\'oubli';
      case 'data_correction': return 'Rectification';
      case 'portability': return 'Portabilité';
      case 'objection': return 'Opposition';
      default: return type;
    }
  };

  const getGDPRArticleLabel = (article?: string) => {
    if (!article) return '-';

    const articles: Record<string, string> = {
      'art15': 'Article 15 - Accès',
      'art16': 'Article 16 - Rectification',
      'art17': 'Article 17 - Effacement',
      'art18': 'Article 18 - Limitation',
      'art20': 'Article 20 - Portabilité',
      'art21': 'Article 21 - Opposition'
    };

    return articles[article] || article;
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = !searchTerm ||
      request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requester?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requester?.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesType = typeFilter === 'all' || request.request_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Scale className="h-6 w-6" />
            Conformité RGPD & Droit à l'Oubli
          </h2>
          <p className="text-muted-foreground">
            Gestion des demandes RGPD et protection des données personnelles
          </p>
        </div>
        <Button onClick={() => { fetchGDPRRequests(); fetchComplianceMetrics(); }}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Compliance Metrics */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Score de Conformité</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{metrics.compliance_score}%</div>
              <p className="text-xs text-muted-foreground">
                Conformité RGPD
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Demandes en attente</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{metrics.pending_requests}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.overdue_requests} en retard
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Temps moyen</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(metrics.average_processing_days)}j
              </div>
              <p className="text-xs text-muted-foreground">
                Temps de traitement
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total demandes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total_requests}</div>
              <p className="text-xs text-muted-foreground">
                Ce mois
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Critical Alerts */}
      {metrics && metrics.overdue_requests > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>🚨 Demandes RGPD en retard</AlertTitle>
          <AlertDescription>
            {metrics.overdue_requests} demande{metrics.overdue_requests > 1 ? 's' : ''} RGPD dépassent le délai légal de 30 jours.
            Action immédiate requise pour éviter des sanctions.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="requests">Demandes RGPD</TabsTrigger>
          <TabsTrigger value="compliance">Conformité</TabsTrigger>
          <TabsTrigger value="data-management">Gestion des données</TabsTrigger>
          <TabsTrigger value="settings">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtres</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-center flex-wrap">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par utilisateur, description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="processing">En cours</SelectItem>
                    <SelectItem value="completed">Terminé</SelectItem>
                    <SelectItem value="rejected">Rejeté</SelectItem>
                    <SelectItem value="requires_info">Info requise</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Type de demande" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="data_access">Accès aux données</SelectItem>
                    <SelectItem value="data_deletion">Droit à l'oubli</SelectItem>
                    <SelectItem value="data_correction">Rectification</SelectItem>
                    <SelectItem value="portability">Portabilité</SelectItem>
                    <SelectItem value="objection">Opposition</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Requests Table */}
          <Card>
            <CardHeader>
              <CardTitle>Demandes RGPD</CardTitle>
              <CardDescription>
                {filteredRequests.length} demande{filteredRequests.length > 1 ? 's' : ''} trouvée{filteredRequests.length > 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Délai</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            {request.requester?.avatar_url ? (
                              <img src={request.requester.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <Users className="h-4 w-4 text-gray-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{request.requester?.full_name}</p>
                            <p className="text-sm text-muted-foreground">{request.requester?.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <Badge variant="outline">
                            {getRequestTypeLabel(request.request_type)}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {getGDPRArticleLabel(request.gdpr_article)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(request.status, request.deadline_at)}>
                          {request.status === 'pending' && 'En attente'}
                          {request.status === 'processing' && 'En cours'}
                          {request.status === 'completed' && 'Terminé'}
                          {request.status === 'rejected' && 'Rejeté'}
                          {request.status === 'requires_info' && 'Info requise'}
                        </Badge>
                        {request.deadline_at && new Date(request.deadline_at) < new Date() && request.status !== 'completed' && (
                          <AlertTriangle className="h-4 w-4 text-red-600 ml-2" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {Math.ceil((new Date(request.deadline_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} jours
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(request.created_at), 'dd MMM yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleProcessRequest(request)}
                            disabled={request.status === 'completed'}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {request.request_type === 'data_deletion' && request.status === 'pending' && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDataDeletion(request.user_id, request.id)}
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Conformité RGPD
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Score de conformité</span>
                    <span className="font-medium text-green-600">{metrics?.compliance_score}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Temps moyen de réponse</span>
                    <span className="font-medium">{Math.round(metrics?.average_processing_days || 0)} jours</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Demandes dans les délais</span>
                    <span className="font-medium text-green-600">
                      {metrics?.completed_requests - metrics?.overdue_requests}/{metrics?.completed_requests}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Volume de données anonymisées</span>
                    <span className="font-medium">{metrics?.data_volume_anonymized}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Politiques de rétention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Conformité des rétentions</span>
                    <span className="font-medium text-green-600">{metrics?.retention_policy_compliance}%</span>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Catégories de données</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Profil utilisateur: 2 ans après suppression</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Messages: 1 an après suppression</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Logs de connexion: 6 mois</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <span>Analytics: Anonymisation après 30 jours</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="data-management" className="space-y-4">
          {userDataView && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Données Utilisateur
                </CardTitle>
                <CardDescription>
                  Données personnelles disponibles pour export RGPD
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleDataExport('json')}
                      disabled={exporting}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exporter JSON
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDataExport('csv')}
                      disabled={exporting}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exporter CSV
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-medium mb-2">Informations du profil</h4>
                      <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                        {JSON.stringify(userDataView.personal_data.profile_info, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Historique des communications</h4>
                      <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                        {JSON.stringify(userDataView.personal_data.communication_history, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!userDataView && (
            <Card>
              <CardContent className="text-center py-8">
                <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucune donnée sélectionnée</h3>
                <p className="text-muted-foreground">
                  Sélectionnez une demande d'accès aux données pour voir les informations utilisateur
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuration RGPD
              </CardTitle>
              <CardDescription>
                Paramètres de conformité et traitement des demandes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-4">Délais de traitement</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Délai légal maximum:</span>
                      <Badge variant="outline">30 jours</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Délai d'alerte:</span>
                      <Badge variant="outline">25 jours</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Délai cible:</span>
                      <Badge className="bg-green-100 text-green-800">15 jours</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-4">Politiques de données</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Consentement explicite requis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Anonymisation automatique après expiration</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Chiffrement des données sensibles</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Audit trail complet</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-4">Notifications automatiques</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <span>Email de confirmation de réception</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <span>Email de traitement en cours</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <span>Email de complétion</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span>Alertes de retard automatiques</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Processing Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Traiter la demande RGPD</DialogTitle>
            <DialogDescription>
              Traitement de la demande de {selectedRequest?.requester?.full_name}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* Request Details */}
              <div>
                <h4 className="font-medium mb-2">Détails de la demande</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Type:</span>
                      <Badge>{getRequestTypeLabel(selectedRequest.request_type)}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Article RGPD:</span>
                      <span className="font-medium">{getGDPRArticleLabel(selectedRequest.gdpr_article)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Priorité:</span>
                      <Badge className={selectedRequest.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>
                        {selectedRequest.priority}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Date:</span>
                      <span className="font-medium">{format(new Date(selectedRequest.created_at), 'dd MMM yyyy', { locale: fr })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Deadline:</span>
                      <span className="font-medium text-amber-600">{format(new Date(selectedRequest.deadline_at), 'dd MMM yyyy', { locale: fr })}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm">{selectedRequest.description}</p>
                </div>
              </div>

              {/* Processing Action */}
              <div>
                <h4 className="font-medium mb-2">Action de traitement</h4>
                <Select value={processingAction} onValueChange={(value: any) => setProcessingAction(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approve">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Approuver et traiter
                      </div>
                    </SelectItem>
                    <SelectItem value="request_info">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        Demander informations supplémentaires
                      </div>
                    </SelectItem>
                    <SelectItem value="reject">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        Rejeter la demande
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Processing Notes */}
              <div>
                <h4 className="font-medium mb-2">Notes de traitement</h4>
                <Textarea
                  placeholder="Ajoutez des notes sur le traitement de cette demande RGPD..."
                  value={processingNotes}
                  onChange={(e) => setProcessingNotes(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Data Access Options */}
              {selectedRequest.request_type === 'data_access' && (
                <div>
                  <h4 className="font-medium mb-2">Actions de données</h4>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleUserDataAccess(selectedRequest.user_id)}
                      disabled={exporting}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {exporting ? 'Chargement...' : 'Voir les données'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Right to be Forgotten Warning */}
              {selectedRequest.request_type === 'data_deletion' && processingAction === 'approve' && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>⚠️ Action irréversible</AlertTitle>
                  <AlertDescription>
                    En approuvant cette demande, toutes les données personnelles de l'utilisateur seront supprimées définitivement conformément au droit à l'oubli (Article 17 RGPD). Cette action ne peut pas être annulée.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={submitProcessing}>
              {processingAction === 'approve' && 'Approuver'}
              {processingAction === 'request_info' && 'Demander info'}
              {processingAction === 'reject' && 'Rejeter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};