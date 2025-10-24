import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, FileText, User, Calendar, TrendingUp, Eye, Download, Filter, RefreshCw, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import adminCertificationService from '@/services/admin/AdminCertificationService';
import { AnsutCertification } from '@/services/admin/AdminCertificationService';

const AdminCertificationsPage = () => {
  // State pour les certifications et chargement
  const [certifications, setCertifications] = useState<AnsutCertification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    status: '',
    reviewer_id: '',
    date_from: '',
    date_to: ''
  });

  // Charger les certifications au montage
  useEffect(() => {
    const loadCertifications = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data, error } = await adminCertificationService.getAllCertifications(filter);

        if (error) {
          console.error('Erreur chargement certifications:', error);
          setError(error.message || 'Erreur de chargement');
        } else if (data) {
          setCertifications(data);
        }
      } catch (err) {
        console.error('Exception chargement certifications:', err);
        setError('Erreur technique lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    loadCertifications();
  }, [filter]); // Recharger quand les filtres changent

  // Gérer les changements de filtres
  const handleFilterChange = (newFilter: any) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
  };

  // Recharger manuellement
  const handleRefresh = () => {
    setCertifications([]);
    const loadCertifications = async () => {
      const { data, error } = await adminCertificationService.getAllCertifications(filter);
      if (data) setCertifications(data);
      if (error) setError(error.message);
    };
    loadCertifications();
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

  // Formater les montants
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount);
  };

  // Obtenir la couleur du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      case 'under_review': return 'text-blue-600 bg-blue-50';
      default: return 'text-orange-600 bg-orange-50';
    }
  };

  // Obtenir le texte du statut
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'under_review': return 'En révision';
      case 'approved': return 'Approuvé';
      case 'rejected': return 'Rejeté';
      case 'expired': return 'Expiré';
      case 'revoked': return 'Révoqué';
      default: return status;
    }
  };

  // Afficher le spinner de chargement
  if (loading && certifications.length === 0) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium text-gray-600">Chargement des certifications...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Certifications ANSUT</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Select value={filter.status} onValueChange={(value) => handleFilterChange({ status: value })}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="under_review">En révision</SelectItem>
                  <SelectItem value="approved">Approuvés</SelectItem>
                  <SelectItem value="rejected">Rejetés</SelectItem>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Total des Certifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{certifications.length}</div>
              <CardDescription>Demandes soumises</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                En Attente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {certifications.filter(c => c.status === 'pending').length}
              </div>
              <CardDescription>À traiter</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Approuvées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {certifications.filter(c => c.status === 'approved').length}
              </div>
              <CardDescription>Ce mois-ci</CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Liste des certifications */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Numéro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bail
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Demandeur
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
                {certifications.map((certification) => (
                  <tr key={certification.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {certification.certification_number || `#${certification.id.slice(0, 8)}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      #{certification.lease_id?.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
                        <span>Utilisateur #{certification.metadata?.requester_user_id?.slice(0, 8)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getStatusColor(certification.status)}>
                        {getStatusText(certification.status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(certification.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                          Voir
                        </Button>
                        {certification.status === 'pending' && (
                          <Button size="sm">
                            <CheckCircle className="h-4 w-4" />
                            Approuver
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

        {/* Message si aucune certification */}
        {certifications.length === 0 && !loading && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600">Aucune certification trouvée</p>
            <p className="text-sm text-gray-500">
              Les demandes de certification apparaîtront ici lorsqu'elles seront soumises
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default AdminCertificationsPage;