import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { DynamicBreadcrumb } from '@/components/navigation/DynamicBreadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, Eye, CheckCircle, XCircle, Clock, FileText, User, Calendar } from 'lucide-react';
import { TiersVerificationQueue } from '@/components/tiers/TiersVerificationQueue';
import { supabase } from '@/lib/supabase';

interface Verification {
  id: string;
  user_id: string;
  profiles: {
    full_name: string;
    user_type: string;
    email?: string;
  };
  oneci_status: string;
  cnam_status: string;
  face_verification_status: string;
  tenant_score: number;
  created_at: string;
  updated_at: string;
}

const TiersVerifications = () => {
  const { profile, loading } = useAuth();
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [filteredVerifications, setFilteredVerifications] = useState<Verification[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (profile?.user_type !== 'tiers_de_confiance') {
      return;
    }

    const fetchVerifications = async () => {
      try {
        const { data, error } = await supabase
          .from('user_verifications')
          .select(`
            *,
            profiles (
              full_name,
              user_type,
              email
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setVerifications(data || []);
        setFilteredVerifications(data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des vérifications:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchVerifications();
  }, [profile]);

  useEffect(() => {
    let filtered = verifications;

    // Filtrage par recherche
    if (searchTerm) {
      filtered = filtered.filter(v =>
        v.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrage par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(v =>
        v.oneci_status === statusFilter ||
        v.cnam_status === statusFilter ||
        v.face_verification_status === statusFilter
      );
    }

    // Filtrage par type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(v => v.profiles?.user_type === typeFilter);
    }

    setFilteredVerifications(filtered);
  }, [verifications, searchTerm, statusFilter, typeFilter]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile || profile.user_type !== 'tiers_de_confiance') {
    return <Navigate to="/auth" replace />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_review': return 'bg-blue-100 text-blue-800';
      case 'verified': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'in_review': return <Eye className="h-4 w-4" />;
      case 'verified': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const stats = {
    total: verifications.length,
    pending: verifications.filter(v =>
      v.oneci_status === 'pending' ||
      v.cnam_status === 'pending' ||
      v.face_verification_status === 'pending'
    ).length,
    inReview: verifications.filter(v =>
      v.oneci_status === 'in_review' ||
      v.cnam_status === 'in_review'
    ).length,
    verified: verifications.filter(v =>
      v.oneci_status === 'verified' ||
      v.cnam_status === 'verified' ||
      v.face_verification_status === 'verified'
    ).length,
  };

  return (
    <MainLayout>
      <main className="container mx-auto px-2 py-3">
        <div className="max-w-7xl mx-auto space-y-4">
          <DynamicBreadcrumb />

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Vérifications</h1>
              <p className="text-muted-foreground">
                Gérez les demandes de vérification des utilisateurs
              </p>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">Demandes</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">En attente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <p className="text-xs text-muted-foreground">À traiter</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">En cours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.inReview}</div>
                <p className="text-xs text-muted-foreground">En révision</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Validées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
                <p className="text-xs text-muted-foreground">Complétées</p>
              </CardContent>
            </Card>
          </div>

          {/* Filtres */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtres</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par nom ou email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="in_review">En cours</SelectItem>
                    <SelectItem value="verified">Validé</SelectItem>
                    <SelectItem value="rejected">Rejeté</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="locataire">Locataires</SelectItem>
                    <SelectItem value="proprietaire">Propriétaires</SelectItem>
                    <SelectItem value="agence">Agences</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Liste des vérifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Demandes de vérification</CardTitle>
              <CardDescription>
                {filteredVerifications.length} demande(s) trouvée(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Chargement...</p>
                </div>
              ) : filteredVerifications.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucune demande de vérification trouvée</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredVerifications.map((verification) => (
                    <div key={verification.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{verification.profiles?.full_name}</p>
                              <p className="text-sm text-muted-foreground">{verification.profiles?.email}</p>
                            </div>
                          </div>
                          <Badge variant="outline">{verification.profiles?.user_type}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {new Date(verification.created_at).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <div className="flex items-center gap-1">
                          {getStatusIcon(verification.oneci_status)}
                          <Badge className={getStatusColor(verification.oneci_status)}>
                            ONÉCI: {verification.oneci_status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(verification.cnam_status)}
                          <Badge className={getStatusColor(verification.cnam_status)}>
                            CNAM: {verification.cnam_status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(verification.face_verification_status)}
                          <Badge className={getStatusColor(verification.face_verification_status)}>
                            Face: {verification.face_verification_status}
                          </Badge>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Score de fiabilité: </span>
                          <span className="font-medium">{verification.tenant_score}/100</span>
                        </div>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          Voir les détails
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </MainLayout>
  );
};

export default TiersVerifications;