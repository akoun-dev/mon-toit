/**
 * MON TOIT - Mobile Hero
 * Version mobile du Hero avec palette "Coucher de soleil ivoirien"
 * Optimisé pour petits écrans (<768px)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Home, ShieldCheck, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const MobileHero = () => {
  const [city, setCity] = useState('all');
  const [propertyType, setPropertyType] = useState('all');
  const navigate = useNavigate();

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (city !== 'all') params.append('city', city);
    if (propertyType !== 'all') params.append('type', propertyType);
    
    const queryString = params.toString();
    navigate(`/explorer${queryString ? '?' + queryString : ''}`);
  };

  return (
    <section className="relative min-h-[500px] flex items-center justify-center overflow-hidden">
      
      {/* Image de fond - Illustration Abidjan */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/images/hero/abidjan-illustration.png)',
          backgroundPosition: 'center 60%'
        }}
      />
      
      {/* Overlay crème pour lisibilité */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background-sand/75 to-background-light/80" />
      
      {/* Motifs Kente subtils */}
      <div className="absolute inset-0 opacity-[0.04]">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(224, 122, 95, 0.3) 10px,
              rgba(224, 122, 95, 0.3) 20px
            )`
          }}
        />
      </div>

      {/* Contenu */}
      <div className="relative z-10 w-full px-4 py-10">
        <motion.div 
          className="flex flex-col gap-5 items-center text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Badge ANSUT discret */}
          <Badge className="bg-white text-gray-700 hover:bg-gray-50 px-3 py-1.5 text-xs font-medium shadow-sm border border-gray-200">
            <ShieldCheck className="h-3 w-3 mr-1.5 text-ansut-blue" />
            Certifié ANSUT
          </Badge>

          {/* Titre */}
          <h1 className="text-3xl font-extrabold text-gray-900 leading-tight px-2">
            Trouvez votre{' '}
            <span className="text-primary relative inline-block">
              Toit Idéal
              <svg
                className="absolute -bottom-1 left-0 w-full h-2 text-primary/30"
                viewBox="0 0 200 8"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 6C50 2 150 2 198 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>

          {/* Sous-titre */}
          <p className="text-sm text-gray-600 max-w-sm font-medium px-2">
            Explorez une vaste sélection de biens immobiliers à Abidjan
          </p>

          {/* Formulaire de recherche */}
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-5 border border-gray-100">
            
            {/* Titre du formulaire */}
            <div className="flex items-center gap-2 mb-4">
              <Search className="h-4 w-4 text-primary" />
              <h2 className="text-base font-bold text-gray-900">Recherche rapide</h2>
            </div>

            {/* Champs */}
            <div className="flex flex-col gap-3">
              
              {/* Ville */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-primary" />
                  Ville
                </label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger className="h-11 border-2 focus:border-primary bg-white">
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
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                  <Building2 className="h-3 w-3 text-primary" />
                  Type de bien
                </label>
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger className="h-11 border-2 focus:border-primary bg-white">
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

              {/* Bouton de recherche */}
              <Button
                onClick={handleSearch}
                size="lg"
                className="w-full h-12 text-base font-bold bg-primary-600 hover:bg-primary-700 shadow-lg mt-2"
              >
                <Search className="h-4 w-4 mr-2" />
                Rechercher
              </Button>

              {/* Message de confiance */}
              <p className="text-xs text-gray-600 text-center pt-1 flex flex-wrap items-center justify-center gap-1.5">
                <ShieldCheck className="h-3 w-3 text-success" />
                100% gratuit • Sécurisé
              </p>
            </div>
          </div>

          {/* Statistiques - 2x2 pour mobile */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm pt-4">
            <div className="text-center bg-white/60 backdrop-blur-sm rounded-xl p-3">
              <div className="text-2xl font-extrabold text-primary">3500+</div>
              <div className="text-xs text-gray-600 mt-0.5">Biens</div>
            </div>
            <div className="text-center bg-white/60 backdrop-blur-sm rounded-xl p-3">
              <div className="text-2xl font-extrabold text-primary">10000+</div>
              <div className="text-xs text-gray-600 mt-0.5">Utilisateurs</div>
            </div>
            <div className="text-center bg-white/60 backdrop-blur-sm rounded-xl p-3">
              <div className="text-2xl font-extrabold text-primary">98%</div>
              <div className="text-xs text-gray-600 mt-0.5">Satisfaction</div>
            </div>
            <div className="text-center bg-white/60 backdrop-blur-sm rounded-xl p-3">
              <div className="text-2xl font-extrabold text-primary">24h</div>
              <div className="text-xs text-gray-600 mt-0.5">Support</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Vague décorative en bas */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          className="w-full h-12 text-white"
          viewBox="0 0 1440 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <path
            d="M0 80L60 70C120 60 240 40 360 30C480 20 600 20 720 25C840 30 960 40 1080 45C1200 50 1320 50 1380 50L1440 50V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z"
            fill="currentColor"
          />
        </svg>
      </div>
    </section>
  );
};

