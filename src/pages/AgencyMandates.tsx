import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';
import { MainLayout } from '@/components/layout/MainLayout';
import { DynamicBreadcrumb } from '@/components/navigation/DynamicBreadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import {
  FileText,
  Plus,
  Edit,
  Eye,
  Trash2,
  Calendar,
  MapPin,
  DollarSign,
  User,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Download
} from 'lucide-react';

interface Mandate {
  id: string;
  mandate_number: string;
  property_id: string;
  owner_id: string;
  agency_id: string;
  mandate_type: 'simple' | 'exclusive' | 'co-exclusive';
  start_date: string;
  end_date: string;
  monthly_fee: number;
  success_fee: number;
  status: 'pending' | 'active' | 'expired' | 'terminated' | 'suspended';
  objectives: string;
  constraints: string;
  special_conditions: string;
  created_at: string;
  updated_at: string;
  properties?: {
    title: string;
    address: string;
    city: string;
    neighborhood: string;
    monthly_rent: number;
    property_type: string;
    surface_area: number;
  };
  owner_profile?: {
    full_name: string;
    phone: string;
    email: string;
  };
  document_url?: string;
}

interface CreateMandateData {
  property_id: string;
  mandate_type: 'simple' | 'exclusive' | 'co-exclusive';
  start_date: string;
  end_date: string;
  monthly_fee: number;
  success_fee: number;
  objectives: string;
  constraints: string;
  special_conditions: string;
}

const MANDATE_TYPES = {
  'simple': 'Mandat simple',
  'exclusive': 'Mandat exclusif',
  'co-exclusive': 'Co-mandat exclusif'
};

const STATUS_COLORS = {
  'pending': 'bg-yellow-500',
  'active': 'bg-green-500',
  'expired': 'bg-red-500',
  'terminated': 'bg-gray-500',
  'suspended': 'bg-orange-500'
};

const STATUS_LABELS = {
  'pending': 'En attente',
  'active': 'Actif',
  'expired': 'Expiré',
  'terminated': 'Terminé',
  'suspended': 'Suspendu'
};

export default function AgencyMandates() {
  const { user } = useAuth();
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedMandate, setSelectedMandate] = useState<Mandate | null>(null);
  const [activeTab, setActiveTab] = useState('active');

  const [newMandate, setNewMandate] = useState<CreateMandateData>({
    property_id: '',
    mandate_type: 'simple',
    start_date: '',
    end_date: '',
    monthly_fee: 0,
    success_fee: 0,
    objectives: '',
    constraints: '',
    special_conditions: ''
  });

  useEffect(() => {
    if (user) {
      fetchMandates();
      fetchProperties();
    }
  }, [user]);

  const fetchMandates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agency_mandates')
        .select(`
          *,
          properties(title, address, city, neighborhood, monthly_rent, property_type, surface_area),
          owner_profile:owner_id(full_name, phone, email)
        `)
        .eq('agency_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMandates(data || []);
    } catch (error) {
      logger.error('Error fetching mandates', { error, userId: user?.id });
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les mandats',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, title, address, city, neighborhood, monthly_rent')
        .eq('owner_id', user?.id);

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      logger.error('Error fetching properties', { error, userId: user?.id });
    }
  };

  const createMandate = async () => {
    if (!newMandate.property_id || !newMandate.start_date || !newMandate.end_date) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Obtenir les informations du propriétaire de la propriété
      const { data: property } = await supabase
        .from('properties')
        .select('owner_id')
        .eq('id', newMandate.property_id)
        .single();

      if (!property) throw new Error('Propriété non trouvée');

      // Générer un numéro de mandat
      const mandateNumber = `MDT-${Date.now()}`;

      const { error } = await supabase
        .from('agency_mandates')
        .insert({
          mandate_number: mandateNumber,
          agency_id: user?.id,
          owner_id: property.owner_id,
          ...newMandate,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: 'Mandat créé',
        description: 'Le mandat a été créé avec succès'
      });

      setShowCreateDialog(false);
      setNewMandate({
        property_id: '',
        mandate_type: 'simple',
        start_date: '',
        end_date: '',
        monthly_fee: 0,
        success_fee: 0,
        objectives: '',
        constraints: '',
        special_conditions: ''
      });

      fetchMandates();
    } catch (error) {
      logger.error('Error creating mandate', { error, userId: user?.id });
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le mandat',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateMandateStatus = async (mandateId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('agency_mandates')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', mandateId);

      if (error) throw error;

      toast({
        title: 'Statut mis à jour',
        description: `Le mandat est maintenant ${STATUS_LABELS[newStatus as keyof typeof STATUS_LABELS]}`
      });

      fetchMandates();
    } catch (error) {
      logger.error('Error updating mandate status', { error, userId: user?.id, mandateId });
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut',
        variant: 'destructive'
      });
    }
  };

  const deleteMandate = async (mandateId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce mandat ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('agency_mandates')
        .delete()
        .eq('id', mandateId);

      if (error) throw error;

      toast({
        title: 'Mandat supprimé',
        description: 'Le mandat a été supprimé avec succès'
      });

      fetchMandates();
    } catch (error) {
      logger.error('Error deleting mandate', { error, userId: user?.id, mandateId });
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le mandat',
        variant: 'destructive'
      });
    }
  };

  const generateMandateDocument = async (mandateId: string) => {
    try {
      // Logique pour générer le PDF du mandat
      toast({
        title: 'Document généré',
        description: 'Le document de mandat a été généré avec succès'
      });
    } catch (error) {
      logger.error('Error generating mandate document', { error, userId: user?.id, mandateId });
      toast({
        title: 'Erreur',
        description: 'Impossible de générer le document',
        variant: 'destructive'
      });
    }
  };

  const filteredMandates = mandates.filter(mandate => {
    switch (activeTab) {
      case 'active':
        return mandate.status === 'active';
      case 'pending':
        return mandate.status === 'pending';
      case 'expired':
        return mandate.status === 'expired';
      case 'all':
        return true;
      default:
        return true;
    }
  });

  const MandateCard = ({ mandate }: { mandate: Mandate }) => {
    const isExpiringSoon = mandate.end_date &&
      new Date(mandate.end_date).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;

    return (
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-lg">{mandate.mandate_number}</CardTitle>
                <Badge className={STATUS_COLORS[mandate.status as keyof typeof STATUS_COLORS]}>
                  {STATUS_LABELS[mandate.status as keyof typeof STATUS_LABELS]}
                </Badge>
                {isExpiringSoon && mandate.status === 'active' && (
                  <Badge variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Expiration bientôt
                  </Badge>
                )}
              </div>
              <CardDescription>
                {mandate.properties?.title || 'Propriété non spécifiée'}
              </CardDescription>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => generateMandateDocument(mandate.id)}>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => deleteMandate(mandate.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{mandate.properties?.city || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{mandate.owner_profile?.full_name || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>{MANDATE_TYPES[mandate.mandate_type]}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>{mandate.monthly_fee.toLocaleString()} FCFA/mois</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                Du {new Date(mandate.start_date).toLocaleDateString('fr-FR')} au{' '}
                {new Date(mandate.end_date).toLocaleDateString('fr-FR')}
              </span>
            </div>

            {mandate.objectives && (
              <div>
                <p className="text-sm font-medium mb-1">Objectifs:</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{mandate.objectives}</p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              {mandate.status === 'pending' && (
                <Button size="sm" onClick={() => updateMandateStatus(mandate.id, 'active')}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Activer
                </Button>
              )}
              {mandate.status === 'active' && (
                <Button size="sm" variant="outline" onClick={() => updateMandateStatus(mandate.id, 'terminated')}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Terminer
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="px-4 md:px-6 py-4 w-full">
        <DynamicBreadcrumb />

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              Mes mandats
            </h1>
            <p className="text-muted-foreground">
              Gérez vos mandats de gestion immobilière
            </p>
          </div>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau mandat
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Créer un nouveau mandat</DialogTitle>
                <DialogDescription>
                  Définissez les termes du mandat de gestion
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="property">Propriété</Label>
                    <Select value={newMandate.property_id} onValueChange={(value) => setNewMandate(prev => ({ ...prev, property_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une propriété" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map(property => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.title} - {property.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="mandateType">Type de mandat</Label>
                    <Select value={newMandate.mandate_type} onValueChange={(value: 'simple' | 'exclusive' | 'co-exclusive') => setNewMandate(prev => ({ ...prev, mandate_type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simple">Mandat simple</SelectItem>
                        <SelectItem value="exclusive">Mandat exclusif</SelectItem>
                        <SelectItem value="co-exclusive">Co-mandat exclusif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Date de début</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={newMandate.start_date}
                      onChange={(e) => setNewMandate(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="endDate">Date de fin</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={newMandate.end_date}
                      onChange={(e) => setNewMandate(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="monthlyFee">Frais mensuels (FCFA)</Label>
                    <Input
                      id="monthlyFee"
                      type="number"
                      value={newMandate.monthly_fee}
                      onChange={(e) => setNewMandate(prev => ({ ...prev, monthly_fee: parseFloat(e.target.value) }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="successFee">Frais de succès (%)</Label>
                    <Input
                      id="successFee"
                      type="number"
                      step="0.1"
                      value={newMandate.success_fee}
                      onChange={(e) => setNewMandate(prev => ({ ...prev, success_fee: parseFloat(e.target.value) }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="objectives">Objectifs</Label>
                  <Textarea
                    id="objectives"
                    value={newMandate.objectives}
                    onChange={(e) => setNewMandate(prev => ({ ...prev, objectives: e.target.value }))}
                    placeholder="Objectifs du mandat (ex: trouver locataire, maximiser le rendement...)"
                  />
                </div>

                <div>
                  <Label htmlFor="constraints">Contraintes</Label>
                  <Textarea
                    id="constraints"
                    value={newMandate.constraints}
                    onChange={(e) => setNewMandate(prev => ({ ...prev, constraints: e.target.value }))}
                    placeholder="Contraintes spécifiques (ex: loyer minimum, profil locataire...)"
                  />
                </div>

                <div>
                  <Label htmlFor="specialConditions">Conditions spéciales</Label>
                  <Textarea
                    id="specialConditions"
                    value={newMandate.special_conditions}
                    onChange={(e) => setNewMandate(prev => ({ ...prev, special_conditions: e.target.value }))}
                    placeholder="Conditions particulières du mandat"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={createMandate} disabled={loading}>
                    {loading ? 'Création...' : 'Créer le mandat'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Annuler
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtres par statut */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="active">
              Actifs ({mandates.filter(m => m.status === 'active').length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              En attente ({mandates.filter(m => m.status === 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="expired">
              Expirés ({mandates.filter(m => m.status === 'expired').length})
            </TabsTrigger>
            <TabsTrigger value="all">
              Tous ({mandates.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Liste des mandats */}
        {filteredMandates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Aucun mandat</h3>
              <p className="text-muted-foreground mb-4">
                {activeTab === 'active'
                  ? "Aucun mandat actif pour le moment"
                  : "Aucun mandat trouvé"
                }
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer un mandat
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredMandates.map(mandate => (
              <MandateCard key={mandate.id} mandate={mandate} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}