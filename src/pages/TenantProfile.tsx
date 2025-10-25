import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';
import { MainLayout } from '@/components/layout/MainLayout';
import { DynamicBreadcrumb } from '@/components/navigation/DynamicBreadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  Shield,
  Edit,
  Camera,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle
} from 'lucide-react';

interface TenantProfile {
  id: string;
  full_name: string;
  phone: string | null;
  email: string;
  avatar_url: string | null;
  is_verified: boolean;
  oneci_verified: boolean;
  cnam_verified: boolean;
  face_verified: boolean;
  income_verified: boolean;
  guarantor_verified: boolean;
  created_at: string;
  user_preferences: {
    notifications_enabled: boolean;
    email_notifications: boolean;
    sms_notifications: boolean;
    preferred_language: string;
  };
  tenant_score: number | null;
}

interface VerificationDocument {
  id: string;
  document_type: string;
  status: 'pending' | 'approved' | 'rejected';
  uploaded_at: string;
  expires_at: string | null;
  url: string | null;
  rejection_reason: string | null;
}

export default function TenantProfile() {
  const { user, profile } = useAuth();
  const [tenantProfile, setTenantProfile] = useState<TenantProfile | null>(null);
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    user_preferences: {
      notifications_enabled: true,
      email_notifications: true,
      sms_notifications: false,
      preferred_language: 'fr'
    }
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchDocuments();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_preferences(*),
          tenant_scores(score)
        `)
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      setTenantProfile({
        ...data,
        tenant_score: data.tenant_scores?.score || null
      });

      setFormData({
        full_name: data.full_name || '',
        phone: data.phone || '',
        user_preferences: data.user_preferences || {
          notifications_enabled: true,
          email_notifications: true,
          sms_notifications: false,
          preferred_language: 'fr'
        }
      });
    } catch (error) {
      logger.error('Error fetching tenant profile', { error, userId: user?.id });
      toast({
        title: 'Erreur',
        description: 'Impossible de charger votre profil',
        variant: 'destructive'
      });
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('user_verifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      logger.error('Error fetching documents', { error, userId: user?.id });
    }
  };

  const updateProfile = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          user_preferences: formData.user_preferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) throw error;

      await fetchProfile();
      setEditMode(false);
      toast({
        title: 'Profil mis à jour',
        description: 'Vos informations ont été enregistrées avec succès'
      });
    } catch (error) {
      logger.error('Error updating profile', { error, userId: user?.id });
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour votre profil',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/avatar_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      await fetchProfile();
      toast({
        title: 'Photo de profil mise à jour',
        description: 'Votre nouvelle photo de profil est maintenant visible'
      });
    } catch (error) {
      logger.error('Error uploading avatar', { error, userId: user?.id });
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour votre photo de profil',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getVerificationStatus = (verified: boolean) => {
    if (verified) {
      return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Vérifié</Badge>;
    }
    return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Non vérifié</Badge>;
  };

  const getDocumentStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Approuvé</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejeté</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!tenantProfile) {
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

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Mon Profil</h1>
          <p className="text-muted-foreground">
            Gérez vos informations personnelles et vos documents de vérification
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Carte principale du profil */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={tenantProfile.avatar_url || ''} />
                      <AvatarFallback>
                        {tenantProfile.full_name?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-xl font-semibold">{tenantProfile.full_name}</h2>
                      <p className="text-sm text-muted-foreground">Locataire</p>
                    </div>
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditMode(!editMode)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {editMode ? 'Annuler' : 'Modifier'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {editMode ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="fullName">Nom complet</Label>
                      <Input
                        id="fullName"
                        value={formData.full_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={tenantProfile.email}
                        disabled
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id="avatar"
                        accept="image/*"
                        onChange={uploadAvatar}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('avatar')?.click()}
                        disabled={loading}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Changer la photo
                      </Button>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button onClick={updateProfile} disabled={loading}>
                        {loading ? 'Enregistrement...' : 'Enregistrer'}
                      </Button>
                      <Button variant="outline" onClick={() => setEditMode(false)}>
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Nom:</span>
                        <span>{tenantProfile.full_name}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Téléphone:</span>
                        <span>{tenantProfile.phone || 'Non renseigné'}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Email:</span>
                        <span>{tenantProfile.email}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Membre depuis:</span>
                        <span>{new Date(tenantProfile.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-3">Notifications</h4>
                      <div className="flex flex-wrap gap-2">
                        {formData.user_preferences.email_notifications && (
                          <Badge variant="outline">Email</Badge>
                        )}
                        {formData.user_preferences.sms_notifications && (
                          <Badge variant="outline">SMS</Badge>
                        )}
                        {formData.user_preferences.notifications_enabled && (
                          <Badge variant="outline">Push</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Vérifications */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Statut de vérification
                </CardTitle>
                <CardDescription>
                  Complétez votre profil pour augmenter votre score de fiabilité
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Compte vérifié</p>
                      <p className="text-sm text-muted-foreground">Email et téléphone</p>
                    </div>
                    {getVerificationStatus(tenantProfile.is_verified)}
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">ONECI</p>
                      <p className="text-sm text-muted-foreground">Identité nationale</p>
                    </div>
                    {getVerificationStatus(tenantProfile.oneci_verified)}
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">CNAM</p>
                      <p className="text-sm text-muted-foreground">Assurance maladie</p>
                    </div>
                    {getVerificationStatus(tenantProfile.cnam_verified)}
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Reconnaissance faciale</p>
                      <p className="text-sm text-muted-foreground">Vérification biométrique</p>
                    </div>
                    {getVerificationStatus(tenantProfile.face_verified)}
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Revenus</p>
                      <p className="text-sm text-muted-foreground">Justificatifs de revenus</p>
                    </div>
                    {getVerificationStatus(tenantProfile.income_verified)}
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Garant</p>
                      <p className="text-sm text-muted-foreground">Information garant</p>
                    </div>
                    {getVerificationStatus(tenantProfile.guarantor_verified)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Colonne latérale */}
          <div className="space-y-6">
            {/* Score du locataire */}
            {tenantProfile.tenant_score && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Score de fiabilité
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">
                      {tenantProfile.tenant_score}/100
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Excellent score de locataire
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions rapides */}
            <Card>
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="/documents">Mes documents</a>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="/applications">Mes candidatures</a>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="/leases">Mes baux</a>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="/payments">Paiements</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}