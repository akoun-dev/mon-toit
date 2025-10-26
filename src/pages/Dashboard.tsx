import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { DynamicBreadcrumb } from '@/components/navigation/DynamicBreadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, Building2, Users, BarChart3, Plus, Settings, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RecommendationsCarousel } from '@/components/recommendations/RecommendationsCarousel';
import { PreferencesModal } from '@/components/recommendations/PreferencesModal';
import SearchHistory from '@/components/dashboard/SearchHistory';
import SmartReminders from '@/components/dashboard/SmartReminders';
import { ProfileScoreCardCompact } from '@/components/dashboard/ProfileScoreCardCompact';
import { ActivityTimeline } from '@/components/dashboard/ActivityTimeline';
import { ApplicationsOverviewCompact } from '@/components/dashboard/ApplicationsOverviewCompact';
import { MarketInsightsWidget } from '@/components/dashboard/MarketInsightsWidget';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { StickyHeader } from '@/components/ui/sticky-header';
import { WelcomeBanner } from '@/components/dashboard/WelcomeBanner';
import React from "react";

const Dashboard = () => {
  const { profile, loading, user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  // Redirection intelligente pour les agences et tiers de confiance
  useEffect(() => {
    if (!loading) {
      // Redirections prioritaires selon rôles/typages
      if (hasRole?.('admin') || hasRole?.('super_admin')) {
        navigate('/admin');
        return;
      }
      if (profile?.user_type === 'agence') {
        navigate('/dashboard/agence');
        return;
      }
      if (profile?.user_type === 'tiers_de_confiance') {
        navigate('/tiers-dashboard');
        return;
      }
    }
  }, [profile?.user_type, loading, navigate, hasRole]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/auth" replace />;
  }

  const dashboardContent = {
    locataire: {
      title: 'Tableau de bord Locataire',
      cards: [
        { title: 'Mes Candidatures', icon: Home, description: 'Suivez vos candidatures', link: '/candidatures' },
        { title: 'Mes Baux', icon: Building2, description: 'Consulter mes baux', link: '/baux' },
        { title: 'Mes Favoris', icon: Building2, description: 'Biens sauvegardés', link: '/favoris' },
      ],
    },
    proprietaire: {
      title: 'Tableau de bord Propriétaire',
      cards: [
        { title: 'Mes Biens', icon: Building2, description: 'Gérer mes propriétés', link: '/mes-biens' },
        { title: 'Candidatures Reçues', icon: Users, description: 'Gérer les candidatures', link: '/candidatures' },
        { title: 'Statistiques', icon: BarChart3, description: 'Performance de vos biens', link: '/stats' },
      ],
    },
    agence: {
      title: 'Tableau de bord',
      cards: [
        { title: 'Portfolio', icon: Building2, description: 'Tous les biens', link: '/portfolio' },
        { title: 'Équipe', icon: Users, description: 'Gestion de l\'équipe', link: '/equipe' },
        { title: 'Statistiques', icon: BarChart3, description: 'Performance globale', link: '/stats' },
      ],
    },
    admin_ansut: {
      title: 'Tableau de bord Admin ANSUT',
      cards: [
        { title: 'Utilisateurs', icon: Users, description: 'Gestion des utilisateurs', link: '/admin/users' },
        { title: 'Propriétés', icon: Building2, description: 'Toutes les propriétés', link: '/admin/properties' },
        { title: 'Rapports', icon: BarChart3, description: 'Statistiques globales', link: '/admin/reports' },
      ],
    },
    tiers_de_confiance: {
      title: 'Tableau de bord Tiers de Confiance',
      cards: [
        { title: 'Vérifications', icon: Settings, description: 'Demandes en attente', link: '/tiers-verifications' },
        { title: 'Documents', icon: Building2, description: 'Documents à valider', link: '/tiers-documents' },
        { title: 'Rapports', icon: BarChart3, description: 'Rapports de conformité', link: '/tiers-rapports' },
      ],
    },
  };

  // Vérifier si le profil existe avant d'accéder à ses propriétés
  if (!profile) {
    return (
      <MainLayout>
        <main className="px-4 md:px-6 py-3 w-full">
          <div className="w-full space-y-4">
            <DynamicBreadcrumb />

            <Card>
              <CardHeader>
                <CardTitle>Profil en cours de configuration</CardTitle>
                <CardDescription>
                  Veuillez vérifier votre email pour finaliser votre inscription.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Un code de vérification a été envoyé à votre adresse email.<br/>
                    Veuillez vérifier votre boîte de réception (y compris les spams) et utiliser le code pour finaliser votre inscription.
                  </p>
                  <Button onClick={() => navigate('/auth')}>
                    Retour à la connexion
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </MainLayout>
    );
  }

  const content = dashboardContent[profile.user_type];

  // Fallback content for unhandled user types
  if (!content) {
    return (
      <MainLayout>
        <main className="px-4 md:px-6 py-3 w-full">
          <div className="w-full space-y-4">
            <DynamicBreadcrumb />

            <WelcomeBanner />

            <Card>
              <CardHeader>
                <CardTitle>Tableau de bord</CardTitle>
                <CardDescription>
                  Bienvenue, {profile.full_name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Votre type d'utilisateur ({profile.user_type}) n'a pas de tableau de bord personnalisé.
                  Veuillez contacter l'administrateur pour configurer votre accès.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <main className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 md:py-4 w-full max-w-screen-2xl mx-auto">
        <div className="w-full space-y-2 sm:space-y-3 md:space-y-4">
          <DynamicBreadcrumb />

          <WelcomeBanner />

          {/* Header */}
          <StickyHeader>
            <div className="flex flex-col gap-2 sm:gap-3 w-full">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <div>
                  <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">{content.title}</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">Bienvenue, {profile.full_name}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {profile.user_type === 'locataire' && (
                    <Button variant="outline" size="sm" onClick={() => setPreferencesOpen(true)} className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3">
                      <Settings className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Préférences</span>
                      <span className="sm:hidden">⚙️</span>
                    </Button>
                  )}
                  {profile.user_type === 'proprietaire' && (
                    <Button asChild size="sm" className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3">
                      <Link to="/publier">
                        <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden xs:inline">Ajouter un bien</span>
                        <span className="xs:hidden">+</span>
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </StickyHeader>

          {/* Tenant Dashboard - Fully Responsive Layout */}
          {user && profile.user_type === 'locataire' && (
            <div className="space-y-3 sm:space-y-4">
              {/* Top Section - Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                <div className="sm:col-span-2 lg:col-span-1">
                  <ProfileScoreCardCompact />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <ApplicationsOverviewCompact />
                </div>
              </div>

              {/* Smart Reminders */}
              <CollapsibleSection
                title="Rappels intelligents"
                defaultOpen={false}
                storageKey="dashboard-reminders"
              >
                <SmartReminders />
              </CollapsibleSection>

              {/* Market Insights and Activity Timeline */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                <div className="h-auto lg:h-[280px]">
                  <MarketInsightsWidget className="h-full" />
                </div>
                <div className="h-auto lg:h-[280px]">
                  <ActivityTimeline className="h-full overflow-auto" />
                </div>
              </div>

              {/* Recommendations Carousel */}

              {/* Search History */}
              <CollapsibleSection
                title="Historique de recherches"
                defaultOpen={false}
                storageKey="dashboard-search-history"
              >
                <SearchHistory />
              </CollapsibleSection>
            </div>
          )}

          {user && profile.user_type === 'proprietaire' && (
            <div className="space-y-3 sm:space-y-4">
              {/* Owner Dashboard Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                <Card>
                  <CardHeader className="pb-2 xs:pb-3">
                    <div className="flex items-center gap-1 xs:gap-2">
                      <Users className="h-4 w-4 xs:h-5 xs:w-5 text-primary" />
                      <CardTitle className="text-base xs:text-lg sm:text-xl">Locataires recommandés</CardTitle>
                    </div>
                    <CardDescription className="text-xs xs:text-sm">
                      Consultez vos candidatures pour voir les locataires les mieux notés
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full sm:w-auto h-8 xs:h-9 sm:h-10 text-xs xs:text-sm">
                      <Link to="/mes-biens" className="text-xs xs:text-sm">
                        <span className="hidden xs:inline">Voir mes biens et candidatures</span>
                        <span className="xs:hidden">Mes biens</span>
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2 xs:pb-3">
                    <div className="flex items-center gap-1 xs:gap-2">
                      <Building2 className="h-4 w-4 xs:h-5 xs:w-5 text-primary" />
                      <CardTitle className="text-base xs:text-lg sm:text-xl">Mes Mandats</CardTitle>
                    </div>
                    <CardDescription className="text-xs xs:text-sm">
                      Gérez vos mandats avec les agences immobilières
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full sm:w-auto h-8 xs:h-9 sm:h-10 text-xs xs:text-sm">
                      <Link to="/my-mandates" className="text-xs xs:text-sm">
                        <span className="hidden xs:inline">Voir mes mandats</span>
                        <span className="xs:hidden">Mandats</span>
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Stats for Owners */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 xs:gap-3">
                <Card className="text-center p-2 xs:p-3 sm:p-4">
                  <div className="text-lg xs:text-xl sm:text-2xl font-bold text-blue-600">0</div>
                  <div className="text-xs text-muted-foreground">Biens</div>
                </Card>
                <Card className="text-center p-2 xs:p-3 sm:p-4">
                  <div className="text-lg xs:text-xl sm:text-2xl font-bold text-green-600">0</div>
                  <div className="text-xs text-muted-foreground">Candidatures</div>
                </Card>
                <Card className="text-center p-2 xs:p-3 sm:p-4">
                  <div className="text-lg xs:text-xl sm:text-2xl font-bold text-orange-600">0</div>
                  <div className="text-xs text-muted-foreground">Locataires</div>
                </Card>
                <Card className="text-center p-2 xs:p-3 sm:p-4">
                  <div className="text-lg xs:text-xl sm:text-2xl font-bold text-purple-600">0%</div>
                  <div className="text-xs text-muted-foreground">Occupation</div>
                </Card>
              </div>
            </div>
          )}

        </div>
      </main>

      <PreferencesModal open={preferencesOpen} onOpenChange={setPreferencesOpen} />
    </MainLayout>
  );
};

export default Dashboard;
