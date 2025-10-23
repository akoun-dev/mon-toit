import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Search,
  Filter,
  Calendar,
  User,
  Building2,
  Eye,
  Download,
  MessageSquare,
  BarChart3,
  TrendingUp,
  Activity
} from "lucide-react";
import { supabase } from '@/lib/supabase';

interface Certification {
  id: string;
  leaseId: string;
  propertyTitle: string;
  tenantName: string;
  landlordName: string;
  submittedAt: string;
  status: 'pending' | 'in_review' | 'certified' | 'rejected';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  reviewerId?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  documents: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
    uploadedAt: string;
  }>;
}

const AdminCertifications = () => {
  const { hasRole, loading, profile } = useAuth();
  const [selectedTab, setSelectedTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [certifications, setCertifications] = useState<Certification[]>([]);

  // Données simulées pour démonstration
  const mockCertifications: Certification[] = [
    {
      id: "CERT001",
      leaseId: "LEASE001",
      propertyTitle: "Appartement T3 à Cocody",
      tenantName: "Yao Kouadio",
      landlordName: "Patrice Konan",
      submittedAt: "2024-10-22T10:30:00",
      status: "pending",
      priority: "high",
      documents: [
        {
          id: "DOC001",
          name: "Contrat de bail.pdf",
          type: "lease_contract",
          url: "/docs/lease001.pdf",
          uploadedAt: "2024-10-22T10:30:00"
        },
        {
          id: "DOC002",
          name: "Pièce d'identité.pdf",
          type: "id_document",
          url: "/docs/id001.pdf",
          uploadedAt: "2024-10-22T10:35:00"
        }
      ]
    },
    {
      id: "CERT002",
      leaseId: "LEASE002",
      propertyTitle: "Studio à Marcory",
      tenantName: "Awa Touré",
      landlordName: "AGENCE IMMO-CI",
      submittedAt: "2024-10-21T14:15:00",
      status: "in_review",
      priority: "normal",
      reviewerId: "admin001",
      reviewedAt: "2024-10-22T09:00:00",
      reviewNotes: "Documents complets, en attente de validation finale",
      documents: [
        {
          id: "DOC003",
          name: "Contrat de bail.pdf",
          type: "lease_contract",
          url: "/docs/lease002.pdf",
          uploadedAt: "2024-10-21T14:15:00"
        }
      ]
    },
    {
      id: "CERT003",
      leaseId: "LEASE003",
      propertyTitle: "Villa 4 pièces à Bingerville",
      tenantName: "Koffi Yapo",
      landlordName: "Mariam Bamba",
      submittedAt: "2024-10-20T16:45:00",
      status: "certified",
      priority: "normal",
      reviewerId: "admin002",
      reviewedAt: "2024-10-21T11:30:00",
      reviewNotes: "Certification validée - tous les documents conformes",
      documents: [
        {
          id: "DOC004",
          name: "Contrat de bail.pdf",
          type: "lease_contract",
          url: "/docs/lease003.pdf",
          uploadedAt: "2024-10-20T16:45:00"
        }
      ]
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isAdmin = hasRole('admin') || hasRole('super_admin') || profile?.user_type === 'admin';

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const filteredCertifications = mockCertifications.filter(cert => {
    const matchesSearch = cert.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cert.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cert.landlordName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || cert.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'in_review':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'certified':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'pending': 'secondary',
      'in_review': 'default',
      'certified': 'default',
      'rejected': 'destructive'
    };

    const labels: Record<string, string> = {
      'pending': 'En attente',
      'in_review': 'En révision',
      'certified': 'Certifié',
      'rejected': 'Rejeté'
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const certificationsByStatus = {
    pending: filteredCertifications.filter(c => c.status === 'pending'),
    in_review: filteredCertifications.filter(c => c.status === 'in_review'),
    certified: filteredCertifications.filter(c => c.status === 'certified'),
    rejected: filteredCertifications.filter(c => c.status === 'rejected')
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Shield className="h-8 w-8 text-orange-600" />
              Certifications ANSUT
            </h1>
            <p className="text-gray-600 mt-1">
              Gérez les demandes de certification des baux et suivez leur statut
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exporter
          </Button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">En attente</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {certificationsByStatus.pending.length}
                  </p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">En révision</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {certificationsByStatus.in_review.length}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Certifiés</p>
                  <p className="text-2xl font-bold text-green-600">
                    {certificationsByStatus.certified.length}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rejetés</p>
                  <p className="text-2xl font-bold text-red-600">
                    {certificationsByStatus.rejected.length}
                  </p>
                </div>
                <div className="bg-red-100 p-3 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher une certification..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="in_review">En révision</SelectItem>
              <SelectItem value="certified">Certifié</SelectItem>
              <SelectItem value="rejected">Rejeté</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtres avancés
          </Button>
        </div>

        {/* Onglets */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              En attente
              {certificationsByStatus.pending.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {certificationsByStatus.pending.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="in_review" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              En révision
              {certificationsByStatus.in_review.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {certificationsByStatus.in_review.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="certified" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Certifiés
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Rejetés
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            <div className="space-y-4">
              {certificationsByStatus.pending.map((certification) => (
                <Card key={certification.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold">{certification.propertyTitle}</h3>
                          <Badge className={getPriorityColor(certification.priority)}>
                            {certification.priority}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Locataire</p>
                            <p className="font-medium flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {certification.tenantName}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Propriétaire</p>
                            <p className="font-medium flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {certification.landlordName}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Date de soumission</p>
                            <p className="font-medium flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(certification.submittedAt).toLocaleDateString('fr-CI')}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Documents</p>
                            <p className="font-medium flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {certification.documents.length} fichier(s)
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                          <Button size="sm" className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            Voir détails
                          </Button>
                          <Button variant="outline" size="sm" className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            Contacter
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {certificationsByStatus.pending.length === 0 && (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Aucune certification en attente</h3>
                  <p className="text-gray-500">Toutes les demandes ont été traitées.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="in_review" className="mt-6">
            <div className="space-y-4">
              {certificationsByStatus.in_review.map((certification) => (
                <Card key={certification.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold">{certification.propertyTitle}</h3>
                          <Badge className={getPriorityColor(certification.priority)}>
                            {certification.priority}
                          </Badge>
                          {getStatusBadge(certification.status)}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                          <div>
                            <p className="text-gray-600">Locataire</p>
                            <p className="font-medium">{certification.tenantName}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Propriétaire</p>
                            <p className="font-medium">{certification.landlordName}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">En révision depuis</p>
                            <p className="font-medium">
                              {certification.reviewedAt ?
                                new Date(certification.reviewedAt).toLocaleDateString('fr-CI') :
                                'Non défini'
                              }
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Notes de révision</p>
                            <p className="font-medium text-xs">
                              {certification.reviewNotes || 'Aucune note'}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm" className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Approuver
                          </Button>
                          <Button variant="outline" size="sm" className="flex items-center gap-1">
                            <XCircle className="h-3 w-3" />
                            Rejeter
                          </Button>
                          <Button variant="outline" size="sm" className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            Demander plus d'infos
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {certificationsByStatus.in_review.length === 0 && (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Aucune certification en révision</h3>
                  <p className="text-gray-500">Aucune demande n'est actuellement en cours de révision.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="certified" className="mt-6">
            <div className="space-y-4">
              {certificationsByStatus.certified.map((certification) => (
                <Card key={certification.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold">{certification.propertyTitle}</h3>
                          <Badge className="bg-green-100 text-green-800">
                            Certifié
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                          <div>
                            <p className="text-gray-600">Locataire</p>
                            <p className="font-medium">{certification.tenantName}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Propriétaire</p>
                            <p className="font-medium">{certification.landlordName}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Certifié le</p>
                            <p className="font-medium">
                              {certification.reviewedAt ?
                                new Date(certification.reviewedAt).toLocaleDateString('fr-CI') :
                                'Non défini'
                              }
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Notes</p>
                            <p className="font-medium text-xs text-green-600">
                              {certification.reviewNotes || 'Certification validée'}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex items-center gap-1">
                            <Download className="h-3 w-3" />
                            Télécharger certificat
                          </Button>
                          <Button variant="outline" size="sm" className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            Voir détails
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {certificationsByStatus.certified.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Aucune certification validée</h3>
                  <p className="text-gray-500">Aucune demande n'a encore été certifiée.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="rejected" className="mt-6">
            <div className="space-y-4">
              {certificationsByStatus.rejected.map((certification) => (
                <Card key={certification.id} className="hover:shadow-md transition-shadow border-red-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold">{certification.propertyTitle}</h3>
                          <Badge variant="destructive">
                            Rejeté
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                          <div>
                            <p className="text-gray-600">Locataire</p>
                            <p className="font-medium">{certification.tenantName}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Propriétaire</p>
                            <p className="font-medium">{certification.landlordName}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Rejeté le</p>
                            <p className="font-medium">
                              {certification.reviewedAt ?
                                new Date(certification.reviewedAt).toLocaleDateString('fr-CI') :
                                'Non défini'
                              }
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Motif de rejet</p>
                            <p className="font-medium text-xs text-red-600">
                              {certification.reviewNotes || 'Non spécifié'}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            Contacter
                          </Button>
                          <Button variant="outline" size="sm" className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            Voir détails
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {certificationsByStatus.rejected.length === 0 && (
                <div className="text-center py-12">
                  <XCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Aucune certification rejetée</h3>
                  <p className="text-gray-500">Aucune demande n'a été rejetée à ce jour.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default AdminCertifications;