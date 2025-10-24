import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Building2,
  Users,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Settings,
  LogOut,
  Home,
  Search,
  Map,
  Bell,
  Eye,
  TrendingUp,
  Activity,
  Database,
  Zap,
  TrendingDown,
  Users as UsersIcon,
  Home as HomeIcon
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Composant de barre de progression
const ProgressBar = ({ value, max, label, color }: { value: number; max: number; label: string; color: string }) => {
  const percentage = (value / max) * 100;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Composant de mini graphique circulaire
const CircularProgress = ({ value, max, label, color }: { value: number; max: number; label: string; color: string }) => {
  const percentage = (value / max) * 100;
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg className="w-24 h-24 transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-200"
          />
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={color}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold">{percentage.toFixed(0)}%</span>
        </div>
      </div>
      <p className="text-sm text-gray-600 mt-2">{label}</p>
    </div>
  );
};

// Composant de graphique à barres simple
const BarChart = ({ data, title }: { data: Array<{ label: string; value: number; color: string }>; title: string }) => {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{item.label}</span>
                <span className="text-gray-600">{item.value}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`${item.color} h-3 rounded-full transition-all duration-500`}
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const AdminDashboard = () => {
  const { hasRole, loading, profile } = useAuth();
  const [stats, setStats] = useState({
    pendingCertifications: 0,
    openDisputes: 0,
    pendingProperties: 0,
    totalUsers: 0,
    totalProperties: 0,
    activeLeases: 0
  });

  // Données pour les graphiques
  const monthlyGrowth = [
    { month: 'Août', users: 120, properties: 45, leases: 38 },
    { month: 'Sept', users: 145, properties: 52, leases: 42 },
    { month: 'Oct', users: 168, properties: 61, leases: 48 },
    { month: 'Nov', users: 195, properties: 73, leases: 56 }
  ];

  const certificationsByMonth = [
    { month: 'Août', certified: 25, rejected: 5, pending: 8 },
    { month: 'Sept', certified: 32, rejected: 3, pending: 6 },
    { month: 'Oct', certified: 41, rejected: 7, pending: 12 },
    { month: 'Nov', certified: 48, rejected: 4, pending: 15 }
  ];

  useEffect(() => {
    const fetchStats = async () => {
      // Récupérer les statistiques de base
      const [
        { count: pendingCertifications },
        { data: disputes },
        { count: pendingProperties },
        { count: totalUsers },
        { count: totalProperties },
        { count: activeLeases }
      ] = await Promise.all([
        supabase
          .from('leases')
          .select('*', { count: 'exact', head: true })
          .eq('certification_status', 'pending'),
        supabase.rpc('get_my_disputes'),
        supabase
          .from('properties')
          .select('*', { count: 'exact', head: true })
          .eq('moderation_status', 'pending'),
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('properties')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('leases')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
      ]);

      const openCount = disputes?.filter(d => d.status === 'open').length || 0;

      setStats({
        pendingCertifications: pendingCertifications || 0,
        openDisputes: openCount,
        pendingProperties: pendingProperties || 0,
        totalUsers: totalUsers || 0,
        totalProperties: totalProperties || 0,
        activeLeases: activeLeases || 0
      });
    };

    fetchStats();

    // Configuration des channels pour le temps réel
    const leasesChannel = supabase
      .channel('admin-pending-certifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'leases',
        filter: 'certification_status=eq.pending'
      }, fetchStats)
      .subscribe();

    const propertiesChannel = supabase
      .channel('admin-pending-properties')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'properties',
        filter: 'moderation_status=eq.pending'
      }, fetchStats)
      .subscribe();

    return () => {
      supabase.removeChannel(leasesChannel);
      supabase.removeChannel(propertiesChannel);
    };
  }, []);

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

  const quickActions = [
    {
      title: "Certifications",
      description: "Validations en attente",
      icon: Shield,
      count: stats.pendingCertifications,
      path: "/admin/certifications",
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      title: "Litiges",
      description: "Litiges ouverts",
      icon: AlertTriangle,
      count: stats.openDisputes,
      path: "/admin/disputes",
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    {
      title: "Biens",
      description: "En attente de validation",
      icon: Building2,
      count: stats.pendingProperties,
      path: "/admin/properties",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Utilisateurs",
      description: "Total utilisateurs",
      icon: Users,
      count: stats.totalUsers,
      path: "/admin/users",
      color: "text-green-600",
      bgColor: "bg-green-50"
    }
  ];

  const adminSections = [
    {
      title: "Gestion",
      icon: Database,
      items: [
        { name: "Tableau de bord", path: "/admin", icon: Home },
        { name: "Biens immobiliers", path: "/admin/properties", icon: Building2 },
        { name: "Utilisateurs", path: "/admin/users", icon: Users },
        { name: "Certifications", path: "/admin/certifications", icon: Shield },
        { name: "Vérifications", path: "/admin/verifications", icon: Eye }
      ]
    },
    {
      title: "Sécurité",
      icon: Shield,
      items: [
        { name: "Dashboard Sécurité", path: "/admin/mfa", icon: Shield },
        { name: "Audit système", path: "/admin/audit", icon: Activity },
        { name: "Accès sensibles", path: "/admin/security", icon: Eye }
      ]
    },
    {
      title: "Analytics",
      icon: BarChart3,
      items: [
        { name: "Analytics", path: "/admin/analytics", icon: TrendingUp },
        { name: "Alertes", path: "/admin/alerts", icon: Bell },
        { name: "Rapports", path: "/admin/reports", icon: FileText }
      ]
    },
    {
      title: "Modération",
      icon: AlertTriangle,
      items: [
        { name: "Modération", path: "/admin/moderation", icon: AlertTriangle },
        { name: "Litiges", path: "/admin/disputes", icon: AlertTriangle },
        { name: "Traitement", path: "/admin/processing", icon: Clock }
      ]
    },
    {
      title: "Services",
      icon: Zap,
      items: [
        { name: "Signatures électroniques", path: "/admin/signatures", icon: FileText },
        { name: "Illustrations IA", path: "/admin/illustrations", icon: Settings }
      ]
    }
  ];

  return (
    <MainLayout>
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Shield className="h-8 w-8 text-red-600" />
              Tableau de bord Administration
            </h1>
            <p className="text-gray-600 mt-1">
              Bienvenue, {profile?.full_name || 'Administrateur'}
            </p>
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Paramètres
          </Button>
        </div>

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{action.title}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {action.count}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{action.description}</p>
                    </div>
                    <div className={`${action.bgColor} p-3 rounded-lg`}>
                      <Icon className={`h-6 w-6 ${action.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Actions rapides
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-start gap-2"
                      onClick={() => window.location.href = action.path}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Icon className="h-4 w-4" />
                        <span className="font-medium">{action.title}</span>
                        {action.count > 0 && (
                          <Badge variant="destructive" className="ml-auto">
                            {action.count}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 text-left">
                        {action.description}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                Vue d'ensemble et Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Indicateurs clés */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
                    <div className="text-sm text-gray-600">Utilisateurs</div>
                    <div className="flex items-center justify-center mt-1">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-xs text-green-600">+62%</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.totalProperties}</div>
                    <div className="text-sm text-gray-600">Biens</div>
                    <div className="flex items-center justify-center mt-1">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-xs text-green-600">+38%</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{stats.activeLeases}</div>
                    <div className="text-sm text-gray-600">Baux actifs</div>
                    <div className="flex items-center justify-center mt-1">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-xs text-green-600">+47%</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">87.3%</div>
                    <div className="text-sm text-gray-600">Taux validation</div>
                    <div className="flex items-center justify-center mt-1">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-xs text-green-600">+5%</span>
                    </div>
                  </div>
                </div>

                {/* Graphiques de progression */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-700">Performance ce mois</h4>
                  <ProgressBar
                    value={68}
                    max={100}
                    label="Certifications traitées"
                    color="bg-blue-500"
                  />
                  <ProgressBar
                    value={45}
                    max={100}
                    label="Propriétés validées"
                    color="bg-green-500"
                  />
                  <ProgressBar
                    value={23}
                    max={100}
                    label="Litiges résolus"
                    color="bg-orange-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Graphiques et Analytics */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Graphique de croissance mensuelle */}
            <BarChart
              data={[
                { label: 'Août', value: 120, color: 'bg-blue-500' },
                { label: 'Sept', value: 145, color: 'bg-blue-600' },
                { label: 'Oct', value: 168, color: 'bg-blue-700' },
                { label: 'Nov', value: 195, color: 'bg-blue-800' }
              ]}
              title="Croissance des utilisateurs"
            />

            {/* Graphique de certifications */}
            <BarChart
              data={[
                { label: 'Août', value: 25, color: 'bg-green-500' },
                { label: 'Sept', value: 32, color: 'bg-green-600' },
                { label: 'Oct', value: 41, color: 'bg-green-700' },
                { label: 'Nov', value: 48, color: 'bg-green-800' }
              ]}
              title="Certifications mensuelles"
            />
          </div>

          {/* Graphiques circulaires et indicateurs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-600" />
                  Taux de conversion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-around items-center">
                  <CircularProgress
                    value={87}
                    max={100}
                    label="Inscriptions"
                    color="text-blue-500"
                  />
                  <CircularProgress
                    value={68}
                    max={100}
                    label="Certifications"
                    color="text-green-500"
                  />
                  <CircularProgress
                    value={94}
                    max={100}
                    label="Satisfaction"
                    color="text-purple-500"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  Répartition des utilisateurs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <ProgressBar
                    value={45}
                    max={100}
                    label="Propriétaires"
                    color="bg-blue-500"
                  />
                  <ProgressBar
                    value={35}
                    max={100}
                    label="Locataires"
                    color="bg-green-500"
                  />
                  <ProgressBar
                    value={15}
                    max={100}
                    label="Agences"
                    color="bg-purple-500"
                  />
                  <ProgressBar
                    value={5}
                    max={100}
                    label="Admins"
                    color="bg-red-500"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-cyan-600" />
                  Performance plateforme
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Temps moyen de traitement</span>
                    <span className="text-sm font-medium text-green-600">2.3 jours</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Taux de satisfaction</span>
                    <span className="text-sm font-medium text-green-600">94%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Uptime serveur</span>
                    <span className="text-sm font-medium text-green-600">99.8%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Réponse support</span>
                    <span className="text-sm font-medium text-blue-600">1.2h</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Graphique temporel des activités */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                Activité récente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-4">Inscriptions</h4>
                    <div className="space-y-2">
                      {monthlyGrowth.map((month, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{month.month}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${(month.users / 195) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-8 text-right">{month.users}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-4">Biens ajoutés</h4>
                    <div className="space-y-2">
                      {monthlyGrowth.map((month, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{month.month}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-purple-500 h-2 rounded-full"
                                style={{ width: `${(month.properties / 73) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-8 text-right">{month.properties}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-4">Baux signés</h4>
                    <div className="space-y-2">
                      {monthlyGrowth.map((month, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{month.month}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-orange-500 h-2 rounded-full"
                                style={{ width: `${(month.leases / 56) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-8 text-right">{month.leases}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation par sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminSections.map((section, index) => {
            const SectionIcon = section.icon;
            return (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <SectionIcon className="h-5 w-5 text-gray-600" />
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {section.items.map((item, itemIndex) => {
                      const ItemIcon = item.icon;
                      return (
                        <Button
                          key={itemIndex}
                          variant="ghost"
                          className="w-full justify-start h-auto p-3"
                          onClick={() => window.location.href = item.path}
                        >
                          <ItemIcon className="h-4 w-4 mr-3" />
                          <span className="text-sm">{item.name}</span>
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminDashboard;
