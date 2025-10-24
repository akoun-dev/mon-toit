import { BarChart3, Users, Home, TrendingUp, TrendingDown, Eye, Clock, DollarSign, Activity, Download, Filter, Calendar, RefreshCw, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import adminDashboardService from '@/services/admin/AdminDashboardService';

const AdminAnalyticsPage = () => {
  // State pour les statistiques et chargement
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les données du dashboard au montage
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data, error } = await adminDashboardService.getDashboardStats();

        if (error) {
          console.error('Erreur dashboard analytics:', error);
          setError(error.message || 'Erreur de chargement');
        } else if (data) {
          setDashboardStats(data);
        }
      } catch (err) {
        console.error('Exception dashboard analytics:', err);
        setError('Erreur technique lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []); // Seulement au montage

  // Données mockées de secours si les vraies données ne chargent pas
  const analyticsStats = dashboardStats || {
    total_users: 12478,
    verified_users: 8923,
    total_properties: 4567,
    available_properties: 3892,
    active_leases: 0,
    pending_certifications: 0,
    open_disputes: 0,
    unread_alerts: 0,
    monthly_revenue: 0,
    certification_requests_today: 0,
    disputes_opened_today: 0,
  };

  // Formater les nombres pour l'affichage
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  // Afficher le spinner de chargement
  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium text-gray-600">Chargement des statistiques...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord Analytics</h1>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4" />
              Filtres
            </Button>
            <Button size="sm" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4" />
              {loading ? 'Actualisation...' : 'Actualiser'}
            </Button>
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            <strong>Erreur:</strong> {error}
          </div>
        )}

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Total Utilisateurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatNumber(analyticsStats.total_users || 0)}</div>
              <CardDescription className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span>Vérifiés: {formatNumber(analyticsStats.verified_users || 0)}</span>
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5 text-purple-600" />
                Total Propriétés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{formatNumber(analyticsStats.total_properties || 0)}</div>
              <CardDescription className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span>Disponibles: {formatNumber(analyticsStats.available_properties || 0)}</span>
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                Baux Actifs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatNumber(analyticsStats.active_leases || 0)}</div>
              <CardDescription className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-green-500" />
                <span>Revenu mensuel: {formatNumber(analyticsStats.monthly_revenue || 0)} FCFA</span>
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                Certifications en Attente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{formatNumber(analyticsStats.pending_certifications || 0)}</div>
              <CardDescription className="flex items-center gap-1">
                <ArrowUp className="h-4 w-4 text-blue-500" />
                <span>Aujourd'hui: {formatNumber(analyticsStats.certification_requests_today || 0)}</span>
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Tendances mensuelles - simplifiées pour le moment */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Tendances Utilisateurs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Ce mois</span>
                  <span className="font-semibold">+523 utilisateurs</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total</span>
                  <span className="font-semibold">12,478 utilisateurs</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activité Récente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">Admin</Badge>
                  <span className="text-sm">Nouveau bien ajouté</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Système</Badge>
                  <span className="text-sm">Sauvegarde automatique</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};