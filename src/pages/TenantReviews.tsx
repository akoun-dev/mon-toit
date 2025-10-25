import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';
import { MainLayout } from '@/components/layout/MainLayout';
import { DynamicBreadcrumb } from '@/components/navigation/DynamicBreadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import {
  Star,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  MapPin,
  Home,
  User,
  Plus,
  Filter
} from 'lucide-react';

interface Review {
  id: string;
  property_id: string;
  reviewer_id: string;
  target_id: string;
  target_type: 'property' | 'landlord' | 'tenant' | 'agency';
  rating: number;
  title: string;
  content: string;
  aspects: {
    cleanliness: number;
    communication: number;
    location: number;
    value_for_money: number;
    amenities: number;
  };
  is_recommended: boolean;
  created_at: string;
  updated_at: string;
  properties?: {
    title: string;
    city: string;
    neighborhood: string;
  };
  reviewer_profile?: {
    full_name: string;
    avatar_url: string | null;
  };
  target_profile?: {
    full_name: string;
    avatar_url: string | null;
    user_type: string;
  };
}

interface CreateReviewData {
  target_id: string;
  target_type: 'property' | 'landlord' | 'agency';
  property_id?: string;
  rating: number;
  title: string;
  content: string;
  aspects: {
    cleanliness: number;
    communication: number;
    location: number;
    value_for_money: number;
    amenities: number;
  };
  is_recommended: boolean;
}

const StarRating = ({ rating, onRatingChange, readonly = false }: {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
}) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'} ${
            readonly ? 'cursor-default' : 'cursor-pointer hover:text-yellow-400'
          } transition-colors`}
          onClick={() => !readonly && onRatingChange?.(star)}
          disabled={readonly}
        >
          ★
        </button>
      ))}
    </div>
  );
};

const AspectRating = ({ aspect, rating, onChange, readonly = false }: {
  aspect: string;
  rating: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
}) => {
  const aspectLabels = {
    cleanliness: 'Propreté',
    communication: 'Communication',
    location: 'Localisation',
    value_for_money: 'Rapport qualité/prix',
    amenities: 'Équipements'
  };

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium">{aspectLabels[aspect as keyof typeof aspectLabels]}</span>
      <StarRating rating={rating} onRatingChange={onChange} readonly={readonly} />
    </div>
  );
};

export default function TenantReviews() {
  const { user, profile } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsGiven, setReviewsGiven] = useState<Review[]>([]);
  const [reviewsReceived, setReviewsReceived] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filter, setFilter] = useState<'all' | 'given' | 'received'>('all');

  const [newReview, setNewReview] = useState<CreateReviewData>({
    target_id: '',
    target_type: 'property',
    rating: 5,
    title: '',
    content: '',
    aspects: {
      cleanliness: 5,
      communication: 5,
      location: 5,
      value_for_money: 5,
      amenities: 5
    },
    is_recommended: true
  });

  const [availableTargets, setAvailableTargets] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchReviews();
      fetchAvailableTargets();
    }
  }, [user]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      // Récupérer les avis donnés par l'utilisateur
      const { data: givenData, error: givenError } = await supabase
        .from('reviews')
        .select(`
          *,
          properties:title, city, neighborhood,
          reviewer_profile:reviewer_id(full_name, avatar_url),
          target_profile:target_id(full_name, avatar_url, user_type)
        `)
        .eq('reviewer_id', user?.id)
        .order('created_at', { ascending: false });

      if (givenError) throw givenError;
      setReviewsGiven(givenData || []);

      // Récupérer les avis reçus sur l'utilisateur (en tant que propriétaire/locataire)
      const { data: receivedData, error: receivedError } = await supabase
        .from('reviews')
        .select(`
          *,
          properties:title, city, neighborhood,
          reviewer_profile:reviewer_id(full_name, avatar_url),
          target_profile:target_id(full_name, avatar_url, user_type)
        `)
        .eq('target_id', user?.id)
        .order('created_at', { ascending: false });

      if (receivedError) throw receivedError;
      setReviewsReceived(receivedData || []);

      setReviews([...(givenData || []), ...(receivedData || [])]);
    } catch (error) {
      logger.error('Error fetching reviews', { error, userId: user?.id });
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les avis',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTargets = async () => {
    try {
      // Récupérer les propriétés sur lesquelles l'utilisateur a postulé et qui sont approuvées
      const { data: applications } = await supabase
        .from('rental_applications')
        .select('property_id')
        .eq('applicant_id', user?.id)
        .eq('status', 'approved');

      if (applications && applications.length > 0) {
        const propertyIds = applications.map(app => app.property_id);

        const { data: properties } = await supabase
          .from('properties')
          .select('id, title, owner_id')
          .in('id', propertyIds);

        setAvailableTargets(properties || []);
      }
    } catch (error) {
      logger.error('Error fetching available targets', { error, userId: user?.id });
    }
  };

  const createReview = async () => {
    if (!newReview.target_id || !newReview.title || !newReview.content) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          reviewer_id: user?.id,
          ...newReview,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: 'Avis publié',
        description: 'Votre avis a été publié avec succès'
      });

      setShowCreateDialog(false);
      setNewReview({
        target_id: '',
        target_type: 'property',
        rating: 5,
        title: '',
        content: '',
        aspects: {
          cleanliness: 5,
          communication: 5,
          location: 5,
          value_for_money: 5,
          amenities: 5
        },
        is_recommended: true
      });

      fetchReviews();
    } catch (error) {
      logger.error('Error creating review', { error, userId: user?.id });
      toast({
        title: 'Erreur',
        description: 'Impossible de publier votre avis',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateReview = async (reviewId: string, helpful: boolean) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          helpful_votes: (helpful ? 1 : -1),
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId);

      if (error) throw error;

      fetchReviews();
    } catch (error) {
      logger.error('Error updating review', { error, userId: user?.id, reviewId });
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour l\'avis',
        variant: 'destructive'
      });
    }
  };

  const filteredReviews = filter === 'all' ? reviews : filter === 'given' ? reviewsGiven : reviewsReceived;

  const ReviewCard = ({ review, isGiven }: { review: Review; isGiven: boolean }) => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">
                {isGiven ? review.target_profile?.full_name : review.reviewer_profile?.full_name}
              </p>
              <p className="text-sm text-muted-foreground">
                {isGiven ? review.target_profile?.user_type : 'Locataire'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <StarRating rating={review.rating} readonly />
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(review.created_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold">{review.title}</h4>
            <p className="text-sm text-muted-foreground mt-1">{review.content}</p>
          </div>

          {review.properties && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Home className="h-4 w-4" />
              <span>{review.properties.title}</span>
              <MapPin className="h-4 w-4" />
              <span>{review.properties.neighborhood}, {review.properties.city}</span>
            </div>
          )}

          <div className="space-y-1">
            {Object.entries(review.aspects).map(([aspect, rating]) => (
              <AspectRating
                key={aspect}
                aspect={aspect}
                rating={rating}
                readonly
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {review.is_recommended ? (
              <Badge className="bg-green-500">
                <ThumbsUp className="h-3 w-3 mr-1" />
                Recommandé
              </Badge>
            ) : (
              <Badge variant="destructive">
                <ThumbsDown className="h-3 w-3 mr-1" />
                Non recommandé
              </Badge>
            )}
          </div>

          {!isGiven && (
            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateReview(review.id, true)}
              >
                <ThumbsUp className="h-4 w-4 mr-1" />
                Utile
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateReview(review.id, false)}
              >
                <ThumbsDown className="h-4 w-4 mr-1" />
                Pas utile
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <MainLayout>
      <div className="px-4 md:px-6 py-4 w-full">
        <DynamicBreadcrumb />

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <MessageSquare className="h-8 w-8 text-primary" />
              Mes avis
            </h1>
            <p className="text-muted-foreground">
              Consultez et publiez des avis sur les logements et propriétaires
            </p>
          </div>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Rédiger un avis
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Rédiger un avis</DialogTitle>
                <DialogDescription>
                  Partagez votre expérience sur un logement ou un propriétaire
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Note générale</label>
                  <StarRating
                    rating={newReview.rating}
                    onRatingChange={(rating) => setNewReview(prev => ({ ...prev, rating }))}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Titre de l'avis</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md"
                    value={newReview.title}
                    onChange={(e) => setNewReview(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Excellente expérience..."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <Textarea
                    value={newReview.content}
                    onChange={(e) => setNewReview(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Décrivez votre expérience..."
                    rows={4}
                  />
                </div>

                <div>
                  <h4 className="font-medium mb-3">Aspects détaillés</h4>
                  <div className="space-y-2">
                    {Object.entries(newReview.aspects).map(([aspect, rating]) => (
                      <AspectRating
                        key={aspect}
                        aspect={aspect}
                        rating={rating}
                        onChange={(newRating) => setNewReview(prev => ({
                          ...prev,
                          aspects: {
                            ...prev.aspects,
                            [aspect]: newRating
                          }
                        }))}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="recommended"
                    checked={newReview.is_recommended}
                    onChange={(e) => setNewReview(prev => ({ ...prev, is_recommended: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  <label htmlFor="recommended" className="text-sm font-medium">
                    Je recommande ce logement/propriétaire
                  </label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={createReview} disabled={loading}>
                    {loading ? 'Publication...' : 'Publier l\'avis'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Annuler
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtres */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Tous ({reviews.length})
          </Button>
          <Button
            variant={filter === 'given' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('given')}
          >
            Donnés ({reviewsGiven.length})
          </Button>
          <Button
            variant={filter === 'received' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('received')}
          >
            Reçus ({reviewsReceived.length})
          </Button>
        </div>

        {/* Liste des avis */}
        {loading ? (
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredReviews.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Aucun avis</h3>
              <p className="text-muted-foreground mb-4">
                {filter === 'given'
                  ? "Vous n'avez pas encore publié d'avis"
                  : filter === 'received'
                  ? "Vous n'avez pas encore reçu d'avis"
                  : "Aucun avis trouvé"
                }
              </p>
              {filter !== 'given' && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Rédiger un avis
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map(review => (
              <ReviewCard
                key={review.id}
                review={review}
                isGiven={filter === 'given' || (filter === 'all' && review.reviewer_id === user?.id)}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}