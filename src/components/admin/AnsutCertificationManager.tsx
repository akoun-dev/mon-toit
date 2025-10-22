import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Eye,
  Download,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  User,
  MapPin,
  DollarSign,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/services/logger';
import { Skeleton } from '@/components/ui/skeleton';

interface CertificationRequest {
  id: string;
  lease_id: string;
  property_id: string;
  landlord_id: string;
  tenant_id: string;
  certification_type: 'lease_certification' | 'property_verification' | 'tenant_verification';
  status: 'requested' | 'in_review' | 'approved' | 'rejected' | 'requires_additional_info';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  requested_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  rejection_reason?: string;
  approval_notes?: string;
  additional_info_requested?: string[];
  additional_info_provided?: string[];

  // Relations
  lease?: {
    id: string;
    monthly_rent: number;
    start_date: string;
    end_date?: string;
    property: {
      title: string;
      address: string;
      city: string;
      property_type: string;
    };
    landlord: {
      full_name: string;
      email: string;
      phone?: string;
    };
    tenant: {
      full_name: string;
      email: string;
      phone?: string;
    };
  };

  // Documents
  documents?: {
    id: string;
    document_type: string;
    file_url: string;
    file_name: string;
    uploaded_at: string;
    verified: boolean;
  }[];
}

interface CertificationStats {
  total: number;
  pending: number;
  in_review: number;
  approved: number;
  rejected: number;
  avg_processing_time: number;
  this_month: number;
  urgent_count: number;
}

export const AnsutCertificationManager = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('queue');
  const [certifications, setCertifications] = useState<CertificationRequest[]>([]);
  const [stats, setStats] = useState<CertificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCertification, setSelectedCertification] = useState<CertificationRequest | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Form states
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'request_info'>('approve');
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchCertifications();
    fetchStats();

    // Real-time subscription
    const channel = supabase
      .channel('ansut-certifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ansut_certifications'
        },
        () => {
          fetchCertifications();
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCertifications = async () => {
    try {
      const { data, error } = await supabase
        .from('ansut_certifications')
        .select(`
          *,
          lease:leases (
            id,
            monthly_rent,
            start_date,
            end_date,
            property:properties (
              title,
              address,
              city,
              property_type
            ),
            landlord:profiles!leases_landlord_id_fkey (
              full_name,
              email,
              phone
            ),
            tenant:profiles!leases_tenant_id_fkey (
              full_name,
              email,
              phone
            )
          ),
          documents:certification_documents (
            id,
            document_type,
            file_url,
            file_name,
            uploaded_at,
            verified
          )
        `)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setCertifications(data || []);
    } catch (error) {
      logger.error('Error fetching certifications', { error });
      toast({
        title: "Erreur",
        description: "Impossible de charger les certifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('ansut_certification_stats')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setStats(data);
      } else {
        // Calculate stats manually if view doesn't exist
        const { data: certs } = await supabase
          .from('ansut_certifications')
          .select('status, priority, requested_at, reviewed_at');

        if (certs) {
          const total = certs.length;
          const pending = certs.filter(c => c.status === 'requested').length;
          const in_review = certs.filter(c => c.status === 'in_review').length;
          const approved = certs.filter(c => c.status === 'approved').length;
          const rejected = certs.filter(c => c.status === 'rejected').length;
          const urgent_count = certs.filter(c => c.priority === 'urgent').length;

          const this_month = certs.filter(c =>
            new Date(c.requested_at) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          ).length;

          // Calculate average processing time
          const processed_certs = certs.filter(c => c.reviewed_at);
          const avg_processing_time = processed_certs.length > 0
            ? processed_certs.reduce((sum, c) => {
                const start = new Date(c.requested_at);
                const end = new Date(c.reviewed_at!);
                return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
              }, 0) / processed_certs.length
            : 0;

          setStats({
            total,
            pending,
            in_review,
            approved,
            rejected,
            avg_processing_time,
            this_month,
            urgent_count
          });
        }
      }
    } catch (error) {
      logger.error('Error fetching certification stats', { error });
    }
  };

  const handleReview = async (certification: CertificationRequest) => {
    setSelectedCertification(certification);
    setReviewDialogOpen(true);
  };

  const submitReview = async () => {
    if (!selectedCertification) return;

    try {
      const updateData: any = {
        status: reviewAction === 'approve' ? 'approved' : reviewAction === 'reject' ? 'rejected' : 'requires_additional_info',
        reviewed_at: new Date().toISOString(),
        reviewed_by: (await supabase.auth.getUser()).data.user?.id,
      };

      if (reviewAction === 'approve') {
        updateData.approval_notes = reviewNotes;
      } else if (reviewAction === 'reject') {
        updateData.rejection_reason = rejectionReason;
      } else if (reviewAction === 'request_info') {
        updateData.additional_info_requested = ['Veuillez fournir les documents manquants'];
      }

      const { error } = await supabase
        .from('ansut_certifications')
        .update(updateData)
        .eq('id', selectedCertification.id);

      if (error) throw error;

      // Send notification to user
      await supabase.functions.invoke('send-certification-notification', {
        body: {
          certification_id: selectedCertification.id,
          action: reviewAction,
          notes: reviewNotes || rejectionReason || 'Information supplémentaire requise',
        }
      });

      toast({
        title: "Certification traitée",
        description: `La certification a été ${reviewAction === 'approve' ? 'approuvée' : reviewAction === 'reject' ? 'rejetée' : 'mise en attente'} avec succès`,
      });

      setReviewDialogOpen(false);
      setSelectedCertification(null);
      setReviewNotes('');
      setRejectionReason('');
      fetchCertifications();
      fetchStats();
    } catch (error) {
      logger.error('Error submitting review', { error });
      toast({
        title: "Erreur",
        description: "Impossible de traiter la certification",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchCertifications(), fetchStats()]);
    setRefreshing(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected': return 'text-red-600 bg-red-50 border-red-200';
      case 'in_review': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'requires_additional_info': return 'text-amber-600 bg-amber-50 border-amber-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const filteredCertifications = certifications.filter(cert => {
    const matchesSearch = !searchTerm ||
      cert.lease?.property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.lease?.landlord.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.lease?.tenant.full_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || cert.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || cert.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
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
            <Shield className="h-6 w-6" />
            Gestion des Certifications ANSUT
          </h2>
          <p className="text-muted-foreground">
            Traitement des demandes de certification et vérification de conformité
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Demandes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.this_month} ce mois
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Attente</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats.pending + stats.in_review}</div>
              <p className="text-xs text-muted-foreground">
                {stats.urgent_count} urgent{stats.urgent_count > 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approuvées</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((stats.approved / stats.total) * 100)}% de taux
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Temps Moyen</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(stats.avg_processing_time)}j
              </div>
              <p className="text-xs text-muted-foreground">
                Temps de traitement
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Urgent Alerts */}
      {stats && stats.urgent_count > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-900">🚨 Demandes Urgentes</AlertTitle>
          <AlertDescription className="text-red-800">
            {stats.urgent_count} demande{stats.urgent_count > 1 ? 's' : ''} de certification nécessite{stats.urgent_count > 1 ? 'nt' : ''} un traitement immédiat.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="queue">File d'attente</TabsTrigger>
          <TabsTrigger value="processing">En cours</TabsTrigger>
          <TabsTrigger value="completed">Terminées</TabsTrigger>
          <TabsTrigger value="settings">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtres</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par propriété, propriétaire ou locataire..."
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
                    <SelectItem value="requested">Demandé</SelectItem>
                    <SelectItem value="in_review">En révision</SelectItem>
                    <SelectItem value="requires_additional_info">Info requise</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Priorité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les priorités</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">Élevée</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="low">Basse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Certifications Queue */}
          <Card>
            <CardHeader>
              <CardTitle>Demandes de Certification</CardTitle>
              <CardDescription>
                {filteredCertifications.length} demande{filteredCertifications.length > 1 ? 's' : ''} trouvée{filteredCertifications.length > 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Propriété</TableHead>
                    <TableHead>Propriétaire</TableHead>
                    <TableHead>Locataire</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCertifications.filter(c =>
                    ['requested', 'in_review', 'requires_additional_info'].includes(c.status)
                  ).map((certification) => (
                    <TableRow key={certification.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{certification.lease?.property.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {certification.lease?.property.address}, {certification.lease?.property.city}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{certification.lease?.landlord.full_name}</p>
                          <p className="text-sm text-muted-foreground">{certification.lease?.landlord.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{certification.lease?.tenant.full_name}</p>
                          <p className="text-sm text-muted-foreground">{certification.lease?.tenant.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">
                        {certification.certification_type.replace('_', ' ')}
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(certification.priority)}>
                          {certification.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(certification.status)}>
                          {certification.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(certification.requested_at), 'dd MMM yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReview(certification)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {certification.documents && certification.documents.length > 0 && (
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4" />
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

        <TabsContent value="processing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Demandes en cours de traitement</CardTitle>
              <CardDescription>
                Certifications actuellement en révision par l'équipe ANSUT
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-8 text-muted-foreground">
                Les demandes en cours de traitement apparaîtront ici
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Demandes terminées</CardTitle>
              <CardDescription>
                Historique des certifications approuvées et rejetées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-8 text-muted-foreground">
                Les demandes terminées apparaîtront ici
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuration des Certifications
              </CardTitle>
              <CardDescription>
                Paramètres et règles pour le processus de certification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Types de certifications</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Certification de bail (Conformité ANSUT)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Vérification de propriété</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Vérification de locataire</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Niveaux de priorité</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-100 text-red-800">Urgent</Badge>
                      <span>Traitement immédiat requis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-orange-100 text-orange-800">Élevé</Badge>
                      <span>Traitement dans les 24h</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-yellow-100 text-yellow-800">Moyen</Badge>
                      <span>Traitement dans les 72h</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800">Bas</Badge>
                      <span>Traitement standard</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Examiner la Certification</DialogTitle>
            <DialogDescription>
              Vérifiez les détails et prenez une décision sur cette demande de certification
            </DialogDescription>
          </DialogHeader>

          {selectedCertification && (
            <div className="space-y-6 max-h-96 overflow-y-auto">
              {/* Certification Details */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">Informations du bail</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Propriété:</span>
                      <span className="font-medium">{selectedCertification.lease?.property.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Adresse:</span>
                      <span>{selectedCertification.lease?.property.address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Loyer mensuel:</span>
                      <span className="font-medium">
                        {selectedCertification.lease?.monthly_rent?.toLocaleString()} FCFA
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Parties concernées</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Propriétaire:</span>
                      <p className="font-medium">{selectedCertification.lease?.landlord.full_name}</p>
                      <p className="text-xs text-muted-foreground">{selectedCertification.lease?.landlord.email}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Locataire:</span>
                      <p className="font-medium">{selectedCertification.lease?.tenant.full_name}</p>
                      <p className="text-xs text-muted-foreground">{selectedCertification.lease?.tenant.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documents */}
              {selectedCertification.documents && selectedCertification.documents.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Documents fournis</h4>
                  <div className="space-y-2">
                    {selectedCertification.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium text-sm">{doc.file_name}</p>
                          <p className="text-xs text-muted-foreground">{doc.document_type}</p>
                        </div>
                        <Badge variant={doc.verified ? 'default' : 'secondary'}>
                          {doc.verified ? 'Vérifié' : 'Non vérifié'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Review Action */}
              <div>
                <h4 className="font-medium mb-2">Action requise</h4>
                <Select value={reviewAction} onValueChange={(value: any) => setReviewAction(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approve">Approuver la certification</SelectItem>
                    <SelectItem value="reject">Rejeter la certification</SelectItem>
                    <SelectItem value="request_info">Demander des informations supplémentaires</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Review Notes */}
              {reviewAction === 'approve' && (
                <div>
                  <h4 className="font-medium mb-2">Notes d'approbation</h4>
                  <Textarea
                    placeholder="Ajoutez des commentaires sur cette approbation..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                  />
                </div>
              )}

              {reviewAction === 'reject' && (
                <div>
                  <h4 className="font-medium mb-2">Motif de rejet</h4>
                  <Textarea
                    placeholder="Expliquez pourquoi cette certification est rejetée..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={submitReview}>
              {reviewAction === 'approve' && 'Approuver'}
              {reviewAction === 'reject' && 'Rejeter'}
              {reviewAction === 'request_info' && 'Demander info'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};