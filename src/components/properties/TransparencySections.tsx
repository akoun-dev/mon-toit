import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Shield,
  FileText,
  Home,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  MapPin,
  Calendar,
  Eye,
  Download,
  ExternalLink
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface VerificationStatus {
  type: 'verified' | 'pending' | 'rejected' | 'not_submitted';
  verifiedBy?: string;
  verifiedDate?: string;
  documents?: string[];
  notes?: string;
}

interface PropertyTransparencyProps {
  propertyId: string;
  propertyTitle?: string;
  titleStatus?: VerificationStatus;
  worksStatus?: VerificationStatus;
  ownershipDocuments?: Array<{
    type: string;
    name: string;
    url: string;
    uploadDate: string;
  }>;
  energyPerformance?: {
    rating: string;
    consumption: number;
    emissions: number;
    validUntil: string;
  };
  buildingInfo?: {
    constructionYear: number;
    buildingType: string;
    totalFloors: number;
    elevator: boolean;
    parking: boolean;
    sharedSpaces: string[];
  };
}

const PropertyTransparency: React.FC<PropertyTransparencyProps> = ({
  propertyId,
  propertyTitle,
  titleStatus = { type: 'not_submitted' },
  worksStatus = { type: 'not_submitted' },
  ownershipDocuments = [],
  energyPerformance,
  buildingInfo
}) => {
  const [activeTab, setActiveTab] = useState('title');

  const getStatusIcon = (status: VerificationStatus['type']) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Shield className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: VerificationStatus['type']) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: VerificationStatus['type']) => {
    switch (status) {
      case 'verified':
        return 'Vérifié';
      case 'pending':
        return 'En attente';
      case 'rejected':
        return 'Rejeté';
      default:
        return 'Non soumis';
    }
  };

  const getEnergyRatingColor = (rating: string) => {
    const colors: Record<string, string> = {
      'A': 'bg-green-500',
      'B': 'bg-green-400',
      'C': 'bg-yellow-400',
      'D': 'bg-yellow-500',
      'E': 'bg-orange-400',
      'F': 'bg-orange-500',
      'G': 'bg-red-500'
    };
    return colors[rating] || 'bg-gray-400';
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Transparence et Vérifications
          </CardTitle>
          <CardDescription>
            Informations transparentes sur le bien et documents vérifiés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="title" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Titre
              </TabsTrigger>
              <TabsTrigger value="works" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Travaux
              </TabsTrigger>
              <TabsTrigger value="energy" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Performance
              </TabsTrigger>
              <TabsTrigger value="building" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Bâtiment
              </TabsTrigger>
            </TabsList>

            {/* Title Verification */}
            <TabsContent value="title" className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">Titre de Propriété</h3>
                  <p className="text-sm text-muted-foreground">
                    {propertyTitle || `Bien #${propertyId}`}
                  </p>
                </div>
                <Badge className={getStatusColor(titleStatus.type)}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(titleStatus.type)}
                    {getStatusText(titleStatus.type)}
                  </div>
                </Badge>
              </div>

              {titleStatus.verifiedBy && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Détails de vérification</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4" />
                      <span>Vérifié par: {titleStatus.verifiedBy}</span>
                    </div>
                    {titleStatus.verifiedDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        <span>Date: {titleStatus.verifiedDate}</span>
                      </div>
                    )}
                    {titleStatus.notes && (
                      <div className="text-sm p-2 bg-muted rounded">
                        {titleStatus.notes}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Ownership Documents */}
              {ownershipDocuments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Documents de propriété</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {ownershipDocuments.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <div>
                              <p className="text-sm font-medium">{doc.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {doc.type} • {doc.uploadDate}
                              </p>
                            </div>
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>{doc.name}</DialogTitle>
                                <DialogDescription>
                                  Document de type {doc.type}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="w-full h-96 flex items-center justify-center bg-muted rounded">
                                <p className="text-muted-foreground">
                                  Aperçu du document non disponible
                                </p>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Works Status */}
            <TabsContent value="works" className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">État des Travaux</h3>
                  <p className="text-sm text-muted-foreground">
                    Informations sur les travaux récents ou prévus
                  </p>
                </div>
                <Badge className={getStatusColor(worksStatus.type)}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(worksStatus.type)}
                    {getStatusText(worksStatus.type)}
                  </div>
                </Badge>
              </div>

              {worksStatus.notes && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 text-blue-600" />
                      <div className="text-sm">
                        <p className="font-medium mb-1">Informations sur les travaux:</p>
                        <p className="text-muted-foreground">{worksStatus.notes}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {worksStatus.documents && worksStatus.documents.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Documents relatifs aux travaux</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {worksStatus.documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{doc}</span>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Energy Performance */}
            <TabsContent value="energy" className="space-y-4">
              {energyPerformance ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Performance Énergétique</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Energy Rating */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Classe énergétique:</span>
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded ${getEnergyRatingColor(energyPerformance.rating)} flex items-center justify-center text-white font-bold`}>
                              {energyPerformance.rating}
                            </div>
                            <span className="text-sm">{energyPerformance.rating}</span>
                          </div>
                        </div>

                        <Separator />

                        {/* Consumption */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Consommation:</span>
                          <span className="text-sm font-medium">
                            {energyPerformance.consumption} kWh/m²/an
                          </span>
                        </div>

                        {/* Emissions */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Émissions CO₂:</span>
                          <span className="text-sm font-medium">
                            {energyPerformance.emissions} kg CO₂/m²/an
                          </span>
                        </div>

                        {/* Validity */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Valide jusqu'au:</span>
                          <span className="text-sm font-medium">
                            {energyPerformance.validUntil}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Button variant="outline" className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Voir le diagnostic complet
                  </Button>
                </>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground">
                      <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Diagnostic de performance énergétique non disponible</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Building Information */}
            <TabsContent value="building" className="space-y-4">
              {buildingInfo ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Informations sur le bâtiment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4" />
                          <span>Construction: {buildingInfo.constructionYear}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Home className="h-4 w-4" />
                          <span>Type: {buildingInfo.buildingType}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4" />
                          <span>Étages: {buildingInfo.totalFloors}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span>Ascenseur:</span>
                          <Badge variant={buildingInfo.elevator ? 'default' : 'secondary'}>
                            {buildingInfo.elevator ? 'Oui' : 'Non'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span>Parking:</span>
                          <Badge variant={buildingInfo.parking ? 'default' : 'secondary'}>
                            {buildingInfo.parking ? 'Oui' : 'Non'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {buildingInfo.sharedSpaces.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="text-sm font-medium mb-2">Espaces communs:</h4>
                          <div className="flex flex-wrap gap-1">
                            {buildingInfo.sharedSpaces.map((space, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {space}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground">
                      <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Informations sur le bâtiment non disponibles</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Trust Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Gages de confiance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 p-2 border rounded">
              <Shield className="h-4 w-4 text-green-600" />
              <div className="text-xs">
                <p className="font-medium">Certification ANSUT</p>
                <p className="text-muted-foreground">Vérifié par l'État</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 border rounded">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <div className="text-xs">
                <p className="font-medium">Documents vérifiés</p>
                <p className="text-muted-foreground">Authenticité validée</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 border rounded">
              <Eye className="h-4 w-4 text-purple-600" />
              <div className="text-xs">
                <p className="font-medium">Transparence totale</p>
                <p className="text-muted-foreground">Informations complètes</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PropertyTransparency;