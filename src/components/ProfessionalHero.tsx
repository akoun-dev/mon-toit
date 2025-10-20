/**
 * MON TOIT - Hero Section Professionnel
 * "Trouvez votre Toit Idéal"
 * 
 * Design UX/UI avec palette "Coucher de soleil ivoirien":
 * - Fond crème clair avec dégradé pastel subtil
 * - Titre orange vif pour impact visuel
 * - Motifs culturels Kente discrets
 * - Badge ANSUT en tant que sponsor (pas identité dominante)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, PlusCircle, ShieldCheck, MapPin, Building2, DollarSign } from 'lucide-react';
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
      
      {/* Image de fond - Illustration Abidjan */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/images/hero/abidjan-illustration.png)',
          backgroundPosition: 'center 60%' // Meilleur cadrage sur mobile
        }}
      />
      
      {/* Overlay crème pour lisibilité (75% opacité) */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/75 via-background-sand/70 to-background-light/75" />
      
      {/* Motifs géométriques Kente - subtils mais visibles */}
      <div className="absolute inset-0 opacity-[0.06]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="kente-subtle" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              {/* Lignes verticales */}
              <line x1="10" y1="0" x2="10" y2="100" stroke="#E07A5F" strokeWidth="2" />
              <line x1="30" y1="0" x2="30" y2="100" stroke="#E07A5F" strokeWidth="1" />
              <line x1="50" y1="0" x2="50" y2="100" stroke="#FF6B35" strokeWidth="3" />
              <line x1="70" y1="0" x2="70" y2="100" stroke="#E07A5F" strokeWidth="1" />
              <line x1="90" y1="0" x2="90" y2="100" stroke="#E07A5F" strokeWidth="2" />
              
              {/* Lignes horizontales */}
              <line x1="0" y1="10" x2="100" y2="10" stroke="#E07A5F" strokeWidth="2" />
              <line x1="0" y1="30" x2="100" y2="30" stroke="#E07A5F" strokeWidth="1" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="#FF6B35" strokeWidth="3" />
              <line x1="0" y1="70" x2="100" y2="70" stroke="#E07A5F" strokeWidth="1" />
              <line x1="0" y1="90" x2="100" y2="90" stroke="#E07A5F" strokeWidth="2" />
              
              {/* Motifs en losange */}
              <polygon points="50,20 60,30 50,40 40,30" fill="#E07A5F" opacity="0.4" />
              <polygon points="50,60 60,70 50,80 40,70" fill="#FF6B35" opacity="0.4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#kente-subtle)" />
        </svg>
      </div>
      
      {/* Symboles Adinkra flottants - très discrets */}
      <div className="hidden md:block absolute top-20 left-10 w-24 h-24 opacity-[0.04]">
        <svg viewBox="0 0 100 100" className="w-full h-full animate-float">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#E07A5F" strokeWidth="3" />
          <path d="M50 20 L50 80 M30 50 L70 50" stroke="#E07A5F" strokeWidth="3" />
          <circle cx="50" cy="50" r="15" fill="#E07A5F" />
        </svg>
      </div>
      
      <div className="hidden md:block absolute bottom-32 right-20 w-20 h-20 opacity-[0.04]">
        <svg viewBox="0 0 100 100" className="w-full h-full animate-float" style={{ animationDelay: '1s' }}>
          <circle cx="50" cy="50" r="35" fill="none" stroke="#FF6B35" strokeWidth="3" />
          <path d="M50 30 Q30 50 50 70 Q70 50 50 30" fill="#FF6B35" />
        </svg>
      </div>

      {/* Contenu principal */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-24">
        <div className="max-w-5xl mx-auto text-center space-y-6 sm:space-y-8">
          
          {/* Badge ANSUT - discret, en tant que sponsor */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center"
          >
            <Badge className="bg-white text-gray-700 hover:bg-gray-50 px-4 py-2 text-sm font-medium shadow-sm border border-gray-200">
              <ShieldCheck className="h-4 w-4 mr-2 text-ansut-blue" />
              Certifié ANSUT
            </Badge>
          </motion.div>

          {/* Titre principal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight px-4 sm:px-0">
              Trouvez votre{' '}
              <span className="text-primary relative">
                Toit Idéal
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
              Explorez une vaste sélection de biens immobiliers à Abidjan et partout en Côte d'Ivoire
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
                  className="flex-1 h-14 text-lg font-bold bg-primary-600 hover:bg-primary-700 shadow-lg hover:shadow-xl transition-all"
                >
                  <Search className="h-5 w-5 mr-2" />
                  Rechercher
                </Button>
                <Button
                  onClick={() => navigate('/publier')}
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 font-bold border-2 border-primary text-primary hover:bg-primary hover:text-white shadow-lg hover:shadow-xl transition-all"
                >
                  <PlusCircle className="h-5 w-5 mr-2" />
                  Publier une annonce
                </Button>
              </div>

              {/* Message de confiance */}
              <p className="text-xs sm:text-sm text-gray-600 text-center pt-2 flex flex-wrap items-center justify-center gap-2">
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
            className="grid grid-cols-3 gap-3 sm:gap-6 md:gap-12 max-w-3xl mx-auto pt-8 px-4"
          >
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-primary">3500+</div>
              <div className="text-xs sm:text-sm md:text-base text-gray-600 mt-1">Biens disponibles</div>
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

