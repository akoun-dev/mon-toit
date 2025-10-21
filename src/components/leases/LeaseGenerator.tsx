import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';
import {
  FileText,
  Download,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Home,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Edit
} from 'lucide-react';

interface LeaseData {
  landlord: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  tenant: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  property: {
    title: string;
    address: string;
    type: string;
    area: number;
    rooms: number;
  };
  lease: {
    type: 'residential' | 'commercial';
    duration: number; // months
    startDate: string;
    endDate: string;
    monthlyRent: number;
    deposit: number;
    charges: number;
    paymentDay: number;
    paymentMethod: string;
    purpose: string;
    specialConditions: string;
    inventoryDate?: string;
  };
}

interface LeaseGeneratorProps {
  propertyId?: string;
  tenantId?: string;
  landlordId?: string;
  prefillData?: Partial<LeaseData>;
  onGenerated?: (leaseUrl: string) => void;
}

const LeaseGenerator: React.FC<LeaseGeneratorProps> = ({
  propertyId,
  tenantId,
  landlordId,
  prefillData,
  onGenerated
}) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [leaseData, setLeaseData] = useState<LeaseData>({
    landlord: {
      name: '',
      address: '',
      phone: '',
      email: ''
    },
    tenant: {
      name: '',
      address: '',
      phone: '',
      email: ''
    },
    property: {
      title: '',
      address: '',
      type: '',
      area: 0,
      rooms: 0
    },
    lease: {
      type: 'residential',
      duration: 12,
      startDate: '',
      endDate: '',
      monthlyRent: 0,
      deposit: 0,
      charges: 0,
      paymentDay: 1,
      paymentMethod: 'orange_money',
      purpose: 'habitation',
      specialConditions: '',
      inventoryDate: ''
    },
    ...prefillData
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const leaseTemplates = [
    {
      id: 'residential_standard',
      name: 'Bail d\'habitation standard',
      type: 'residential',
      duration: 12
    },
    {
      id: 'residential_short',
      name: 'Bail d\'habitation courte durée',
      type: 'residential',
      duration: 6
    },
    {
      id: 'commercial_standard',
      name: 'Bail commercial standard',
      type: 'commercial',
      duration: 36
    },
    {
      id: 'seasonal',
      name: 'Bail saisonnier',
      type: 'residential',
      duration: 3
    }
  ];

  const handleTemplateSelect = (template: typeof leaseTemplates[0]) => {
    setLeaseData(prev => ({
      ...prev,
      lease: {
        ...prev.lease,
        type: template.type as 'residential' | 'commercial',
        duration: template.duration
      }
    }));
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    setLeaseData(prev => {
      const updated = {
        ...prev,
        lease: {
          ...prev.lease,
          [field]: value
        }
      };

      // Auto-calculate end date if start date changed
      if (field === 'startDate' && value) {
        const startDate = new Date(value);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + prev.lease.duration);
        updated.lease.endDate = endDate.toISOString().split('T')[0];
      }

      return updated;
    });
  };

  const generateLeasePDF = async () => {
    setIsGenerating(true);

    try {
      // Validate required fields
      const requiredFields = [
        'landlord.name', 'landlord.address', 'landlord.phone',
        'tenant.name', 'tenant.address', 'tenant.phone',
        'property.title', 'property.address',
        'lease.startDate', 'lease.endDate', 'lease.monthlyRent'
      ];

      const missingFields = requiredFields.filter(field => {
        const keys = field.split('.');
        let value: any = leaseData;
        for (const key of keys) {
          value = value?.[key];
        }
        return !value;
      });

      if (missingFields.length > 0) {
        throw new Error(`Champs obligatoires manquants: ${missingFields.join(', ')}`);
      }

      // Call edge function to generate PDF
      const { data, error } = await supabase.functions.invoke('generate-lease-pdf', {
        body: {
          leaseData,
          generatedBy: user?.id,
          propertyId,
          tenantId,
          landlordId
        }
      });

      if (error) throw error;

      // Create lease record in database
      const { data: leaseRecord, error: leaseError } = await supabase
        .from('leases')
        .insert({
          property_id: propertyId,
          tenant_id: tenantId,
          landlord_id: landlordId,
          monthly_rent: leaseData.lease.monthlyRent,
          deposit_amount: leaseData.lease.deposit,
          charges_amount: leaseData.lease.charges,
          lease_type: leaseData.lease.type,
          start_date: leaseData.lease.startDate,
          end_date: leaseData.lease.endDate,
          document_url: data.pdfUrl,
          status: 'draft',
          created_by: user?.id
        })
        .select()
        .single();

      if (leaseError) throw leaseError;

      toast({
        title: 'Bail généré avec succès',
        description: 'Le bail a été généré et sauvegardé.',
      });

      onGenerated?.(data.pdfUrl);

    } catch (error) {
      logger.error('Error generating lease PDF', { error, userId: user?.id });
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de la génération du bail',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadSample = () => {
    // Create sample PDF download
    const sampleData = {
      ...leaseData,
      landlord: {
        name: 'PROPRIETAIRE EXEMPLE',
        address: '123 Rue Exemple, Abidjan',
        phone: '+225 07 00 00 00 00',
        email: 'exemple@email.com'
      },
      tenant: {
        name: 'LOCATAIRE EXEMPLE',
        address: '456 Rue Test, Abidjan',
        phone: '+225 07 11 11 11 11',
        email: 'locataire@email.com'
      },
      property: {
        title: 'Appartement Exemple',
        address: '789 Boulevard Demo, Abidjan',
        type: 'T2',
        area: 55,
        rooms: 2
      }
    };

    // Trigger download of sample
    const link = document.createElement('a');
    link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent('EXEMPLE DE BAIL');
    link.download = 'exemple_bail.txt';
    link.click();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Générateur de Bail
              </CardTitle>
              <CardDescription>
                Créez un bail de location conforme et certifié ANSUT
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPreviewMode(!previewMode)}
              >
                {previewMode ? <Edit className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {previewMode ? 'Éditer' : 'Aperçu'}
              </Button>
              <Button variant="outline" onClick={downloadSample}>
                <Download className="h-4 w-4 mr-2" />
                Exemple
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Template Selection */}
          <div className="mb-6">
            <Label>Modèle de bail</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
              {leaseTemplates.map((template) => (
                <Button
                  key={template.id}
                  variant={leaseData.lease.type === template.type && leaseData.lease.duration === template.duration ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTemplateSelect(template)}
                  className="h-auto p-3 flex flex-col items-center gap-1"
                >
                  <FileText className="h-4 w-4" />
                  <span className="text-xs">{template.name}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Landlord Information */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Propriétaire (Bailleur)
              </h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="landlord-name">Nom complet *</Label>
                  <Input
                    id="landlord-name"
                    value={leaseData.landlord.name}
                    onChange={(e) => setLeaseData(prev => ({
                      ...prev,
                      landlord: { ...prev.landlord, name: e.target.value }
                    }))}
                    placeholder="Nom du propriétaire"
                  />
                </div>
                <div>
                  <Label htmlFor="landlord-address">Adresse *</Label>
                  <Input
                    id="landlord-address"
                    value={leaseData.landlord.address}
                    onChange={(e) => setLeaseData(prev => ({
                      ...prev,
                      landlord: { ...prev.landlord, address: e.target.value }
                    }))}
                    placeholder="Adresse complète"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="landlord-phone">Téléphone *</Label>
                    <Input
                      id="landlord-phone"
                      value={leaseData.landlord.phone}
                      onChange={(e) => setLeaseData(prev => ({
                        ...prev,
                        landlord: { ...prev.landlord, phone: e.target.value }
                      }))}
                      placeholder="+225 XX XX XX XX XX"
                    />
                  </div>
                  <div>
                    <Label htmlFor="landlord-email">Email</Label>
                    <Input
                      id="landlord-email"
                      type="email"
                      value={leaseData.landlord.email}
                      onChange={(e) => setLeaseData(prev => ({
                        ...prev,
                        landlord: { ...prev.landlord, email: e.target.value }
                      }))}
                      placeholder="email@exemple.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tenant Information */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Locataire
              </h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="tenant-name">Nom complet *</Label>
                  <Input
                    id="tenant-name"
                    value={leaseData.tenant.name}
                    onChange={(e) => setLeaseData(prev => ({
                      ...prev,
                      tenant: { ...prev.tenant, name: e.target.value }
                    }))}
                    placeholder="Nom du locataire"
                  />
                </div>
                <div>
                  <Label htmlFor="tenant-address">Adresse *</Label>
                  <Input
                    id="tenant-address"
                    value={leaseData.tenant.address}
                    onChange={(e) => setLeaseData(prev => ({
                      ...prev,
                      tenant: { ...prev.tenant, address: e.target.value }
                    }))}
                    placeholder="Adresse complète"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="tenant-phone">Téléphone *</Label>
                    <Input
                      id="tenant-phone"
                      value={leaseData.tenant.phone}
                      onChange={(e) => setLeaseData(prev => ({
                        ...prev,
                        tenant: { ...prev.tenant, phone: e.target.value }
                      }))}
                      placeholder="+225 XX XX XX XX XX"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tenant-email">Email</Label>
                    <Input
                      id="tenant-email"
                      type="email"
                      value={leaseData.tenant.email}
                      onChange={(e) => setLeaseData(prev => ({
                        ...prev,
                        tenant: { ...prev.tenant, email: e.target.value }
                      }))}
                      placeholder="email@exemple.com"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Property Information */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Home className="h-4 w-4" />
              Bien immobilier
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="property-title">Titre du bien *</Label>
                <Input
                  id="property-title"
                  value={leaseData.property.title}
                  onChange={(e) => setLeaseData(prev => ({
                    ...prev,
                    property: { ...prev.property, title: e.target.value }
                  }))}
                  placeholder="Appartement T2 - Cocody"
                />
              </div>
              <div>
                <Label htmlFor="property-address">Adresse *</Label>
                <Input
                  id="property-address"
                  value={leaseData.property.address}
                  onChange={(e) => setLeaseData(prev => ({
                    ...prev,
                    property: { ...prev.property, address: e.target.value }
                  }))}
                  placeholder="Adresse complète"
                />
              </div>
              <div>
                <Label htmlFor="property-type">Type de bien</Label>
                <Input
                  id="property-type"
                  value={leaseData.property.type}
                  onChange={(e) => setLeaseData(prev => ({
                    ...prev,
                    property: { ...prev.property, type: e.target.value }
                  }))}
                  placeholder="T2, T3, Studio..."
                />
              </div>
              <div>
                <Label htmlFor="property-area">Surface (m²)</Label>
                <Input
                  id="property-area"
                  type="number"
                  value={leaseData.property.area}
                  onChange={(e) => setLeaseData(prev => ({
                    ...prev,
                    property: { ...prev.property, area: parseInt(e.target.value) || 0 }
                  }))}
                  placeholder="55"
                />
              </div>
              <div>
                <Label htmlFor="property-rooms">Nombre de pièces</Label>
                <Input
                  id="property-rooms"
                  type="number"
                  value={leaseData.property.rooms}
                  onChange={(e) => setLeaseData(prev => ({
                    ...prev,
                    property: { ...prev.property, rooms: parseInt(e.target.value) || 0 }
                  }))}
                  placeholder="2"
                />
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Lease Terms */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Conditions du bail
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="start-date">Date de début *</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={leaseData.lease.startDate}
                  onChange={(e) => handleDateChange('startDate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end-date">Date de fin *</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={leaseData.lease.endDate}
                  onChange={(e) => handleDateChange('endDate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="duration">Durée (mois)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={leaseData.lease.duration}
                  onChange={(e) => setLeaseData(prev => ({
                    ...prev,
                    lease: { ...prev.lease, duration: parseInt(e.target.value) || 0 }
                  }))}
                  placeholder="12"
                />
              </div>
              <div>
                <Label htmlFor="monthly-rent">Loyer mensuel (FCFA) *</Label>
                <Input
                  id="monthly-rent"
                  type="number"
                  value={leaseData.lease.monthlyRent}
                  onChange={(e) => setLeaseData(prev => ({
                    ...prev,
                    lease: { ...prev.lease, monthlyRent: parseInt(e.target.value) || 0 }
                  }))}
                  placeholder="50000"
                />
              </div>
              <div>
                <Label htmlFor="deposit">Caution (FCFA)</Label>
                <Input
                  id="deposit"
                  type="number"
                  value={leaseData.lease.deposit}
                  onChange={(e) => setLeaseData(prev => ({
                    ...prev,
                    lease: { ...prev.lease, deposit: parseInt(e.target.value) || 0 }
                  }))}
                  placeholder="100000"
                />
              </div>
              <div>
                <Label htmlFor="charges">Charges (FCFA)</Label>
                <Input
                  id="charges"
                  type="number"
                  value={leaseData.lease.charges}
                  onChange={(e) => setLeaseData(prev => ({
                    ...prev,
                    lease: { ...prev.lease, charges: parseInt(e.target.value) || 0 }
                  }))}
                  placeholder="10000"
                />
              </div>
              <div>
                <Label htmlFor="payment-day">Jour de paiement</Label>
                <Select
                  value={leaseData.lease.paymentDay.toString()}
                  onValueChange={(value) => setLeaseData(prev => ({
                    ...prev,
                    lease: { ...prev.lease, paymentDay: parseInt(value) }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                      <SelectItem key={day} value={day.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="payment-method">Méthode de paiement</Label>
                <Select
                  value={leaseData.lease.paymentMethod}
                  onValueChange={(value) => setLeaseData(prev => ({
                    ...prev,
                    lease: { ...prev.lease, paymentMethod: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="orange_money">Orange Money</SelectItem>
                    <SelectItem value="mtn_money">MTN Money</SelectItem>
                    <SelectItem value="moov_money">Moov Money</SelectItem>
                    <SelectItem value="wave">Wave</SelectItem>
                    <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
                    <SelectItem value="cash">Espèces</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="purpose">Destination des locaux</Label>
                <Select
                  value={leaseData.lease.purpose}
                  onValueChange={(value) => setLeaseData(prev => ({
                    ...prev,
                    lease: { ...prev.lease, purpose: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="habitation">Habitation principale</SelectItem>
                    <SelectItem value="secondary">Résidence secondaire</SelectItem>
                    <SelectItem value="professional">Usage professionnel</SelectItem>
                    <SelectItem value="commercial">Usage commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="special-conditions">Conditions particulières</Label>
              <Textarea
                id="special-conditions"
                value={leaseData.lease.specialConditions}
                onChange={(e) => setLeaseData(prev => ({
                  ...prev,
                  lease: { ...prev.lease, specialConditions: e.target.value }
                }))}
                placeholder="Conditions particulières du bail..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="inventory-date">Date de l'état des lieux</Label>
              <Input
                id="inventory-date"
                type="date"
                value={leaseData.lease.inventoryDate}
                onChange={(e) => setLeaseData(prev => ({
                  ...prev,
                  lease: { ...prev.lease, inventoryDate: e.target.value }
                }))}
              />
            </div>
          </div>

          {/* Summary */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-3">Récapitulatif du bail</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Loyer:</span>
                <p className="font-semibold">{leaseData.lease.monthlyRent.toLocaleString()} FCFA</p>
              </div>
              <div>
                <span className="text-muted-foreground">Caution:</span>
                <p className="font-semibold">{leaseData.lease.deposit.toLocaleString()} FCFA</p>
              </div>
              <div>
                <span className="text-muted-foreground">Durée:</span>
                <p className="font-semibold">{leaseData.lease.duration} mois</p>
              </div>
              <div>
                <span className="text-muted-foreground">Total mensuel:</span>
                <p className="font-semibold">
                  {(leaseData.lease.monthlyRent + leaseData.lease.charges).toLocaleString()} FCFA
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <Button
              onClick={generateLeasePDF}
              disabled={isGenerating}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Générer le bail PDF
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
              {previewMode ? <Edit className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {previewMode ? 'Éditer' : 'Aperçu'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaseGenerator;