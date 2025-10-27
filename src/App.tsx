import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { useEffect, useState, useRef, lazy, Suspense } from "react";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";

// Debug: Afficher les variables d'environnement au démarrage
console.log('🔍 [DEBUG] Variables d\'environnement:', {
  VITE_MAILPIT_URL: import.meta.env.VITE_MAILPIT_URL,
  DEV: import.meta.env.DEV,
  MODE: import.meta.env.MODE,
  NODE_ENV: import.meta.env.NODE_ENV,
  allKeys: Object.keys(import.meta.env).filter(k => k.startsWith('VITE_'))
});
import ErrorBoundary from "@/components/ui/error-boundary";
import { initializeSentry } from "@/lib/sentry-enhanced";
import { SUTAChatbot } from "@/components/SUTAChatbot";
import { usePrefetchRoutes } from "@/hooks/usePrefetchRoutes";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { PageSkeleton, PropertyDetailSkeleton } from "@/components/LoadingFallback";
import ContextBar from "@/components/ContextBar";
import { ScrollProgress } from "@/components/animations/ScrollProgress";
import { InstallPWA } from "@/components/pwa/InstallPWA";
import { SplashScreen } from "@/components/pwa/SplashScreen";
import { PageTransition } from "@/components/animations/PageTransition";

// Eager load critical pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";

// Lazy load heavy pages
const PropertyDetail = lazy(() => import("./pages/PropertyDetail"));
const Offline = lazy(() => import("./pages/Offline"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminCertifications = lazy(() => import("./pages/AdminCertifications"));
const OwnerDashboard = lazy(() => import("./pages/OwnerDashboard"));
const AdminUsersPage = lazy(() => import("./pages/AdminUsersPage"));
const AdminPropertiesPage = lazy(() => import("./pages/AdminPropertiesPage"));
const AdminVerificationsPage = lazy(() => import("./pages/AdminVerificationsPage"));
const AdminSettingsPage = lazy(() => import("./pages/AdminSettingsPage"));
const AdminProcessingPage = lazy(() => import("./pages/AdminProcessingPage"));
const AdminAnalyticsPage = lazy(() => import("./pages/AdminAnalyticsPage"));
const AdminAlertsPage = lazy(() => import("./pages/AdminAlertsPage"));
const AdminDisputesPage = lazy(() => import("./pages/AdminDisputesPage"));
const AdminModerationPage = lazy(() => import("./pages/AdminModerationPage"));
const AdminReportsPage = lazy(() => import("./pages/AdminReportsPage"));
const AdminSignaturesPage = lazy(() => import("./pages/AdminSignaturesPage"));
const AdminIllustrationsPage = lazy(() => import("./pages/AdminIllustrationsPage"));
const TenantDashboard = lazy(() => import("./pages/TenantDashboard"));
const AgencyDashboard = lazy(() => import("./pages/AgencyDashboard"));
const MyMandates = lazy(() => import("./pages/MyMandates"));
const MyProperties = lazy(() => import("./pages/MyProperties"));
const AddProperty = lazy(() => import("./pages/AddProperty"));
const EditProperty = lazy(() => import("./pages/EditProperty"));
const Messages = lazy(() => import("./pages/Messages"));
const Application = lazy(() => import("./pages/Application"));
const Applications = lazy(() => import("./pages/Applications"));
const Leases = lazy(() => import("./pages/Leases"));
const Payments = lazy(() => import("./pages/Payments"));
const Maintenance = lazy(() => import("./pages/Maintenance"));
const ScheduleVisit = lazy(() => import("./pages/ScheduleVisit"));
const Search = lazy(() => import("./pages/Search"));

// Load other pages normally
import Certification from "./pages/Certification";
import ResetPassword from "./pages/ResetPassword";
import AuthCallback from "./pages/AuthCallback";
import AuthConfirmation from "./pages/AuthConfirmation";
import Profile from "./pages/Profile";
import Favorites from "./pages/Favorites";
import PropertyApplications from "./pages/PropertyApplications";
import Verification from "./pages/Verification";
import { GuestMessagesInbox } from "@/components/owner/GuestMessagesInbox";
import NotFound from "./pages/NotFound";
import UserReviews from "./pages/UserReviews";
import Publier from "./pages/Publier";
import APropos from "./pages/APropos";
import Conditions from "./pages/Conditions";
import Confidentialite from "./pages/Confidentialite";
import MentionsLegales from "./pages/MentionsLegales";
import TiersDeConfianceDashboard from "./pages/TiersDeConfianceDashboard";
const TiersVerifications = lazy(() => import("./pages/tiers-verifications"));
const TiersDocuments = lazy(() => import("./pages/tiers-documents"));
const TiersRapports = lazy(() => import("./pages/tiers-rapports"));
import CertificationFAQ from "./pages/CertificationFAQ";
import Tarifs from "./pages/Tarifs";
import PopulateImages from "./pages/PopulateImages";
import TestCryptoNeo from "./pages/TestCryptoNeo";
import Guide from "./pages/Guide";
import Explorer from "./pages/Explorer";
import CommentCaMarche from "./pages/CommentCaMarche";
import HowItWorksPage from "./pages/HowItWorksPage";
import AboutPage from "./pages/AboutPage";
import SmartMap from "./pages/SmartMap";
import SmartMapV2 from "./pages/SmartMapV2";
import Aide from "./pages/Aide";
import Artisans from "./pages/Artisans";
import ProtectionDonnees from "./pages/ProtectionDonnees";
import Accessibilite from "./pages/Accessibilite";
import BecomeProprietaire from "./pages/BecomeProprietaire";

import MandatesHelp from "./pages/MandatesHelp";

// Initialiser Sentry au démarrage de l'application
initializeSentry();

const AppContent = () => {
  // ✅ Préchargement intelligent des routes
  usePrefetchRoutes();

  // ✅ Raccourcis clavier globaux (accessibilité)
  useKeyboardShortcuts();
  
  const location = useLocation();
  const prevLocation = useRef(location.pathname);
  const [direction, setDirection] = useState<'left' | 'right'>('right');

  useEffect(() => {
    const routes = ['/', '/explorer', '/favoris', '/messages', '/profil'];
    const currentIndex = routes.indexOf(location.pathname);
    const prevIndex = routes.indexOf(prevLocation.current);
    
    if (currentIndex !== -1 && prevIndex !== -1) {
      setDirection(currentIndex > prevIndex ? 'right' : 'left');
    }
    
    prevLocation.current = location.pathname;
  }, [location.pathname]);
  
  return (
    <>
      <SplashScreen />
      <ScrollProgress />
      <InstallPWA />
      {/* Skip link pour accessibilité */}
      <a href="#main-content" className="skip-to-main">
        Aller au contenu principal
      </a>
      
      <ContextBar />
      <SUTAChatbot />
      <main id="main-content" tabIndex={-1}>
        <PageTransition>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/offline" element={<Suspense fallback={<PageSkeleton />}><Offline /></Suspense>} />
            {/* Redirections pour les anciennes routes */}
            <Route path="/recherche" element={<Navigate to="/explorer" replace />} />
            <Route path="/ajouter-bien" element={<Navigate to="/publier" replace />} />
            <Route path="/modifier-bien/:id" element={<Navigate to="/biens/:id/modifier" replace />} />
            <Route path="/explorer" element={<Explorer />} />
            <Route path="/search" element={
              <Suspense fallback={<PageSkeleton />}>
                <Search />
              </Suspense>
            } />
            <Route path="/carte-intelligente" element={<SmartMapV2 />} />
            <Route path="/comment-ca-marche" element={<HowItWorksPage />} />
            <Route path="/a-propos" element={<AboutPage />} />
            <Route path="/property/:id" element={
              <Suspense fallback={<PropertyDetailSkeleton />}>
                <PropertyDetail />
              </Suspense>
            } />
            <Route path="/bien/:id" element={
              <Suspense fallback={<PropertyDetailSkeleton />}>
                <PropertyDetail />
              </Suspense>
            } />
            <Route path="/certification" element={<Certification />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/confirmation" element={<AuthConfirmation />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/guide" element={<Guide />} />
            <Route
              path="/profil" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageSkeleton />}>
                    <Dashboard />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
                  <Suspense fallback={<PageSkeleton />}>
                    <AdminDashboard />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            {/* Redirect legacy admin path used in sidebar */}
            <Route path="/dashboard/admin" element={<Navigate to="/admin" replace />} />
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
                  <Suspense fallback={<PageSkeleton />}>
                    <AdminUsersPage />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/properties" 
              element={
                <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
                  <Suspense fallback={<PageSkeleton />}>
                    <AdminPropertiesPage />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/verifications" 
              element={
                <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
                  <Suspense fallback={<PageSkeleton />}>
                    <AdminVerificationsPage />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/settings" 
              element={
                <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
                  <Suspense fallback={<PageSkeleton />}>
                    <AdminSettingsPage />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/processing" 
              element={
                <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
                  <Suspense fallback={<PageSkeleton />}>
                    <AdminProcessingPage />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/analytics" 
              element={
                <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
                  <Suspense fallback={<PageSkeleton />}>
                    <AdminAnalyticsPage />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/alerts" 
              element={
                <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
                  <Suspense fallback={<PageSkeleton />}>
                    <AdminAlertsPage />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/disputes" 
              element={
                <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
                  <Suspense fallback={<PageSkeleton />}>
                    <AdminDisputesPage />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/moderation" 
              element={
                <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
                  <Suspense fallback={<PageSkeleton />}>
                    <AdminModerationPage />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/reports" 
              element={
                <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
                  <Suspense fallback={<PageSkeleton />}>
                    <AdminReportsPage />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/signatures" 
              element={
                <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
                  <Suspense fallback={<PageSkeleton />}>
                    <AdminSignaturesPage />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/illustrations" 
              element={
                <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
                  <Suspense fallback={<PageSkeleton />}>
                    <AdminIllustrationsPage />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route
              path="/admin/certifications"
              element={
                <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
                  <Suspense fallback={<PageSkeleton />}>
                    <AdminCertifications />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/processing"
              element={
                <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
                  <Suspense fallback={<PageSkeleton />}>
                    <AdminProcessingPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
                  <Suspense fallback={<PageSkeleton />}>
                    <AdminAnalyticsPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/alerts"
              element={
                <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
                  <Suspense fallback={<PageSkeleton />}>
                    <AdminAlertsPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/disputes"
              element={
                <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
                  <Suspense fallback={<PageSkeleton />}>
                    <AdminDisputesPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/moderation"
              element={
                <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
                  <Suspense fallback={<PageSkeleton />}>
                    <AdminModerationPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/illustrations"
              element={
                <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
                  <Suspense fallback={<PageSkeleton />}>
                    <AdminIllustrationsPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics" 
              element={
                <ProtectedRoute allowedUserTypes={['proprietaire', 'agence']}>
                  <Suspense fallback={<PageSkeleton />}>
                    <OwnerDashboard />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/tenant" 
              element={
                <ProtectedRoute allowedUserTypes={['locataire']}>
                  <Suspense fallback={<PageSkeleton />}>
                    <TenantDashboard />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
          <Route
            path="/tiers-dashboard"
            element={
              <ProtectedRoute requiredRoles={['tiers_de_confiance']}>
                <TiersDeConfianceDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tiers-verifications"
            element={
              <ProtectedRoute requiredRoles={['tiers_de_confiance']}>
                <Suspense fallback={<PageSkeleton />}>
                  <TiersVerifications />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tiers-documents"
            element={
              <ProtectedRoute requiredRoles={['tiers_de_confiance']}>
                <Suspense fallback={<PageSkeleton />}>
                  <TiersDocuments />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tiers-rapports"
            element={
              <ProtectedRoute requiredRoles={['tiers_de_confiance']}>
                <Suspense fallback={<PageSkeleton />}>
                  <TiersRapports />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/agence" 
            element={
              <ProtectedRoute allowedUserTypes={['agence']}>
                <Suspense fallback={<PageSkeleton />}>
                  <AgencyDashboard />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/my-mandates" 
            element={
              <ProtectedRoute allowedUserTypes={['proprietaire', 'agence']}>
                <Suspense fallback={<PageSkeleton />}>
                  <MyMandates />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/mandates/help" 
            element={
              <ProtectedRoute allowedUserTypes={['proprietaire', 'agence']}>
                <MandatesHelp />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/owner/guest-messages" 
            element={
              <ProtectedRoute allowedUserTypes={['proprietaire', 'agence']}>
                <GuestMessagesInbox />
              </ProtectedRoute>
            } 
          />
            <Route
              path="/favoris" 
              element={
                <ProtectedRoute>
                  <Favorites />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/messages" 
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageSkeleton />}>
                    <Messages />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/mes-biens" 
              element={
                <ProtectedRoute allowedUserTypes={['proprietaire', 'agence']}>
                  <Suspense fallback={<PageSkeleton />}>
                    <MyProperties />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/publier" 
              element={
                <ProtectedRoute allowedUserTypes={['proprietaire', 'agence']}>
                  <Suspense fallback={<PageSkeleton />}>
                    <AddProperty />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/biens/:id/modifier" 
              element={
                <ProtectedRoute allowedUserTypes={['proprietaire', 'agence']}>
                  <Suspense fallback={<PageSkeleton />}>
                    <EditProperty />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/biens/:id/candidatures" 
              element={
                <ProtectedRoute allowedUserTypes={['proprietaire', 'agence']}>
                  <PropertyApplications />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/maintenance/:propertyId" 
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageSkeleton />}>
                    <Maintenance />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/application/:propertyId" 
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageSkeleton />}>
                    <Application />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/schedule-visit/:propertyId" 
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageSkeleton />}>
                    <ScheduleVisit />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/candidatures"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageSkeleton />}>
                    <Applications />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/baux" 
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageSkeleton />}>
                    <Leases />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/payments" 
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageSkeleton />}>
                    <Payments />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route
              path="/verification"
              element={
                <ProtectedRoute>
                  <Verification />
                </ProtectedRoute>
              }
            />
            <Route
              path="/devenir-proprietaire"
              element={
                <ProtectedRoute>
                  <BecomeProprietaire />
                </ProtectedRoute>
              }
            />
            <Route path="/user/:userId/reviews" element={<UserReviews />} />
            <Route path="/publier" element={<Publier />} />
            <Route path="/a-propos" element={<APropos />} />
            <Route path="/conditions" element={<Conditions />} />
            <Route path="/confidentialite" element={<Confidentialite />} />
            <Route path="/mentions-legales" element={<MentionsLegales />} />
            <Route path="/certification-faq" element={<CertificationFAQ />} />
            <Route path="/tarifs" element={<Tarifs />} />
            <Route path="/aide" element={<Aide />} />
            <Route path="/artisans" element={<Artisans />} />
            <Route path="/protection-donnees" element={<ProtectionDonnees />} />
            <Route path="/accessibilite" element={<Accessibilite />} />

            <Route
              path="/populate-images"
              element={
                <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
                  <PopulateImages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/test-cryptoneo"
              element={
                <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
                  <TestCryptoNeo />
                </ProtectedRoute>
              }
            />
                        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PageTransition>
      </main>

      {/* Badge de développement */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
                                      </div>
      )}
    </>
  );
};

const App = () => (
  <ErrorBoundary level="error">
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ErrorBoundary level="warning">
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
