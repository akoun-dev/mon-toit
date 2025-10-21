import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { AgencyMandate } from '@/types/admin';
import { useQuery } from '@tanstack/react-query';

import { useDocumentHead } from '@/hooks/useDocumentHead';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Heart, MapPin, Bed, Bath, Maximize, Home, CheckCircle2, 
  ArrowLeft, MessageCircle, Calendar, DollarSign, Edit, Users,
  Eye, Star, FileText, TrendingUp, Clock, Lock, ExternalLink, Building2, Info
} from 'lucide-react';
import { getPropertyStatusLabel } from '@/constants';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from '@/hooks/use-toast';
import { RecommendationsSection } from '@/components/recommendations/RecommendationsSection';
import { MediaGallery } from '@/components/property/MediaGallery';
import { LocationSection } from '@/components/property/LocationSection';
import { VerificationGuard } from '@/components/application/VerificationGuard';
import { GuestContactForm } from '@/components/messaging/GuestContactForm';
import { TitleDeedSection } from '@/components/property/TitleDeedSection';
import { WorkStatusSection } from '@/components/property/WorkStatusSection';
import { logger } from '@/services/logger';
import { sanitizePropertyDescription, sanitizeText } from '@/lib/sanitize';
import type { Property, Application, PropertyStats } from '@/types';

interface PropertyOwner {
  id: string;
  full_name: string;
  user_type: string;
  phone: string | null;
}

interface ApplicationDisplay extends Application {
  profiles: {
    full_name: string;
    phone: string | null;
  };
  user_verifications: {
    tenant_score: number | null;
    oneci_status: string;
    cnam_status: string;
  }[];
}

const PropertyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canAccessAdminDashboard } = usePermissions();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [property, setProperty] = useState<Property | null>(null);
  const [owner, setOwner] = useState<PropertyOwner | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [applications, setApplications] = useState<ApplicationDisplay[]>([]);
  const [stats, setStats] = useState<PropertyStats | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [agencyMandate, setAgencyMandate] = useState<AgencyMandate | null>(null);

  const isOwner = user?.id === property?.owner_id;

  // Set document head with meta tags - MUST be called before any conditional returns
  useDocumentHead({
    title: property ? `${property.title} - ${property.city} | Mon Toit` : 'Bien Immobilier | Mon Toit',
    description: property?.description?.substring(0, 155) || `${property?.property_type || 'Bien'} à ${property?.city || 'Abidjan'} - ${property?.monthly_rent ? property.monthly_rent.toLocaleString('fr-FR') + ' FCFA/mois' : 'Prix sur demande'}`,
    ogTitle: property ? `${property.title} - ${property.city}` : 'Bien Immobilier',
    ogDescription: property?.description?.substring(0, 200),
    ogImage: property?.main_image || property?.images?.[0] || 'https://mon-toit.lovable.app/placeholder.svg',
    ogUrl: property ? `https://mon-toit.lovable.app/properties/${property.id}` : 'https://mon-toit.lovable.app',
    twitterCard: 'summary_large_image'
  });

  useEffect(() => {
    if (id) {
      fetchPropertyDetails();
      fetchAgencyMandate();
      if (isOwner) {
        fetchApplications();
        fetchStats();
      }
    }
  }, [id, isOwner]);

  const fetchAgencyMandate = async () => {
    if (!id) return;
    
    const { data } = await supabase
      .from('agency_mandates')
      .select('*, profiles!agency_mandates_agency_id_fkey(full_name, phone)')
      .eq('property_id', id)
      .eq('status', 'active')
      .maybeSingle();
    
    setAgencyMandate(data);
  };

  const fetchPropertyDetails = async () => {
    // Validate UUID before query
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!id || !uuidRegex.test(id)) {
      setLoading(false);
      return; // Show "Bien introuvable"
    }

    try {
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .maybeSingle(); // Use maybeSingle() instead of single()

      if (propertyError) throw propertyError;
      
      if (!propertyData) {
        // Property doesn't exist (deleted or never existed)
        setLoading(false);
        return; // Just show "Bien introuvable", no toast
      }

      // Vérifier si bien loué ET utilisateur n'est pas le propriétaire
      if (
        propertyData.status === 'loué' && 
        propertyData.owner_id !== user?.id &&
        !canAccessAdminDashboard
      ) {
        toast({
          title: "Bien non disponible",
          description: "Ce bien n'est plus disponible à la location.",
          variant: "destructive"
        });
        navigate('/explorer');
        return;
      }

      setProperty(propertyData);
      setSelectedImage(propertyData.main_image);

      // Fetch owner details
      const { data: ownerData, error: ownerError } = await supabase
        .from('profiles')
        .select('id, full_name, user_type, phone')
        .eq('id', propertyData.owner_id)
        .maybeSingle(); // Also maybeSingle() here

      if (ownerError) throw ownerError;
      
      if (ownerData) {
        setOwner(ownerData);
      }
    } catch (error) {
      // Toast error ONLY for technical errors
      logger.error('Error fetching property details', { error, propertyId: id });
      toast({
        title: "Erreur technique",
        description: "Impossible de charger les détails du bien. Veuillez réessayer plus tard.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('rental_applications')
        .select(`
          id,
          applicant_id,
          status,
          created_at,
          application_score,
          profiles:applicant_id(full_name, phone)
        `)
        .eq('property_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch user verifications separately
      if (data) {
        const applicationsWithVerifications = await Promise.all(
          data.map(async (app: any) => {
            const { data: verificationData } = await supabase
              .from('user_verifications')
              .select('tenant_score, oneci_status, cnam_status')
              .eq('user_id', app.applicant_id)
              .single();

            return {
              ...app,
              user_verifications: verificationData ? [verificationData] : [],
            };
          })
        );
        setApplications(applicationsWithVerifications as ApplicationDisplay[]);
      }
    } catch (error) {
      logger.error('Error fetching applications', { error, propertyId: id });
    }
  };

  const fetchStats = async () => {
    try {
      // Get favorites count
      const { count: favCount } = await supabase
        .from('user_favorites')
        .select('*', { count: 'exact', head: true })
        .eq('property_id', id);

      // Get applications count
      const { count: appCount } = await supabase
        .from('rental_applications')
        .select('*', { count: 'exact', head: true })
        .eq('property_id', id);

      // Get property view count
      const { data: propertyData } = await supabase
        .from('properties')
        .select('view_count')
        .eq('id', id)
        .single();

      setStats({
        views: propertyData?.view_count || 0,
        favorites: favCount || 0,
        applications: appCount || 0,
        conversionRate: 0,
        view_count: propertyData?.view_count || 0,
        favorites_count: favCount || 0,
        applications_count: appCount || 0,
      });
    } catch (error) {
      logger.error('Error fetching property stats', { error, propertyId: id });
    }
  };

  const handleStatusChange = async () => {
    if (!newStatus || !property) return;

    try {
      const { error } = await supabase
        .from('properties')
        .update({ status: newStatus })
        .eq('id', property.id);

      if (error) throw error;

      setProperty({ ...property, status: newStatus });
      setStatusDialogOpen(false);
      toast({
        title: 'Succès',
        description: 'Statut mis à jour avec succès',
      });
    } catch (error) {
      logger.error('Error updating property status', { error, propertyId: property.id, newStatus });
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la mise à jour du statut',
        variant: 'destructive',
      });
    }
  };

  const handleContact = () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour contacter le propriétaire",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }
    // Navigate to messaging with owner
    navigate(`/messages?recipient=${property?.owner_id}`);
  };

  const handleApply = () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour postuler",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }
    navigate(`/application/${property?.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Bien introuvable</h1>
          <Button asChild>
            <Link to="/explorer">Retour à la recherche</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  const allImages = [
    property.main_image,
    ...(property.images || [])
  ].filter(Boolean) as string[];

  const favorite = isFavorite(property.id);

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 lg:py-12">
          <div className="max-w-8xl mx-auto">
            {/* Navigation supérieure avec breadcrumb */}
            <nav className="flex items-center justify-between mb-6 md:mb-8">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground transition-colors" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <span>Explorer</span>
                <span>/</span>
                <span className="text-foreground">{property.city}</span>
                <span>/</span>
                <span className="text-foreground font-medium">{property.property_type}</span>
              </div>
            </nav>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 lg:gap-8 xl:gap-12">
              {/* Contenu principal - colonne large */}
              <div className="xl:col-span-3 space-y-6 lg:space-y-8">
                {/* Galerie multimédia avec statut */}
                <div className="relative group">
                  <MediaGallery
                    propertyId={property.id}
                    images={allImages}
                    videoUrl={property.video_url || undefined}
                    virtualTourUrl={property.virtual_tour_url || undefined}
                    panoramicImages={Array.isArray(property.panoramic_images) ? property.panoramic_images : []}
                    floorPlans={Array.isArray(property.floor_plans) ? property.floor_plans : []}
                  />

                  {/* Badges flottants optimisés */}
                  <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                    <Badge
                      className={cn(
                        "shadow-lg backdrop-blur-sm transition-all duration-300",
                        property.status === 'disponible'
                          ? 'bg-emerald-500/90 hover:bg-emerald-600/90 text-white border-0'
                          : property.status === 'en_negociation'
                          ? 'bg-amber-500/90 hover:bg-amber-600/90 text-white border-0'
                          : 'bg-slate-500/90 hover:bg-slate-600/90 text-white border-0'
                      )}
                    >
                      {property.status === 'en_negociation' && <Clock className="h-3 w-3 mr-1" />}
                      {property.status === 'loué' && <Lock className="h-3 w-3 mr-1" />}
                      {getPropertyStatusLabel(property.status)}
                    </Badge>

                    {property.is_new && (
                      <Badge variant="secondary" className="bg-blue-500/90 text-white border-0 shadow-lg backdrop-blur-sm">
                        Nouveau
                      </Badge>
                    )}
                  </div>

                  {/* Bouton favori amélioré */}
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white text-foreground shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105"
                    onClick={() => toggleFavorite(property.id)}
                  >
                    <Heart className={cn("h-5 w-5 transition-colors", favorite ? 'fill-current text-red-500' : '')} />
                  </Button>
                </div>

                {/* En-tête du bien avec typographie améliorée */}
                <div className="space-y-4 bg-white rounded-2xl p-6 lg:p-8 shadow-sm border-0">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    <div className="flex-1 space-y-3">
                      <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight text-foreground tracking-tight">
                        {property.title}
                      </h1>
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="font-medium">{property.city}</span>
                        </div>
                        <span className="hidden sm:inline">•</span>
                        <span className="text-sm">
                          {property.property_type}
                          {property.surface_area && ` • ${property.surface_area} m²`}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl lg:text-4xl font-bold text-primary">
                            {property.monthly_rent ? property.monthly_rent.toLocaleString('fr-FR') : 'N/A'}
                          </span>
                          <span className="text-sm text-muted-foreground font-medium">FCFA/mois</span>
                        </div>
                        {property.deposit_amount && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Caution: {property.deposit_amount.toLocaleString('fr-FR')} FCFA
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Informations agence - design amélioré */}
                {agencyMandate && (
                  <Alert className="border-2 border-blue-200 bg-blue-50/50 rounded-xl">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <AlertTitle className="text-blue-900">Géré par une agence immobilière</AlertTitle>
                    <AlertDescription className="text-blue-800">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-3">
                        <div className="space-y-2">
                          <p>Ce bien est professionnellement géré par une agence partenaire</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                              {agencyMandate.mandate_type === 'location' ? 'Location' :
                               agencyMandate.mandate_type === 'gestion_complete' ? 'Gestion complète' : 'Vente'}
                            </Badge>
                            {agencyMandate.commission_rate && (
                              <Badge variant="outline" className="border-blue-200 text-blue-700">
                                Commission: {agencyMandate.commission_rate}%
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Description - design moderne */}
                <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30 pb-6">
                    <CardTitle className="text-2xl font-semibold flex items-center gap-3">
                      <div className="w-1 h-6 bg-primary rounded-full"></div>
                      Description
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div
                      className="prose prose-gray max-w-none text-foreground leading-relaxed text-base lg:text-lg"
                      dangerouslySetInnerHTML={{
                        __html: sanitizePropertyDescription(property.description) ||
                          '<p class="text-muted-foreground">Aucune description disponible pour ce bien.</p>'
                      }}
                    />
                  </CardContent>
                </Card>

                {/* Caractéristiques - design moderne */}
                <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30 pb-6">
                    <CardTitle className="text-2xl font-semibold flex items-center gap-3">
                      <div className="w-1 h-6 bg-primary rounded-full"></div>
                      Caractéristiques principales
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 p-6">
                      {/* Caractéristiques principales */}
                      <div className="space-y-6">
                        <div className="group hover:bg-muted/30 p-4 rounded-xl transition-all duration-300">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                              <Home className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Type</p>
                              <p className="text-lg font-semibold text-foreground">{property.property_type}</p>
                            </div>
                          </div>
                        </div>

                        <div className="group hover:bg-muted/30 p-4 rounded-xl transition-all duration-300">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                              <Maximize className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Surface</p>
                              <p className="text-lg font-semibold text-foreground">{property.surface_area || 'N/A'} m²</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="group hover:bg-muted/30 p-4 rounded-xl transition-all duration-300">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                              <Bed className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Chambres</p>
                              <p className="text-lg font-semibold text-foreground">
                                {property.bedrooms === 0
                                  ? 'Studio'
                                  : `${property.bedrooms} ${property.bedrooms === 1 ? 'chambre' : 'chambres'}`
                                }
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="group hover:bg-muted/30 p-4 rounded-xl transition-all duration-300">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                              <Bath className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Salles de bain</p>
                              <p className="text-lg font-semibold text-foreground">
                                {property.bathrooms} {property.bathrooms === 1 ? 'salle' : 'salles'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Équipements */}
                    <div className="border-t border-muted/30 p-6">
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Équipements et services</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {property.is_furnished && (
                          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">Meublé</span>
                          </div>
                        )}
                        {property.has_ac && (
                          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <CheckCircle2 className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">Climatisation</span>
                          </div>
                        )}
                        {property.has_parking && (
                          <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                            <CheckCircle2 className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-medium text-purple-800">Parking</span>
                          </div>
                        )}
                        {property.has_garden && (
                          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            <span className="text-sm font-medium text-emerald-800">Jardin</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                  {/* Localisation - design moderne */}
                {property.latitude && property.longitude && (
                  <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30 pb-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <CardTitle className="text-2xl font-semibold flex items-center gap-3">
                          <div className="w-1 h-6 bg-primary rounded-full"></div>
                          <MapPin className="h-6 w-6 text-primary" />
                          Localisation
                        </CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                        >
                          <a
                            href={`https://maps.google.com/?q=${property.latitude},${property.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="gap-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Google Maps
                          </a>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <LocationSection
                        propertyId={property.id}
                        latitude={property.latitude}
                        longitude={property.longitude}
                        city={property.city}
                        address={property.address}
                      />
                    </CardContent>
                  </Card>
                )}

              {/* Work Status Section */}
              <WorkStatusSection
                workStatus={property.work_status || 'aucun_travail'}
                workDescription={property.work_description}
                workImages={Array.isArray(property.work_images) ? property.work_images : []}
                workEstimatedCost={property.work_estimated_cost}
                workEstimatedDuration={property.work_estimated_duration}
                workStartDate={property.work_start_date}
              />

              {/* Title Deed Section */}
              <TitleDeedSection 
                propertyId={property.id}
                titleDeedUrl={property.title_deed_url}
                ownerId={property.owner_id}
              />
            </div>

            {/* Sidebar optimisée */}
            <div className="space-y-6">
              {/* Carte de prix et actions principales */}
              <Card className="sticky top-6 border-0 shadow-xl bg-gradient-to-br from-white to-muted/30 backdrop-blur-sm rounded-2xl overflow-hidden">
                <CardContent className="p-0">
                  {/* Header prix */}
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b border-primary/10">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-3xl lg:text-4xl font-bold text-primary">
                        {property.monthly_rent ? property.monthly_rent.toLocaleString('fr-FR') : 'N/A'}
                      </span>
                      <span className="text-sm text-muted-foreground font-medium">FCFA/mois</span>
                    </div>
                    {property.deposit_amount && (
                      <p className="text-sm text-muted-foreground">
                        Caution: {property.deposit_amount.toLocaleString('fr-FR')} FCFA
                      </p>
                    )}
                  </div>

                  {/* Actions principales */}
                  <div className="p-6 space-y-4">
                    {!isOwner && !user && property.status === 'disponible' && (
                      <div className="space-y-4">
                        <Button asChild size="lg" className="w-full gap-3 h-14 text-base font-semibold bg-primary hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl">
                          <Link to="/auth">
                            <Users className="h-5 w-5" />
                            Créer un compte pour postuler
                          </Link>
                        </Button>
                        <p className="text-sm text-center text-muted-foreground">
                          Inscription gratuite en 2 minutes
                        </p>
                      </div>
                    )}

                    {!isOwner && user && (
                      <div className="space-y-3">
                        <Button
                          className="w-full gap-3 h-13 text-base font-medium bg-primary hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl"
                          onClick={handleContact}
                        >
                          <MessageCircle className="h-5 w-5" />
                          Contacter le propriétaire
                        </Button>
                        {property.status === 'disponible' && (
                          <VerificationGuard propertyId={property.id}>
                            <Button
                              variant="outline"
                              className="w-full gap-3 h-13 text-base font-medium border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                            >
                              <Calendar className="h-5 w-5" />
                              Postuler
                            </Button>
                          </VerificationGuard>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Actions propriétaire */}
              {isOwner && (
                <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30">
                    <CardTitle className="text-lg font-semibold flex items-center gap-3">
                      <div className="w-1 h-5 bg-primary rounded-full"></div>
                      Actions propriétaire
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-3">
                    <Button
                      variant="outline"
                      className="w-full gap-3 h-12 hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                      onClick={() => navigate(`/biens/${property.id}/modifier`)}
                    >
                      <Edit className="h-4 w-4" />
                      Modifier ce bien
                    </Button>

                    <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full gap-3 h-12 hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                          <TrendingUp className="h-4 w-4" />
                          Changer le statut
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Changer le statut du bien</DialogTitle>
                          <DialogDescription>
                            Sélectionnez le nouveau statut pour ce bien
                          </DialogDescription>
                        </DialogHeader>
                        <Select value={newStatus} onValueChange={setNewStatus}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un statut" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="disponible">Disponible</SelectItem>
                            <SelectItem value="loué">Loué</SelectItem>
                            <SelectItem value="retiré">Retiré</SelectItem>
                          </SelectContent>
                        </Select>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
                            Annuler
                          </Button>
                          <Button onClick={handleStatusChange}>
                            Confirmer
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              )}

              {/* Statistiques propriétaire */}
              {isOwner && stats && (
                <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30">
                    <CardTitle className="text-lg font-semibold flex items-center gap-3">
                      <div className="w-1 h-5 bg-primary rounded-full"></div>
                      Statistiques du bien
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                        <div className="flex items-center gap-3">
                          <Eye className="h-5 w-5 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">Vues</span>
                        </div>
                        <span className="text-lg font-bold text-blue-900">{stats.view_count}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-purple-50/50 rounded-lg border border-purple-100">
                        <div className="flex items-center gap-3">
                          <Star className="h-5 w-5 text-purple-600" />
                          <span className="text-sm font-medium text-purple-900">Favoris</span>
                        </div>
                        <span className="text-lg font-bold text-purple-900">{stats.favorites_count}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50/50 rounded-lg border border-green-100">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-green-600" />
                          <span className="text-sm font-medium text-green-900">Candidatures</span>
                        </div>
                        <span className="text-lg font-bold text-green-900">{stats.applications_count}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

                    {/* Carte propriétaire */}
              {owner && !isOwner && (
                <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30">
                    <CardTitle className="text-lg font-semibold flex items-center gap-3">
                      <div className="w-1 h-5 bg-primary rounded-full"></div>
                      Propriétaire
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-14 w-14 border-2 border-primary/20">
                          <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-lg">
                            {owner.full_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{sanitizeText(owner.full_name)}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {sanitizeText(owner.user_type)}
                        </p>
                        <div className="flex items-center gap-1 mt-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-green-600 font-medium">Disponible</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Formulaire de contact invité */}
              {!isOwner && !user && property.status === 'disponible' && owner && (
                <GuestContactForm
                  propertyId={property.id}
                  ownerId={owner.id}
                  propertyTitle={property.title}
                />
              )}

              {/* Informations de publication */}
              <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm rounded-2xl overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Publié le {new Date(property.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

            {/* Section des biens similaires - design moderne */}
          {!isOwner && user && (
            <div className="mt-12 lg:mt-16">
              <div className="max-w-8xl mx-auto">
                <div className="text-center mb-8 lg:mb-12">
                  <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                    Découvrez des biens <span className="text-gradient-primary">similaires</span>
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Explorez d'autres propriétés qui pourraient vous intéresser dans la même zone
                  </p>
                </div>
                <RecommendationsSection
                  userId={user.id}
                  type="properties"
                  limit={4}
                  title=""
                />
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default PropertyDetail;
