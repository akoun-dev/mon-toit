import { useState, useEffect } from 'react';
import { AlertTriangle, Users, Scale, Clock, FileText, MessageSquare, Download, Filter, RefreshCw, CheckCircle, XCircle, TrendingUp, ArrowUp, ArrowDown, Loader2, Eye } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import adminDisputeService from '@/services/admin/AdminDisputeService';

const AdminDisputesPage = () => {
  // State pour les litiges et chargement
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    status: '',
    type: '',
    priority: '',
    date_from: '',
    date_to: ''
  });

  // Charger les litiges au montage
  useEffect(() => {
    const loadDisputes = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data, error } = await adminDisputeService.getAllDisputes(filter);

        if (error) {
          console.error('Erreur chargement litiges:', error);
          setError(error.message || 'Erreur de chargement');
        } else if (data) {
          setDisputes(data);
        }
      } catch (err) {
        console.error('Exception chargement litiges:', err);
        setError('Erreur technique lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    loadDisputes();
  }, [filter]); // Recharger quand les filtres changent

  // Gérer les changements de filtres
  const handleFilterChange = (newFilter: any) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
  };

  // Recharger manuellement
  const handleRefresh = () => {
    setDisputes([]);
    const loadDisputes = async () => {
      const { data, error } = await adminDisputeService.getAllDisputes(filter);
      if (data) setDisputes(data);
      if (error) setError(error.message);
    };
    loadDisputes();
  };

  // Formater les dates
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Obtenir la couleur du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'text-green-600 bg-green-50';
      case 'escalated': return 'text-red-600 bg-red-50';
      case 'in_progress': return 'text-blue-600 bg-blue-50';
      case 'under_mediation': return 'text-purple-600 bg-purple-50';
      case 'dismissed': return 'text-gray-600 bg-gray-50';
      default: return 'text-orange-600 bg-orange-50';
    }
  };

  // Obtenir le texte du statut
  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'Ouvert';
      case 'in_progress': return 'En cours';
      case 'under_mediation': return 'Médiation';
      case 'resolved': return 'Résolu';
      case 'escalated': return 'Escaladé';
      case 'dismissed': return 'Rejeté';
      default: return status;
    }
  };

  // Obtenir la couleur du priorité
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Obtenir le texte de la priorité
  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Urgent';
      case 'high': return 'Élevé';
      case 'medium': return 'Moyen';
      case 'low': return 'Bas';
      default: return priority;
    }
  };

  // Afficher le spinner de chargement
  if (loading && disputes.length === 0) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium text-gray-600">Chargement des litiges...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Litiges</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Select value={filter.status} onValueChange={(value) => handleFilterChange({ status: value })}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les statuts</SelectItem>
                  <SelectItem value="open">Ouverts</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="under_mediation">Médiation</SelectItem>
                  <SelectItem value="resolved">Résolus</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {loading ? 'Actualisation...' : 'Actualiser'}
              </Button>
            </div>
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            <strong>Erreur:</strong> {error}
          </div>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Total Litiges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{disputes.length}</div>
              <CardDescription>Actifs et archivés</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-orange-600" />
                En Cours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {disputes.filter(d => d.status === 'in_progress' || d.status === 'under_mediation').length}
              </div>
              <CardDescription>En traitement</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Résolus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {disputes.filter(d => d.status === 'resolved').length}
              </div>
              <CardDescription>Ce mois-ci</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Critiques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {disputes.filter(d => d.priority === 'urgent').length}
              </div>
              <CardDescription>Requérant attention</CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Liste des litiges */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Titre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priorité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {disputes.map((dispute) => (
                  <tr key={dispute.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 max-w-xs">
                      <div className="truncate" title={dispute.title}>
                        {dispute.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Badge className="px-2 py-1 text-xs">
                        {dispute.type === 'payment' && 'Paiement'}
                        {dispute.type === 'property_damage' && 'Dégât'}
                        {dispute.type === 'contract_violation' && 'Contrat'}
                        {dispute.type === 'maintenance' && 'Maintenance'}
                        {dispute.type === 'other' && 'Autre'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getPriorityColor(dispute.priority)}>
                        {getPriorityText(dispute.priority)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getStatusColor(dispute.status)}>
                        {getStatusText(dispute.status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(dispute.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                          Détails
                        </Button>
                        {dispute.status === 'open' && (
                          <Button size="sm">
                            <Scale className="h-4 w-4" />
                            Traiter
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Message si aucun litige */}
        {disputes.length === 0 && !loading && (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600">Aucun litige trouvé</p>
            <p className="text-sm text-gray-500">
              Aucun litige n'a été signalé pour le moment
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default AdminDisputesPageFixed;