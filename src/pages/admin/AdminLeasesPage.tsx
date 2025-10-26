import { FileText, Search, Filter, Download, Eye, Edit, CheckCircle, XCircle, AlertTriangle, Calendar, Home, Users, DollarSign, Clock, Shield, FileCheck, Scale } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const AdminLeasesPage = () => {
  // Statistiques des baux
  const leaseStats = {
    totalLeases: 1247,
    activeLeases: 892,
    pendingCertification: 45,
    expiredLeases: 23,
    disputesActive: 8,
    totalRevenue: 2847500,
    avgRent: 125000
  };

  // Baux récents
  const recentLeases = [
    {
      id: 1,
      reference: 'BT2025-001247',
      property: 'Appartement F2, Cocody',
      tenant: 'jean.dupont@email.com',
      landlord: 'proprietaire@mon-toit.ci',
      rentAmount: 85000,
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      status: 'active',
      certification: 'certified',
      lastPayment: '2025-10-01',
      nextPayment: '2025-11-01'
    },
    {
      id: 2,
      reference: 'BT2025-001246',
      property: 'Studio, Plateau',
      tenant: 'marie.toure@email.com',
      landlord: 'agence.immobiliere@mon-toit.ci',
      rentAmount: 65000,
      startDate: '2025-02-15',
      endDate: '2026-02-14',
      status: 'active',
      certification: 'pending',
      lastPayment: '2025-10-15',
      nextPayment: '2025-11-15'
    },
    {
      id: 3,
      reference: 'BT2025-001245',
      property: 'Villa 3 chambres, Riviera',
      tenant: 'ahmed.kone@email.com',
      landlord: 'owner@prop.ci',
      rentAmount: 150000,
      startDate: '2024-06-01',
      endDate: '2025-05-31',
      status: 'expired',
      certification: 'certified',
      lastPayment: '2025-05-01',
      nextPayment: '-'
    },
    {
      id: 4,
      reference: 'BT2025-001244',
      property: 'Duplex, Marcory',
      tenant: 'fatima.sylla@email.com',
      landlord: 'proprietaire@mon-toit.ci',
      rentAmount: 120000,
      startDate: '2025-03-01',
      endDate: '2026-02-28',
      status: 'dispute',
      certification: 'certified',
      lastPayment: '2025-09-01',
      nextPayment: '2025-11-01'
    }
  ];

  // Demandes de certification en attente
  const pendingCertifications = [
    {
      id: 1,
      leaseReference: 'BT2025-001246',
      submittedDate: '2025-10-20',
      property: 'Studio, Plateau',
      tenant: 'marie.toure@email.com',
      landlord: 'agence.immobiliere@mon-toit.ci',
      priority: 'normal',
      documents: ['contrat_bail.pdf', 'piece_identite.pdf', 'justificatif_domicile.pdf'],
      reviewStatus: 'pending_review'
    },
    {
      id: 2,
      leaseReference: 'BT2025-001242',
      submittedDate: '2025-10-22',
      property: 'T2, Yopougon',
      tenant: 'kouame.yao@email.com',
      landlord: 'owner@prop.ci',
      priority: 'urgent',
      documents: ['contrat_bail.pdf', 'carte_sejour.pdf'],
      reviewStatus: 'missing_documents'
    }
  ];

  // Litiges en cours
  const activeDisputes = [
    {
      id: 1,
      leaseReference: 'BT2025-001244',
      disputeType: 'Non-paiement loyer',
      initiatedBy: 'landlord',
      amount: 240000,
      initiatedDate: '2025-09-15',
      status: 'mediation',
      mediator: 'mediator@ansut.ci',
      nextHearing: '2025-10-28'
    },
    {
      id: 2,
      leaseReference: 'BT2025-001240',
      disputeType: 'Dégradations immobilières',
      initiatedBy: 'landlord',
      amount: 85000,
      initiatedDate: '2025-10-10',
      status: 'evidence_collection',
      mediator: 'pending_assignment',
      nextHearing: 'TBD'
    }
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      pending: 'secondary',
      expired: 'destructive',
      dispute: 'destructive',
      certified: 'default',
      pending_review: 'secondary'
    } as const;

    const labels = {
      active: 'Actif',
      pending: 'En attente',
      expired: 'Expiré',
      dispute: 'Litige',
      certified: 'Certifié',
      pending_review: 'En révision'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      urgent: 'destructive',
      normal: 'default',
      low: 'secondary'
    } as const;

    const labels = {
      urgent: 'Urgent',
      normal: 'Normal',
      low: 'Faible'
    };

    return (
      <Badge variant={variants[priority as keyof typeof variants]}>
        {labels[priority as keyof typeof labels]}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-teal-600" />
            <div>
              <h1 className="text-3xl font-bold">Gestion des Baux</h1>
              <p className="text-muted-foreground">Administration et validation des contrats de location</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button>
              <FileCheck className="h-4 w-4 mr-2" />
              Nouvelle certification
            </Button>
          </div>
        </div>

        {/* Alertes */}
        {leaseStats.pendingCertification > 40 && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">
              {leaseStats.pendingCertification} certifications en attente
            </AlertTitle>
            <AlertDescription className="text-yellow-700">
              Des demandes de certification nécessitent votre attention.
            </AlertDescription>
          </Alert>
        )}

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Baux actifs</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{leaseStats.activeLeases}</div>
              <p className="text-xs text-muted-foreground">
                +12% ce mois
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En attente certification</CardTitle>
              <FileCheck className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{leaseStats.pendingCertification}</div>
              <p className="text-xs text-muted-foreground">
                Requiert action
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Litiges actifs</CardTitle>
              <Scale className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{leaseStats.disputesActive}</div>
              <p className="text-xs text-muted-foreground">
                En médiation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenus mensuels</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(leaseStats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                Moyenne: {formatCurrency(leaseStats.avgRent)}/mois
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="leases" className="space-y-4">
          <TabsList>
            <TabsTrigger value="leases">Baux récents</TabsTrigger>
            <TabsTrigger value="certifications">Certifications</TabsTrigger>
            <TabsTrigger value="disputes">Litiges</TabsTrigger>
            <TabsTrigger value="analytics">Analytiques</TabsTrigger>
          </TabsList>

          <TabsContent value="leases" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Baux récents</CardTitle>
                    <CardDescription>
                      Gestion de tous les contrats de location
                    </CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Filtrer par statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="active">Actifs</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="expired">Expirés</SelectItem>
                        <SelectItem value="dispute">Litige</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      <Filter className="h-4 w-4 mr-2" />
                      Filtres
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher un bail..."
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="rounded-md border overflow-x-auto max-w-[100vw]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap">Référence</TableHead>
                          <TableHead className="whitespace-nowrap">Propriété</TableHead>
                          <TableHead className="whitespace-nowrap">Locataire</TableHead>
                          <TableHead className="whitespace-nowrap">Loyer</TableHead>
                          <TableHead className="whitespace-nowrap">Période</TableHead>
                          <TableHead className="whitespace-nowrap">Statut</TableHead>
                          <TableHead className="whitespace-nowrap">Certification</TableHead>
                          <TableHead className="whitespace-nowrap">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentLeases.map((lease) => (
                          <TableRow key={lease.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium whitespace-nowrap">
                              <span className="text-sm">{lease.reference}</span>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <div>
                                <p className="font-medium text-sm">{lease.property}</p>
                                <p className="text-xs text-muted-foreground">{lease.landlord}</p>
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="text-sm">{lease.tenant}</span>
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-green-500 flex-shrink-0" />
                                <span className="font-medium text-sm">{formatCurrency(lease.rentAmount)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <div className="text-sm">
                                <p>{lease.startDate}</p>
                                <p className="text-muted-foreground">au {lease.endDate}</p>
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {getStatusBadge(lease.status)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {getStatusBadge(lease.certification)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="certifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Demandes de certification</CardTitle>
                <CardDescription>
                  Validation des contrats de location par l'ANSUT
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingCertifications.map((cert) => (
                    <div key={cert.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold">{cert.leaseReference}</h4>
                            {getPriorityBadge(cert.priority)}
                            {getStatusBadge(cert.reviewStatus)}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="font-medium">Propriété:</p>
                              <p className="text-muted-foreground">{cert.property}</p>
                            </div>
                            <div>
                              <p className="font-medium">Locataire:</p>
                              <p className="text-muted-foreground">{cert.tenant}</p>
                            </div>
                            <div>
                              <p className="font-medium">Soumis le:</p>
                              <p className="text-muted-foreground">{cert.submittedDate}</p>
                            </div>
                          </div>
                          <div className="mt-3">
                            <p className="font-medium text-sm mb-1">Documents:</p>
                            <div className="flex flex-wrap gap-2">
                              {cert.documents.map((doc, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {doc}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Voir
                          </Button>
                          <Button size="sm" variant="default">
                            <FileCheck className="h-4 w-4 mr-1" />
                            Certifier
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="disputes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Litiges en cours</CardTitle>
                <CardDescription>
                  Médiation et résolution des conflits locatifs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeDisputes.map((dispute) => (
                    <div key={dispute.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold">{dispute.leaseReference}</h4>
                            <Badge variant="destructive">{dispute.disputeType}</Badge>
                            <Badge variant="outline">{dispute.status}</Badge>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="font-medium">Montant:</p>
                              <p className="text-red-600 font-semibold">{formatCurrency(dispute.amount)}</p>
                            </div>
                            <div>
                              <p className="font-medium">Initié par:</p>
                              <p className="text-muted-foreground">{dispute.initiatedBy}</p>
                            </div>
                            <div>
                              <p className="font-medium">Date:</p>
                              <p className="text-muted-foreground">{dispute.initiatedDate}</p>
                            </div>
                            <div>
                              <p className="font-medium">Prochaine audience:</p>
                              <p className="text-muted-foreground">{dispute.nextHearing}</p>
                            </div>
                          </div>
                          {dispute.mediator && (
                            <div className="mt-3 flex items-center gap-2 text-sm">
                              <Shield className="h-4 w-4 text-blue-500" />
                              <span>Médiateur: {dispute.mediator}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            Détails
                          </Button>
                          <Button size="sm">
                            <Scale className="h-4 w-4 mr-1" />
                            Gérer
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Statistiques des baux</CardTitle>
                  <CardDescription>
                    Métriques sur les contrats de location
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Durée moyenne des baux</span>
                    <span className="font-medium">18 mois</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Taux de certification</span>
                    <div className="flex items-center gap-2">
                      <Progress value={85} className="w-20" />
                      <span className="text-sm font-medium">85%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Taux de litiges</span>
                    <div className="flex items-center gap-2">
                      <Progress value={3} className="w-20" />
                      <span className="text-sm font-medium">3%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Renouvellement automatique</span>
                    <span className="font-medium">67%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenus par trimestre</CardTitle>
                  <CardDescription>
                    Évolution des revenus locatifs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>T4 2024</span>
                      <span className="font-medium">{formatCurrency(2675000)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>T1 2025</span>
                      <span className="font-medium">{formatCurrency(2720000)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>T2 2025</span>
                      <span className="font-medium">{formatCurrency(2785000)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>T3 2025</span>
                      <span className="font-medium">{formatCurrency(2847500)}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Croissance trimestrielle</span>
                      <span className="text-green-600 font-medium">+2.3%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default AdminLeasesPage;