import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { DynamicBreadcrumb } from '@/components/navigation/DynamicBreadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Download, Eye, CheckCircle, XCircle, Clock, FileText, Building2, User, Calendar, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Document {
  id: string;
  property_id?: string;
  user_id?: string;
  document_type: 'title_deed' | 'id_card' | 'cnam_certificate' | 'face_photo' | 'receipt' | 'other';
  document_url: string;
  status: 'pending' | 'in_review' | 'verified' | 'rejected';
  uploaded_at: string;
  verified_at?: string;
  verified_by?: string;
  rejection_reason?: string;
  properties?: {
    title: string;
    address: string;
    owner_name: string;
  };
  profiles?: {
    full_name: string;
    user_type: string;
    email?: string;
  };
}

const TiersDocuments = () => {
  const { profile, loading } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (profile?.user_type !== 'tiers_de_confiance') {
      return;
    }

    const fetchDocuments = async () => {
      try {
        // Récupérer les documents des propriétés
        const { data: propertyDocs, error: propertyError } = await supabase
          .from('properties')
          .select(`
            id,
            title,
            address,
            title_deed_url,
            verification_status,
            profiles!properties_owner_id_fkey (
              full_name,
              email
            )
          `)
          .not('title_deed_url', 'is', null);

        if (propertyError) throw propertyError;

        // Récupérer les documents des vérifications utilisateurs
        const { data: verificationDocs, error: verificationError } = await supabase
          .from('user_verifications')
          .select(`
            *,
            profiles (
              full_name,
              user_type,
              email
            )
          `);

        if (verificationError) throw verificationError;

        // Transformer les données en format unifié
        const formattedDocs: Document[] = [];

        // Ajouter les documents de propriétés
        propertyDocs?.forEach((prop: any) => {
          formattedDocs.push({
            id: `prop-${prop.id}`,
            property_id: prop.id,
            document_type: 'title_deed',
            document_url: prop.title_deed_url,
            status: prop.verification_status || 'pending',
            uploaded_at: new Date().toISOString(),
            properties: {
              title: prop.title,
              address: prop.address,
              owner_name: prop.profiles?.full_name || 'Inconnu'
            }
          });
        });

        // Ajouter les documents des vérifications
        verificationDocs?.forEach((verif: any) => {
          // Documents ONÉCI
          if (verif.oneci_data) {
            formattedDocs.push({
              id: `oneci-${verif.id}`,
              user_id: verif.user_id,
              document_type: 'id_card',
              document_url: '/documents/cni/' + verif.id,
              status: verif.oneci_status,
              uploaded_at: verif.created_at,
              profiles: verif.profiles
            });
          }

          // Documents CNAM
          if (verif.cnam_data) {
            formattedDocs.push({
              id: `cnam-${verif.id}`,
              user_id: verif.user_id,
              document_type: 'cnam_certificate',
              document_url: '/documents/cnam/' + verif.id,
              status: verif.cnam_status,
              uploaded_at: verif.created_at,
              profiles: verif.profiles
            });
          }
        });

        setDocuments(formattedDocs);
        setFilteredDocuments(formattedDocs);
      } catch (error) {
        console.error('Erreur lors du chargement des documents:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchDocuments();
  }, [profile]);

  useEffect(() => {
    let filtered = documents;

    // Filtrage par recherche
    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.properties?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.properties?.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.properties?.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrage par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(doc => doc.status === statusFilter);
    }

    // Filtrage par type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(doc => doc.document_type === typeFilter);
    }

    // Filtrage par tab
    if (activeTab === 'properties') {
      filtered = filtered.filter(doc => doc.property_id);
    } else if (activeTab === 'users') {
      filtered = filtered.filter(doc => doc.user_id);
    }

    setFilteredDocuments(filtered);
  }, [documents, searchTerm, statusFilter, typeFilter, activeTab]);

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

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'title_deed': return 'Titre de propriété';
      case 'id_card': return 'Carte d\'identité';
      case 'cnam_certificate': return 'Certificat CNAM';
      case 'face_photo': return 'Photo faciale';
      case 'receipt': return 'Quittance de loyer';
      default: return 'Autre document';
    }
  };

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'title_deed': return <Building2 className="h-4 w-4" />;
      case 'id_card':
      case 'cnam_certificate':
      case 'face_photo': return <User className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const stats = {
    total: documents.length,
    pending: documents.filter(d => d.status === 'pending').length,
    inReview: documents.filter(d => d.status === 'in_review').length,
    verified: documents.filter(d => d.status === 'verified').length,
    rejected: documents.filter(d => d.status === 'rejected').length,
  };

  const propertyDocs = documents.filter(d => d.property_id);
  const userDocs = documents.filter(d => d.user_id);

  return (
    <MainLayout>
      <main className="container mx-auto px-2 sm:px-4 md:px-6 py-3 sm:py-6">
        <div className="max-w-7xl mx-auto space-y-4">
          <DynamicBreadcrumb />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Documents à Valider</h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Consultez et validez les documents uploadés par les utilisateurs
              </p>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">Documents</p>
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
                <CardTitle className="text-sm font-medium">Validés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
                <p className="text-xs text-muted-foreground">Approuvés</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Rejetés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                <p className="text-xs text-muted-foreground">Refusés</p>
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
                      placeholder="Rechercher..."
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
                    <SelectValue placeholder="Type de document" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="title_deed">Titres de propriété</SelectItem>
                    <SelectItem value="id_card">Cartes d'identité</SelectItem>
                    <SelectItem value="cnam_certificate">Certificats CNAM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">
                Tous les documents ({documents.length})
              </TabsTrigger>
              <TabsTrigger value="properties">
                Propriétés ({propertyDocs.length})
              </TabsTrigger>
              <TabsTrigger value="users">
                Utilisateurs ({userDocs.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {activeTab === 'all' && 'Tous les documents'}
                    {activeTab === 'properties' && 'Documents de propriétés'}
                    {activeTab === 'users' && 'Documents d\'utilisateurs'}
                  </CardTitle>
                  <CardDescription>
                    {filteredDocuments.length} document(s) trouvé(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingData ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-sm text-muted-foreground">Chargement...</p>
                    </div>
                  ) : filteredDocuments.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Aucun document trouvé</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredDocuments.map((document) => (
                        <div key={document.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                {getDocumentTypeIcon(document.document_type)}
                                <div>
                                  <p className="font-medium">{getDocumentTypeLabel(document.document_type)}</p>
                                  {document.properties ? (
                                    <p className="text-sm text-muted-foreground">
                                      {document.properties.title} - {document.properties.address}
                                    </p>
                                  ) : document.profiles ? (
                                    <p className="text-sm text-muted-foreground">
                                      {document.profiles.full_name} ({document.profiles.user_type})
                                    </p>
                                  ) : null}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(document.status)}
                                <Badge className={getStatusColor(document.status)}>
                                  {document.status}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {new Date(document.uploaded_at).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          </div>

                          {document.rejection_reason && (
                            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                              <div className="flex items-center gap-2 text-red-800">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="text-sm font-medium">Raison du rejet:</span>
                              </div>
                              <p className="text-sm text-red-700 mt-1">{document.rejection_reason}</p>
                            </div>
                          )}

                          <div className="mt-3 flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                              ID: {document.id}
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4 mr-2" />
                                Voir
                              </Button>
                              <Button size="sm" variant="outline">
                                <Download className="h-4 w-4 mr-2" />
                                Télécharger
                              </Button>
                              {document.status === 'pending' && (
                                <>
                                  <Button size="sm" variant="outline" className="text-green-600">
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Valider
                                  </Button>
                                  <Button size="sm" variant="outline" className="text-red-600">
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Rejeter
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </MainLayout>
  );
};

export default TiersDocuments;