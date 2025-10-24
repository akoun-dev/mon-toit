import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMaintenanceRequests } from '@/hooks/useMaintenanceRequests';
import { MaintenanceRequestInput } from '@/types/owner';
import { Wrench, Camera, Upload, Calendar, DollarSign } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProperties } from '@/hooks/useProperties';

interface CreateMaintenanceRequestProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultPropertyId?: string;
}

export const CreateMaintenanceRequest: React.FC<CreateMaintenanceRequestProps> = ({
  onSuccess,
  onCancel,
  defaultPropertyId
}) => {
  const { user } = useAuth();
  const { createRequest, isCreating } = useMaintenanceRequests();
  const { properties } = useProperties(user?.id);
  const { toast } = useToast();

  const [formData, setFormData] = useState<MaintenanceRequestInput>({
    property_id: defaultPropertyId || '',
    title: '',
    description: '',
    priority: 'medium',
    category: undefined,
    estimated_cost: undefined,
    scheduled_date: undefined,
  });

  const [images, setImages] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.property_id) {
      newErrors.property_id = 'Veuillez sélectionner une propriété';
    }
    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est requis';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'La description est requise';
    }
    if (!formData.priority) {
      newErrors.priority = 'La priorité est requise';
    }

    if (formData.estimated_cost && isNaN(Number(formData.estimated_cost))) {
      newErrors.estimated_cost = 'Le coût doit être un nombre valide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      // Préparer les données
      const requestData: MaintenanceRequestInput = {
        ...formData,
        estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : undefined,
        images: images.length > 0 ? await uploadImages(images) : undefined,
      };

      await createRequest(requestData);

      if (onSuccess) {
        onSuccess();
      }

      // Réinitialiser le formulaire
      setFormData({
        property_id: defaultPropertyId || '',
        title: '',
        description: '',
        priority: 'medium',
        category: undefined,
        estimated_cost: undefined,
        scheduled_date: undefined,
      });
      setImages([]);
      setErrors({});
    } catch (error) {
      console.error('Failed to create maintenance request:', error);
    }
  };

  const uploadImages = async (files: File[]): Promise<string[]> => {
    // Implémenter l'upload d'images ici
    // Pour l'instant, retourner des URLs placeholder
    return files.map(file => URL.createObjectURL(file));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  };

  const categoryOptions = [
    { value: 'plumbing', label: 'Plomberie' },
    { value: 'electrical', label: 'Électricité' },
    { value: 'hvac', label: 'Climatisation/Chauffage' },
    { value: 'appliances', label: 'Électroménager' },
    { value: 'structural', label: 'Structure' },
    { value: 'pest_control', label: 'Dératisation' },
    { value: 'cleaning', label: 'Nettoyage' },
    { value: 'other', label: 'Autre' },
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Nouvelle demande de maintenance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sélection de la propriété */}
          <div className="space-y-2">
            <Label htmlFor="property_id">Propriété concernée *</Label>
            <Select
              value={formData.property_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, property_id: value }))}
            >
              <SelectTrigger className={errors.property_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="Sélectionner une propriété" />
              </SelectTrigger>
              <SelectContent>
                {properties?.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.title} - {property.address}, {property.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.property_id && (
              <p className="text-sm text-red-500">{errors.property_id}</p>
            )}
          </div>

          {/* Titre */}
          <div className="space-y-2">
            <Label htmlFor="title">Titre de la demande *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Fuite d'eau dans la salle de bain"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description détaillée *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Décrivez en détail le problème et quand il a commencé..."
              rows={4}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Priorité et Catégorie */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priorité *</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-gray-100 text-gray-800">Faible</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-800">Moyenne</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-orange-100 text-orange-800">Élevée</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="urgent">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-100 text-red-800">Urgente</Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Coût estimé et date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimated_cost" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Coût estimé (FCFA)
              </Label>
              <Input
                id="estimated_cost"
                type="number"
                value={formData.estimated_cost || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, estimated_cost: e.target.value }))}
                placeholder="Ex: 50000"
                className={errors.estimated_cost ? 'border-red-500' : ''}
              />
              {errors.estimated_cost && (
                <p className="text-sm text-red-500">{errors.estimated_cost}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled_date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date souhaitée
              </Label>
              <Input
                id="scheduled_date"
                type="date"
                value={formData.scheduled_date || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Images */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Photos (optionnel)
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center">
                      <Upload className="h-8 w-8 text-gray-400" />
                      <p className="text-sm text-gray-600">
                        Cliquez pour ajouter des photos
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG jusqu'à 10MB
                      </p>
                    </div>
                  </label>
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-20 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={isCreating}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isCreating}
            >
              {isCreating ? 'Création en cours...' : 'Créer la demande'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};