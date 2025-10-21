import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Eye,
  Download,
  MessageSquare,
  BarChart3,
  Calendar,
  FileText,
  Users,
  Filter,
  TrendingUp,
  TrendingDown,
  Send,
  RefreshCw,
  Shield,
  Star,
  Award,
  Target,
  Activity
} from 'lucide-react';

interface VerificationRequest {
  id: string;
  requester_id: string;
  requester_type: 'owner' | 'tenant' | 'agency';
  document_type: 'id_card' | 'property_title' | 'lease' | 'other';
  document_url: string;
  document_name: string;
  status: 'pending' | 'approved' | 'rejected';
  tier_confidence_id: string;
  notes?: string;
  rejection_reason?: string;
  verification_notes?: string;
  created_at: string;
  completed_at?: string;
  reviewer_id?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: Record<string, any>;
}

interface TrustMetrics {
  total_requests: number;
  pending_requests: number;
  approved_requests: number;
  rejected_requests: number;
  average_processing_time: number;
  completion_rate: number;
  monthly_trend: {
    month: string;
    total: number;
    approved: number;
    rejected: number;
  }[];
  category_stats: Record<string, number>;
  performance_score: number;
}

interface TrustDashboardAdvancedProps {
  userId?: string;
}

const TrustDashboardAdvanced: React.FC<TrustDashboardAdvancedProps> = ({ userId }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [metrics, setMetrics] = useState<TrustMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  const targetUserId = userId || user?.id;

  useEffect(() => {
    if (targetUserId) {
      fetchRequests();
      fetchMetrics();
    }
  }, [targetUserId]);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('verification_requests')
        .select(`
          *,
          requester:profiles!requester_id(
            full_name,
            avatar_url,
            user_type
          ),
          reviewer:profiles!reviewer_id(
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      logger.error('Error fetching verification requests:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les demandes de vérification',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      // Calculate metrics from requests
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const { data: recentRequests } = await supabase
        .from('verification_requests')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (recentRequests) {
        const total = recentRequests.length;
        const pending = recentRequests.filter(r => r.status === 'pending').length;
        const approved = recentRequests.filter(r => r.status === 'approved').length;
        const rejected = recentRequests.filter(r => r.status === 'rejected').length;

        // Calculate average processing time
        const completed = recentRequests.filter(r => r.status !== 'pending');
        const avgProcessingTime = completed.length > 0
          ? completed.reduce((sum, r) => {
              if (r.completed_at && r.created_at) {
                return sum + (new Date(r.completed_at).getTime() - new Date(r.created_at).getTime());
              }
              return sum;
            }, 0) / completed.length
          : 0;

        // Monthly trend (last 6 months)
        const monthlyTrend = [];
        for (let i = 5; i >= 0; i--) {
          const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

          const monthRequests = recentRequests.filter(r => {
            const createdAt = new Date(r.created_at);
            return createdAt >= monthStart && createdAt < monthEnd;
          });

          monthlyTrend.push({
            month: monthStart.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
            total: monthRequests.length,
            approved: monthRequests.filter(r => r.status === 'approved').length,
            rejected: monthRequests.filter(r => r.status === 'rejected').length
          });
        }

        // Category stats
        const categoryStats = recentRequests.reduce((stats, request) => {
          stats[request.document_type] = (stats[request.document_type] || 0) + 1;
          return stats;
        }, {} as Record<string, number>);

        // Performance score (0-100)
        const completionRate = total > 0 ? ((approved + rejected) / total) * 100 : 0;
        const avgTimeScore = avgProcessingTime < 86400000 ? 100 : Math.max(0, 100 - (avgProcessingTime / 86400000));
        const completionScore = completionRate * 0.7 + avgTimeScore * 0.3;

        setMetrics({
          total_requests: total,
          pending_requests: pending,
          approved_requests: approved,
          rejected_requests: rejected,
          average_processing_time: avgProcessingTime,
          completion_rate: completionRate,
          monthly_trend: monthlyTrend,
          category_stats: categoryStats,
          performance_score: Math.round(completionScore)
        });
      }
    } catch (error) {
      logger.error('Error fetching metrics:', error);
    }
  };

  const handleReview = async (requestId: string, action: 'approve' | 'reject', notes: string) => {
    try {
      const updates = {
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewer_id: targetUserId,
        completed_at: new Date().toISOString(),
        verification_notes: notes,
        ...(action === 'reject' && { rejection_reason: notes })
      };

      const { error } = await supabase
        .from('verification_requests')
        .update(updates)
        .eq('id', requestId);

      if (error) throw error;

      // Send notification to requester
      const request = requests.find(r => r.id === requestId);
      if (request) {
        await sendVerificationNotification(request, action === 'approve');
      }

      toast({
        title: action === 'approve' ? 'Demande approuvée' : 'Demande rejetée',
        description: `La demande a été ${action === 'approve' ? 'approuvée' : 'rejetée'} avec succès`,
      });

      // Refresh data
      fetchRequests();
      fetchMetrics();
      setSelectedRequest(null);

    } catch (error) {
      logger.error('Error reviewing request:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de traiter la demande',
        variant: 'destructive'
      });
    }
  };

  const sendVerificationNotification = async (request: VerificationRequest, status: 'approved' | 'rejected') => {
    try {
      const notificationPayload = {
        title: status === 'approved' ? '✅ Document vérifié' : '❌ Demande rejetée',
        body: status === 'approved'
          ? `Votre document "${request.document_name}" a été vérifié avec succès`
          : `Votre demande pour "${request.document_name}" a été rejetée. ${request.rejection_reason ? `Motif: ${request.rejection_reason}` : ''}`,
        icon: status === 'approved' ? '/icons/check-circle.png' : '/icons/x-circle.png',
        tag: 'verification-update',
        data: {
          type: 'verification',
          requestId: request.id,
          status
        }
      };

      // In a real implementation, this would send via push notification service
      console.log('Notification to send:', notificationPayload);
    } catch (error) {
      logger.error('Error sending verification notification:', error);
    }
  };

  const generateReport = async () => {
    try {
      const reportData = {
        generated_at: new Date().toISOString(),
        generated_by: user?.full_name,
        metrics,
        requests: requests,
        period: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString()
        }
      };

      // In a real implementation, this would generate and download a PDF
      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `verification-report-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Rapport généré',
        description: 'Le rapport de vérification a été téléchargé',
      });

    } catch (error) {
      logger.error('Error generating report:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de générer le rapport',
        variant: 'destructive'
      });
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchRequests();
    await fetchMetrics();
    setRefreshing(false);
  };

  // Filter requests
  const filteredRequests = requests.filter(request => {
    const statusMatch = filterStatus === 'all' || request.status === filterStatus;
    const typeMatch = filterType === 'all' || request.document_type === filterType;
    const priorityMatch = filterPriority === 'all' || request.priority === filterPriority;
    return statusMatch && typeMatch && priorityMatch;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    if (days > 0) {
      return `${days}j ${remainingHours}h`;
    }
    return `${hours}h`;
  };

  return (
    <div className="space-y-4">
      {/* Header with Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total demandes</p>
                <p className="text-2xl font-bold">{metrics?.total_requests || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">{metrics?.pending_requests || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approuvées</p>
                <p className="text-2xl font-bold text-green-600">{metrics?.approved_requests || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Performance</p>
                <p className="text-2xl font-bold">{metrics?.performance_score || 0}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Requests List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Demandes de Vérification
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshData}
                    disabled={refreshing}
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button variant="outline" size="sm" onClick={generateReport}>
                    <Download className="h-4 w-4 mr-2" />
                    Rapport
                  </Button>
                </div>
              </div>
              <CardDescription>
                Gérez et suivez les demandes de vérification de documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-2 mb-4">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="approved">Approuvées</SelectItem>
                    <SelectItem value="rejected">Rejetées</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous types</SelectItem>
                    <SelectItem value="id_card">Carte d'identité</SelectItem>
                    <SelectItem value="property_title">Titre de propriété</SelectItem>
                    <SelectItem value="lease">Bail</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Priorité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">Haute</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="low">Basse</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Requests Table */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="text-center py-4">
                    <RefreshCw className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                    <p className="text-muted-foreground mt-2">Chargement...</p>
                  </div>
                ) : filteredRequests.length === 0 ? (
                  <div className="text-center py-4">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Aucune demande trouvée</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document</TableHead>
                        <TableHead>Demandeur</TableHead>
                        <TableHead>Priorité</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Temps</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((request) => (
                        <TableRow
                          key={request.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium">{request.document_name}</p>
                              <p className="text-sm text-muted-foreground">{request.document_type}</p>
                              {request.document_url && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(request.document_url, '_blank');
                                  }}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {request.requester?.full_name?.charAt(0) || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{request.requester?.full_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {request.requester?.user_type}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getPriorityColor(request.priority)}>
                              {request.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(request.status)}
                              <span className="capitalize">{request.status}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {request.completed_at && request.created_at ? (
                              <span className="text-sm text-muted-foreground">
                                {formatDuration(
                                  new Date(request.completed_at).getTime() - new Date(request.created_at).getTime()
                                )}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">En cours</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {request.status === 'pending' && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReview(request.id, 'approve', '');
                                  }}
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReview(request.id, 'reject', '');
                                  }}
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar with Selected Request Details */}
        <div>
          {selectedRequest ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Détails de la Demande
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Request Status */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Statut actuel</span>
                  <Badge className={selectedRequest.status === 'approved' ? 'bg-green-100 text-green-800' :
                                   selectedRequest.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                   'bg-yellow-100 text-yellow-800'}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(selectedRequest.status)}
                      <span className="capitalize">{selectedRequest.status}</span>
                    </div>
                  </Badge>
                </div>

                {/* Document Info */}
                <div className="space-y-2">
                  <h4 className="font-semibold">Document</h4>
                  <p className="text-sm font-medium">{selectedRequest.document_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedRequest.document_type}</p>
                  {selectedRequest.document_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(selectedRequest.document_url, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Voir le document
                    </Button>
                  )}
                </div>

                {/* Requester Info */}
                <div className="space-y-2">
                  <h4 className="font-semibold">Demandeur</h4>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {selectedRequest.requester?.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedRequest.requester?.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedRequest.requester?.user_type}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                {selectedRequest.metadata && Object.keys(selectedRequest.metadata).length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Informations additionnelles</h4>
                    <div className="space-y-1">
                      {Object.entries(selectedRequest.metadata).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-sm text-muted-foreground capitalize">{key}:</span>
                          <span className="text-sm">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div className="space-y-2">
                  <h4 className="font-semibold">Historique</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Créé le {new Date(selectedRequest.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                    {selectedRequest.completed_at && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Traité le {new Date(selectedRequest.completed_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                    )}
                    {selectedRequest.reviewer && (
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <span>Vérifié par {selectedRequest.reviewer?.full_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Review Form for pending requests */}
                {selectedRequest.status === 'pending' && (
                  <div className="space-y-4">
                    <h4 className="font-semibold">Revue</h4>
                    <Textarea
                      placeholder="Ajoutez vos notes de vérification..."
                      className="min-h-[100px]"
                    />
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={() => {
                          const notes = document.querySelector('textarea')?.value;
                          if (notes) {
                            handleReview(selectedRequest.id, 'approve', notes);
                          }
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approuver
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          const notes = document.querySelector('textarea')?.value;
                          if (notes) {
                            handleReview(selectedRequest.id, 'reject', notes);
                          }
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Rejeter
                      </Button>
                    </div>
                  </div>
                )}

                {/* Verification Notes */}
                {selectedRequest.verification_notes && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Notes de vérification</h4>
                    <p className="text-sm bg-muted p-3 rounded-lg">
                      {selectedRequest.verification_notes}
                    </p>
                  </div>
                )}

                {/* Rejection Reason */}
                {selectedRequest.rejection_reason && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Motif de rejet</h4>
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{selectedRequest.rejection_reason}</AlertDescription>
                    </Alert>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Sélectionnez une demande pour voir les détails</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Taux de complétion</span>
                  <span className="font-semibold">
                    {metrics?.completion_rate?.toFixed(1) || 0}%
                  </span>
                </div>
                <Progress value={metrics?.completion_rate || 0} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Temps moyen de traitement</span>
                  <span className="font-semibold">
                    {metrics?.average_processing_time ? formatDuration(metrics.average_processing_time) : 'N/A'}
                  </span>
                </div>
                <Progress
                  value={metrics?.average_processing_time ?
                    Math.min(100, (metrics.average_processing_time / 86400000) * 100) : 0
                  }
                />
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Répartition par type</h4>
                {metrics?.category_stats && Object.entries(metrics.category_stats).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-sm">
                    <span className="capitalize">{type.replace('_', ' ')}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TrustDashboardAdvanced;