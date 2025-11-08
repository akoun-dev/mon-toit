/**
 * DONIA - Hero Section Professionnel
 * "Votre maison, en toute confiance"
 * 
 * Design UX/UI avec palette Burkina Faso:
 * - Fond crème clair avec dégradé pastel subtil
 * - Titre rouge vif (couleur drapeau) pour impact visuel
 * - Motifs culturels Faso Dan Fani discrets
 * - Partenaires: Infosec Burkina + Faso Arzeka
 */

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, PlusCircle, ShieldCheck, MapPin, Building2, DollarSign } from 'lucide-react';
import { RippleButton } from '@/components/animations/RippleButton';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import Autoplay from 'embla-carousel-autoplay';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { CarouselDots } from '@/components/ui/carousel-dots';
import { useHeroImages } from '@/hooks/useHeroImages';
import { celebrateFirstApplication } from '@/utils/confetti';

const heroImages = [
  {
    url: 'https://images.unsplash.com/photo-1632481725116-85a3c56b0cf0?w=1920&q=80',
    alt: 'Architecture moderne à Ouagadougou',
  },
  {
    url: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1920&q=80',
    alt: 'Villa résidentielle burkinabè',
  },
  {
    url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1920&q=80',
    alt: 'Appartement moderne avec vue',
  },
  {
    url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80',
    alt: 'Complexe résidentiel contemporain',
  },
  {
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80',
    alt: 'Maison familiale burkinabè',
  }
];

export const ProfessionalHero = () => {
  const navigate = useNavigate();
  const [city, setCity] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [budget, setBudget] = useState('');

  const { data: heroImagesData = [] } = useHeroImages('desktop');

  const displayImages = heroImagesData.length > 0 
    ? heroImagesData.map(img => ({ url: img.image_url, alt: img.alt_text }))
    : heroImages;

  const autoplayPlugin = useRef(
    Autoplay({ 
      delay: 5000,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    })
  );

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (city) params.append('city', city);
    if (propertyType) params.append('type', propertyType);
    if (budget) params.append('maxPrice', budget);
    
    // Confetti si c'est la première recherche
    const hasSearchedBefore = localStorage.getItem('has_searched');
    if (!hasSearchedBefore) {
      celebrateFirstApplication();
      localStorage.setItem('has_searched', 'true');
    }
    
    navigate(`/explorer?${params.toString()}`);
  };

  return (
    <section className="relative min-h-[600px] md:min-h-[700px] flex items-center justify-center overflow-hidden">
      
      {/* Carrousel d'images - Architecture burkinabè authentique */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <Carousel
          opts={{
            loop: displayImages.length > 1,
            align: "center",
          }}
          plugins={displayImages.length > 1 ? [autoplayPlugin.current] : []}
          className="w-full h-full"
      >
        <CarouselContent className="h-full">
          {displayImages.map((image, index) => (
            <CarouselItem key={index} className="relative h-full min-h-full">
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700"
                style={{
                  backgroundImage: `url(${image.url})`,
                }}
                role="img"
                aria-label={image.alt}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Indicateurs de progression */}
        <div className="absolute bottom-8 left-0 right-0 z-10">
          <CarouselDots />
        </div>
      </Carousel>
      </div>
      
      {/* Overlay directionnel - opaque à gauche (texte), transparent à droite (image) */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-white/30 z-[1]" />

      {/* Contenu principal */}
      <div className="relative z-20 container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-24">
        <div className="max-w-5xl mx-auto text-center space-y-6 sm:space-y-8">
          
          {/* Badge confiance DONIA */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center"
          >
            <Badge className="bg-white text-gray-700 hover:bg-gray-50 px-4 py-2 text-sm font-medium shadow-sm border border-gray-200">
              <ShieldCheck className="h-4 w-4 mr-2 text-primary" />
              Plateforme sécurisée DONIA
            </Badge>
          </motion.div>

          {/* Titre principal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight px-4 sm:px-0 drop-shadow-lg">
              Trouvez votre logement au{' '}
              <span className="text-primary relative">
                Burkina Faso
                <svg
                  className="absolute -bottom-2 left-0 w-full h-3 text-primary/30"
                  viewBox="0 0 200 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 10C50 2 150 2 198 10"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto font-medium px-4 sm:px-0">
              Plus de 3,500 biens vérifiés à Ouagadougou, Bobo-Dioulasso, Koudougou, Ouahigouya et Banfora
            </p>
          </motion.div>

          {/* Formulaire de recherche simplifié */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="w-full max-w-4xl mx-auto"
          >
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 space-y-4 border border-gray-100">
              
              {/* Titre du formulaire */}
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  Recherche rapide
                </h2>
                <span className="text-sm text-gray-500">Simple et efficace</span>
              </div>

              {/* Champs de recherche */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Ville */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-primary" />
                    Ville
                  </label>
                  <Select value={city} onValueChange={setCity}>
                    <SelectTrigger className="h-12 border-2 focus:border-primary bg-white">
                      <SelectValue placeholder="Toutes les villes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les villes</SelectItem>
                      <SelectItem value="Ouagadougou">Ouagadougou</SelectItem>
                      <SelectItem value="Bobo-Dioulasso">Bobo-Dioulasso</SelectItem>
                      <SelectItem value="Koudougou">Koudougou</SelectItem>
                      <SelectItem value="Ouahigouya">Ouahigouya</SelectItem>
                      <SelectItem value="Banfora">Banfora</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Type de bien */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Building2 className="h-4 w-4 text-primary" />
                    Type de bien
                  </label>
                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger className="h-12 border-2 focus:border-primary bg-white">
                      <SelectValue placeholder="Tous les types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      <SelectItem value="appartement">Appartement</SelectItem>
                      <SelectItem value="villa">Villa</SelectItem>
                      <SelectItem value="studio">Studio</SelectItem>
                      <SelectItem value="duplex">Duplex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Budget */}
                <div>
                  <FloatingLabelInput
                    id="budget"
                    type="text"
                    label="Budget max (FCFA)"
                    value={budget}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setBudget(value);
                    }}
                    showValidation={budget !== ''}
                    isValid={budget !== '' && parseInt(budget) >= 50000}
                    className="bg-white"
                  />
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <RippleButton
                  onClick={handleSearch}
                  size="lg"
                  className="flex-1 h-14 text-lg font-bold bg-primary-600 hover:bg-primary-700 shadow-lg hover:shadow-xl transition-all"
                >
                  <Search className="h-5 w-5 mr-2" />
                  Rechercher
                </RippleButton>
                <RippleButton
                  onClick={() => navigate('/publier')}
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 font-bold border-2 border-primary text-primary hover:bg-primary hover:text-white shadow-lg hover:shadow-xl transition-all"
                >
                  <PlusCircle className="h-5 w-5 mr-2" />
                  Publier une annonce
                </RippleButton>
              </div>

              {/* Message de confiance */}
              <p className="text-xs sm:text-sm text-gray-600 text-center pt-2 flex flex-wrap items-center justify-center gap-2">
                <ShieldCheck className="h-4 w-4 text-success" />
                Paiement Faso Arzeka sécurisé • 100% Burkinabè • Infosec Burkina
              </p>
            </div>
          </motion.div>

          {/* Statistiques de confiance */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="grid grid-cols-3 gap-3 sm:gap-6 md:gap-12 max-w-3xl mx-auto pt-8 px-4"
          >
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-primary">3500+</div>
              <div className="text-xs sm:text-sm md:text-base text-gray-600 mt-1">Biens vérifiés DONIA</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-primary">10000+</div>
              <div className="text-xs sm:text-sm md:text-base text-gray-600 mt-1">Utilisateurs actifs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-primary">98%</div>
              <div className="text-xs sm:text-sm md:text-base text-gray-600 mt-1">Satisfaction</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Vague décorative en bas */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          className="w-full h-16 md:h-24 text-white"
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <path
            d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="currentColor"
          />
        </svg>
      </div>
    </section>
  );
};

