import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { DynamicBreadcrumb } from '@/components/navigation/DynamicBreadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  PieChart,
  Calendar,
  Filter
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ReportStats {
  totalVerifications: number;
  pendingVerifications: number;
  completedVerifications: number;
  rejectedVerifications: number;
  averageProcessingTime: number;
  verificationRate: number;
  propertiesVerified: number;
  documentsProcessed: number;
}

interface MonthlyData {
  month: string;
  verifications: number;
  completed: number;
  rejected: number;
}

interface UserTypeStats {
  userType: string;
  count: number;
  verificationRate: number;
}

const TiersRapports = () => {
  const { profile, loading } = useAuth();
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [userTypeStats, setUserTypeStats] = useState<UserTypeStats[]>([]);
  const [dateRange, setDateRange] = useState('30days');
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (profile?.user_type !== 'tiers_de_confiance') {
      return;
    }

    const fetchReportData = async () => {
      try {
        // Récupérer les statistiques de vérification
        const { data: verifications, error: verifError } = await supabase
          .from('user_verifications')
          .select('*');

        if (verifError) throw verifError;

        // Récupérer les statistiques des propriétés
        const { data: properties, error: propError } = await supabase
          .from('properties')
          .select('verification_status');

        if (propError) throw propError;

        // Calculer les statistiques
        const totalVerifications = verifications?.length || 0;
        const pendingVerifications = verifications?.filter(v =>
          v.oneci_status === 'pending' || v.cnam_status === 'pending'
        ).length || 0;
        const completedVerifications = verifications?.filter(v =>
          (v.oneci_status === 'verified' || v.cnam_status === 'verified') &&
          v.face_verification_status === 'verified'
        ).length || 0;
        const rejectedVerifications = verifications?.filter(v =>
          v.oneci_status === 'rejected' || v.cnam_status === 'rejected'
        ).length || 0;

        const verificationRate = totalVerifications > 0 ? (completedVerifications / totalVerifications) * 100 : 0;
        const propertiesVerified = properties?.filter(p => p.verification_status === 'verified').length || 0;

        // Données mensuelles (simulation)
        const monthlyStats: MonthlyData[] = [
          { month: 'Janvier', verifications: 45, completed: 38, rejected: 3 },
          { month: 'Février', verifications: 52, completed: 45, rejected: 5 },
          { month: 'Mars', verifications: 61, completed: 52, rejected: 6 },
          { month: 'Avril', verifications: 58, completed: 49, rejected: 4 },
          { month: 'Mai', verifications: 72, completed: 63, rejected: 7 },
          { month: 'Juin', verifications: 68, completed: 59, rejected: 5 },
        ];

        // Statistiques par type d'utilisateur
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_type');

        const userTypes = ['locataire', 'proprietaire', 'agence'];
        const userTypeStatsData: UserTypeStats[] = userTypes.map(type => {
          const typeCount = profiles?.filter(p => p.user_type === type).length || 0;
          const typeVerifications = verifications?.filter(v => {
            const userProfile = profiles?.find(p => p.id === v.user_id);
            return userProfile?.user_type === type;
          }) || [];

          const typeCompleted = typeVerifications.filter(v =>
            v.oneci_status === 'verified' || v.cnam_status === 'verified'
          ).length;

          return {
            userType: type,
            count: typeCount,
            verificationRate: typeCount > 0 ? (typeCompleted / typeCount) * 100 : 0
          };
        });

        setStats({
          totalVerifications,
          pendingVerifications,
          completedVerifications,
          rejectedVerifications,
          averageProcessingTime: 2.5, // jours
          verificationRate,
          propertiesVerified,
          documentsProcessed: totalVerifications * 3 // moyenne 3 documents par vérification
        });

        setMonthlyData(monthlyStats);
        setUserTypeStats(userTypeStatsData);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchReportData();
  }, [profile]);

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

  const generateReport = (type: string) => {
    // Logique pour générer différents types de rapports
    console.log(`Génération du rapport: ${type}`);
  };

  const exportData = (format: 'pdf' | 'excel' | 'csv') => {
    // Logique pour exporter les données
    console.log(`Export en ${format}`);
  };

  return (
    <MainLayout>
      <main className="container mx-auto px-2 py-3">
        <div className="max-w-7xl mx-auto space-y-4">
          <DynamicBreadcrumb />

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Rapports et Analytics</h1>
              <p className="text-muted-foreground">
                Suivez les performances et générez des rapports de conformité
              </p>
            </div>
            <div className="flex gap-2">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">7 derniers jours</SelectItem>
                  <SelectItem value="30days">30 derniers jours</SelectItem>
                  <SelectItem value="90days">90 derniers jours</SelectItem>
                  <SelectItem value="1year">Dernière année</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filtres
              </Button>
            </div>
          </div>

          {/* Statistiques principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Vérifications totales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalVerifications || 0}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>+12% ce mois</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  En attente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats?.pendingVerifications || 0}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingDown className="h-3 w-3" />
                  <span>-5% cette semaine</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Taux de validation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats?.verificationRate.toFixed(1) || 0}%</div>
                <Progress value={stats?.verificationRate || 0} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Propriétés validées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats?.propertiesVerified || 0}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>+8 ce mois</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="verifications">Vérifications</TabsTrigger>
              <TabsTrigger value="properties">Propriétés</TabsTrigger>
              <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Graphique des tendances mensuelles */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tendances mensuelles</CardTitle>
                    <CardDescription>Évolution des vérifications sur 6 mois</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {monthlyData.map((month) => (
                        <div key={month.month} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{month.month}</span>
                            <span>{month.verifications} vérifications</span>
                          </div>
                          <div className="flex gap-2">
                            <Progress value={(month.completed / month.verifications) * 100} className="flex-1" />
                            <Progress value={(month.rejected / month.verifications) * 100} className="flex-1 bg-red-100" />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span className="text-green-600">{month.completed} validées</span>
                            <span className="text-red-600">{month.rejected} rejetées</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Statistiques par type d'utilisateur */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Vérifications par type</CardTitle>
                    <CardDescription>Répartition des taux de validation</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {userTypeStats.map((stat) => (
                        <div key={stat.userType} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium capitalize">{stat.userType}</span>
                            <Badge variant="outline">{stat.count} utilisateurs</Badge>
                          </div>
                          <Progress value={stat.verificationRate} />
                          <div className="text-right text-sm text-muted-foreground">
                            {stat.verificationRate.toFixed(1)}% de validation
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="verifications" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Documents ONÉCI</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">156</div>
                      <p className="text-sm text-muted-foreground">Documents traités</p>
                      <div className="mt-2 flex justify-center gap-4 text-xs">
                        <span className="text-green-600">142 validés</span>
                        <span className="text-red-600">14 rejetés</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Documents CNAM</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">89</div>
                      <p className="text-sm text-muted-foreground">Documents traités</p>
                      <div className="mt-2 flex justify-center gap-4 text-xs">
                        <span className="text-green-600">85 validés</span>
                        <span className="text-red-600">4 rejetés</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Vérifications faciales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">234</div>
                      <p className="text-sm text-muted-foreground">Scans effectués</p>
                      <div className="mt-2 flex justify-center gap-4 text-xs">
                        <span className="text-green-600">228 validés</span>
                        <span className="text-red-600">6 rejetés</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="properties" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Validation des propriétés</CardTitle>
                  <CardDescription>Statistiques des documents de propriété</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{stats?.propertiesVerified || 0}</div>
                      <p className="text-sm text-muted-foreground">Propriétés validées</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">12</div>
                      <p className="text-sm text-muted-foreground">En attente</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">5</div>
                      <p className="text-sm text-muted-foreground">En cours</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">98.5%</div>
                      <p className="text-sm text-muted-foreground">Taux de validation</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Activité des utilisateurs</CardTitle>
                  <CardDescription>Soumissions et complétion par type d'utilisateur</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userTypeStats.map((stat) => (
                      <div key={stat.userType} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium capitalize">{stat.userType}</p>
                            <p className="text-sm text-muted-foreground">{stat.count} utilisateurs actifs</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{stat.verificationRate.toFixed(1)}%</div>
                          <p className="text-sm text-muted-foreground">taux de validation</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Actions d'export */}
          <Card>
            <CardHeader>
              <CardTitle>Exporter les rapports</CardTitle>
              <CardDescription>Générez et téléchargez des rapports détaillés</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => generateReport('monthly')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Rapport mensuel
                </Button>
                <Button onClick={() => generateReport('quarterly')} variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Rapport trimestriel
                </Button>
                <Button onClick={() => generateReport('compliance')} variant="outline">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Rapport de conformité
                </Button>
                <div className="flex gap-2 ml-auto">
                  <Button onClick={() => exportData('pdf')} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button onClick={() => exportData('excel')} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                  <Button onClick={() => exportData('csv')} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </MainLayout>
  );
};

export default TiersRapports;