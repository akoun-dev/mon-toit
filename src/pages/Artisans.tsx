/**
 * MON TOIT - Page Artisans & Services
 * Liste des artisans et services partenaires certifiés ANSUT
 */

import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  MapPin,
  Phone,
  Mail,
  Star,
  CheckCircle,
  Wrench,
  PaintBucket,
  Zap,
  Droplet,
  Hammer,
  Shield,
  ExternalLink,
  Clock,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SUTAChatbot } from '@/components/SUTAChatbot';
import { MainLayout } from '@/components/layout/MainLayout';

interface Artisan {
  id: string;
  name: string;
  category: string;
  specialties: string[];
  location: string;
  rating: number;
  reviews: number;
  certified: boolean;
  responseTime: string;
  phone: string;
  email: string;
  description: string;
  yearsExperience: number;
}

const categories = [
  { id: 'all', name: 'Toutes les catégories', icon: Wrench },
  { id: 'plumbing', name: 'Plomberie', icon: Droplet },
  { id: 'electricity', name: 'Électricité', icon: Zap },
  { id: 'painting', name: 'Peinture', icon: PaintBucket },
  { id: 'masonry', name: 'Maçonnerie', icon: Hammer },
  { id: 'general', name: 'Travaux généraux', icon: Wrench },
];

const mockArtisans: Artisan[] = [
  {
    id: '1',
    name: 'Bâtir CI',
    category: 'masonry',
    specialties: ['Maçonnerie', 'Carrelage', 'Enduits'],
    location: 'Abidjan, Cocody',
    rating: 4.8,
    reviews: 23,
    certified: true,
    responseTime: '< 2h',
    phone: '+225 07 00 00 00 01',
    email: 'contact@batir.ci',
    description: 'Spécialiste en maçonnerie et carrelage avec plus de 10 ans d\'expérience',
    yearsExperience: 12
  },
  {
    id: '2',
    name: 'Électro Service',
    category: 'electricity',
    specialties: ['Installation électrique', 'Mise aux normes', 'Dépannage'],
    location: 'Abidjan, Plateau',
    rating: 4.9,
    reviews: 31,
    certified: true,
    responseTime: '< 1h',
    phone: '+225 07 00 00 00 02',
    email: 'info@electro.ci',
    description: 'Électricien certifié pour tous vos projets résidentiels et commerciaux',
    yearsExperience: 8
  },
  {
    id: '3',
    name: 'Peinture Pro CI',
    category: 'painting',
    specialties: ['Peinture intérieure', 'Peinture extérieure', 'Décoration'],
    location: 'Abidjan, Marcory',
    rating: 4.7,
    reviews: 18,
    certified: true,
    responseTime: '< 4h',
    phone: '+225 07 00 00 00 03',
    email: 'peinture@pro.ci',
    description: 'Artisans peintres pour sublimer vos intérieurs et extérieurs',
    yearsExperience: 6
  },
];

const ArtisansPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredArtisans, setFilteredArtisans] = useState<Artisan[]>(mockArtisans);

  useEffect(() => {
    let filtered = mockArtisans;

    // Filtrer par catégorie
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(artisan => artisan.category === selectedCategory);
    }

    // Filtrer par recherche
    if (searchTerm) {
      filtered = filtered.filter(artisan =>
        artisan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        artisan.specialties.some(spec =>
          spec.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        artisan.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredArtisans(filtered);
  }, [searchTerm, selectedCategory]);

  return (
    <MainLayout>
      <div className="bg-gray-50">
      <Helmet>
        <title>Artisans & Services - Mon Toit</title>
        <meta name="description" content="Trouvez des artisans et services de confiance certifiés ANSUT pour vos travaux immobiliers en Côte d'Ivoire" />
      </Helmet>

      <SUTAChatbot />

      {/* En-tête */}
      <div className="bg-gradient-to-br from-primary via-primary-700 to-primary-900 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white/10 rounded-full">
                <Wrench className="h-12 w-12" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4">
              Artisans & Services
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Trouvez des artisans de confiance certifiés par ANSUT pour tous vos travaux
            </p>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-white/60" />
                  <Input
                    type="text"
                    placeholder="Rechercher un artisan, une spécialité..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/20 border-white/30 text-white placeholder-white/60"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres par catégorie */}
      <div className="container mx-auto px-4 -mt-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-4 mb-4">
            <Filter className="h-5 w-5 text-gray-500" />
            <h3 className="font-semibold">Catégories</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex items-center gap-2"
                >
                  <IconComponent className="h-4 w-4" />
                  {category.name}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Résultats */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {filteredArtisans.length} artisan{filteredArtisans.length > 1 ? 's' : ''} trouvé{filteredArtisans.length > 1 ? 's' : ''}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArtisans.map((artisan) => (
            <Card key={artisan.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl mb-1">{artisan.name}</CardTitle>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {artisan.location}
                    </p>
                  </div>
                  {artisan.certified && (
                    <div className="flex items-center gap-1 text-primary">
                      <CheckCircle className="h-5 w-5" />
                      <span className="text-xs font-medium">ANSUT</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{artisan.rating}</span>
                    <span className="text-sm text-gray-500">({artisan.reviews})</span>
                  </div>
                  <div className="flex items-center gap-1 text-green-600">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">{artisan.responseTime}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-gray-700">{artisan.description}</p>

                <div className="flex flex-wrap gap-2">
                  {artisan.specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>

                <div className="text-sm text-gray-600">
                  <span className="font-medium">{artisan.yearsExperience} ans</span> d'expérience
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <a
                    href={`tel:${artisan.phone}`}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary"
                  >
                    <Phone className="h-4 w-4" />
                    {artisan.phone}
                  </a>
                  <a
                    href={`mailto:${artisan.email}`}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary"
                  >
                    <Mail className="h-4 w-4" />
                    {artisan.email}
                  </a>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button className="flex-1" size="sm">
                    Contacter
                  </Button>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredArtisans.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
              <Search className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aucun artisan trouvé
            </h3>
            <p className="text-gray-600 mb-4">
              Essayez de modifier vos critères de recherche
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
            >
              Réinitialiser les filtres
            </Button>
          </div>
        )}
      </div>

      {/* Section Comment ça marche */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Comment trouver le bon artisan ?
            </h2>
            <p className="text-lg text-gray-600">
              Une plateforme simple et sécurisée pour vos travaux
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-primary/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">1. Recherchez</h3>
              <p className="text-sm text-gray-600">
                Trouvez des artisans par spécialité et localisation
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">2. Vérifiez</h3>
              <p className="text-sm text-gray-600">
                Consultez les avis et certifications ANSUT
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Phone className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">3. Contactez</h3>
              <p className="text-sm text-gray-600">
                Discutez directement avec les artisans
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">4. Validez</h3>
              <p className="text-sm text-gray-600">
                Confirmez et suivez vos travaux
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Call-to-action artisans */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-primary to-primary-600 rounded-2xl p-8 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">
              Vous êtes artisan ?
            </h2>
            <p className="text-lg mb-6 text-white/90">
              Rejoignez notre réseau de professionnels certifiés et accédez à plus de clients
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary">
                S'inscrire comme artisan
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
                En savoir plus
              </Button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </MainLayout>
  );
};

export default ArtisansPage;