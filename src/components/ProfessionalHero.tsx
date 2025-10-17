/**
 * MON TOIT - Hero Section Professionnel
 * "Le logement en toute confiance"
 * 
 * Design UX/UI professionnel avec:
 * - Message clair et rassurant
 * - Recherche rapide accessible
 * - Badge ANSUT mis en avant
 * - Identité visuelle ivoirienne
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Home, PlusCircle, ShieldCheck, MapPin, Building2, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

export const ProfessionalHero = () => {
  const navigate = useNavigate();
  const [city, setCity] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [budget, setBudget] = useState('');

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (city) params.append('city', city);
    if (propertyType) params.append('type', propertyType);
    if (budget) params.append('maxPrice', budget);
    
    navigate(`/explorer?${params.toString()}`);
  };

  return (
    <section className="relative min-h-[600px] md:min-h-[700px] flex items-center justify-center overflow-hidden">
      
      {/* Image de fond - Skyline d'Abidjan */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/images/hero/abidjan-skyline.jpg)',
          backgroundPosition: 'center 40%'
        }}
      />
      
      {/* Overlay gradient pour lisibilité */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/80 to-primary-700/90" />
      
      {/* Motif culturel africain subtil */}
      <div className="absolute inset-0 bg-pattern-african opacity-5" />
      
      {/* Overlay doux supplémentaire */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

      {/* Contenu principal */}
      <div className="relative z-10 container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          
          {/* Badge ANSUT - Certification mise en avant */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center"
          >
            <Badge className="bg-white/95 text-primary hover:bg-white px-6 py-3 text-base font-semibold shadow-lg backdrop-blur-sm border-2 border-white/50">
              <ShieldCheck className="h-5 w-5 mr-2" />
              Plateforme Certifiée ANSUT
            </Badge>
          </motion.div>

          {/* Titre principal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
              Le logement en toute{' '}
              <span className="text-secondary-400 relative">
                confiance
                <svg
                  className="absolute -bottom-2 left-0 w-full h-3 text-secondary-400/30"
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
            
            <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto font-medium">
              Trouvez ou publiez un logement en Côte d'Ivoire avec la garantie de la certification ANSUT
            </p>
          </motion.div>

          {/* Formulaire de recherche simplifié */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="w-full max-w-4xl mx-auto"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 space-y-4">
              
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
                      <SelectItem value="Abidjan">Abidjan</SelectItem>
                      <SelectItem value="Yamoussoukro">Yamoussoukro</SelectItem>
                      <SelectItem value="Bouaké">Bouaké</SelectItem>
                      <SelectItem value="San-Pédro">San-Pédro</SelectItem>
                      <SelectItem value="Daloa">Daloa</SelectItem>
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
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-primary" />
                    Budget max
                  </label>
                  <Input
                    type="text"
                    placeholder="Ex: 200000"
                    value={budget}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setBudget(value);
                    }}
                    className="h-12 border-2 focus:border-primary bg-white"
                  />
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  onClick={handleSearch}
                  size="lg"
                  className="flex-1 h-14 text-lg font-bold bg-primary hover:bg-primary-600 shadow-lg hover:shadow-xl transition-all"
                >
                  <Search className="h-5 w-5 mr-2" />
                  Trouver un logement
                </Button>
                <Button
                  onClick={() => navigate('/publier')}
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 font-bold border-2 border-secondary text-secondary hover:bg-secondary hover:text-white shadow-lg hover:shadow-xl transition-all"
                >
                  <PlusCircle className="h-5 w-5 mr-2" />
                  Publier une annonce
                </Button>
              </div>

              {/* Message de confiance */}
              <p className="text-sm text-gray-600 text-center pt-2 flex items-center justify-center gap-2">
                <ShieldCheck className="h-4 w-4 text-success" />
                100% gratuit • Sécurisé • Certifié ANSUT
              </p>
            </div>
          </motion.div>

          {/* Statistiques de confiance */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="grid grid-cols-3 gap-6 md:gap-12 max-w-3xl mx-auto pt-8"
          >
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-extrabold text-white">3500+</div>
              <div className="text-sm md:text-base text-white/80 mt-1">Biens disponibles</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-extrabold text-white">10000+</div>
              <div className="text-sm md:text-base text-white/80 mt-1">Utilisateurs actifs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-extrabold text-white">98%</div>
              <div className="text-sm md:text-base text-white/80 mt-1">Satisfaction</div>
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

