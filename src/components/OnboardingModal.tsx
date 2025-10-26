import { useState, useEffect } from "react";
import { Home, Building, Building2, X, MapPin, Users, Shield, Sparkles, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

const OnboardingModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("onboarding_seen");
    if (!hasSeenOnboarding) {
      // Délai de 1.5 secondes pour laisser la page se charger
      setTimeout(() => {
        setIsOpen(true);
      }, 1500);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("onboarding_seen", "true");
    setIsOpen(false);
  };

  const handleChoice = () => {
    localStorage.setItem("onboarding_seen", "true");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="w-[95vw] h-[95vh] md:h-auto md:max-w-6xl md:w-auto mx-auto max-h-[95vh] overflow-y-auto p-4 md:p-6">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-white/90 backdrop-blur-sm p-2 opacity-70 hover:opacity-100 transition-all duration-200 hover:scale-110 shadow-lg"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header avec design amélioré et responsive */}
        <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 text-white p-4 sm:p-6 md:p-8 rounded-xl mb-4 md:mb-6 overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 text-center">
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-white/20 backdrop-blur-sm rounded-full">
                <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
            </div>
            <DialogTitle className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 px-2">
              Bienvenue sur Mon Toit ! 🏡
            </DialogTitle>
            <DialogDescription className="text-base sm:text-lg md:text-xl text-white/90 font-medium px-2">
              Votre plateforme immobilière de confiance en Côte d'Ivoire
            </DialogDescription>
            <div className="flex flex-col sm:flex-row justify-center gap-2 mt-3 sm:mt-4 px-2">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs sm:text-sm">
                <Shield className="h-3 w-3 mr-1" />
                Certifié ANSUT
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs sm:text-sm">
                <MapPin className="h-3 w-3 mr-1" />
                Abidjan & environs
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Carte 1 - Locataire */}
          <Link to="/explorer" onClick={handleChoice} className="group">
            <Card className="p-4 sm:p-6 text-center hover:shadow-2xl hover:scale-[1.02] transition-all duration-400 cursor-pointer border-2 border-transparent hover:border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 relative overflow-hidden">
              <div className="absolute top-2 right-2">
                <Badge className="bg-blue-500 text-white text-xs">
                  Plus populaire
                </Badge>
              </div>
              <div className="flex justify-center mb-3 sm:mb-4 relative z-10">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Home className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-800 px-2">Je cherche un logement</h3>
              <p className="text-gray-600 mb-3 sm:mb-4 leading-relaxed text-sm sm:text-base px-2">Accédez à +500 biens vérifiés à Abidjan et trouvez votre logement idéal en 48h</p>

              <div className="space-y-1.5 sm:space-y-2 text-left text-xs sm:text-sm">
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-blue-500" />
                  <span>Tous les quartiers d'Abidjan</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-blue-500" />
                  <span>Biens vérifiés et garantis</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-blue-500" />
                  <span>Support client 7j/7</span>
                </div>
              </div>

              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-blue-200">
                <div className="flex items-center justify-center text-blue-600 font-medium group-hover:text-blue-700 text-sm">
                  <span>Commencer ma recherche</span>
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Card>
          </Link>

          {/* Carte 2 - Propriétaire */}
          <Link to="/publier" onClick={handleChoice} className="group">
            <Card className="p-4 sm:p-6 text-center hover:shadow-2xl hover:scale-[1.02] transition-all duration-400 cursor-pointer border-2 border-transparent hover:border-orange-500 bg-gradient-to-br from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 relative overflow-hidden">
              <div className="absolute top-2 right-2">
                <Badge className="bg-orange-500 text-white text-xs">
                  Gratuit
                </Badge>
              </div>
              <div className="flex justify-center mb-3 sm:mb-4 relative z-10">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Building className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-800 px-2">Je suis propriétaire</h3>
              <p className="text-gray-600 mb-3 sm:mb-4 leading-relaxed text-sm sm:text-base px-2">Mettez votre bien en valeur et trouvez le locataire idéal rapidement</p>

              <div className="space-y-1.5 sm:space-y-2 text-left text-xs sm:text-sm">
                <div className="flex items-center text-gray-600">
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-orange-500" />
                  <span>Publication 100% gratuite</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-orange-500" />
                  <span>+10,000 locataires potentiels</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-orange-500" />
                  <span>Photos et visites virtuelles</span>
                </div>
              </div>

              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-orange-200">
                <div className="flex items-center justify-center text-orange-600 font-medium group-hover:text-orange-700 text-sm">
                  <span>Publier mon bien</span>
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Card>
          </Link>

          {/* Carte 3 - Agence */}
          <Link to="/agence" onClick={handleChoice} className="group">
            <Card className="p-4 sm:p-6 text-center hover:shadow-2xl hover:scale-[1.02] transition-all duration-400 cursor-pointer border-2 border-transparent hover:border-purple-500 bg-gradient-to-br from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 relative overflow-hidden">
              <div className="absolute top-2 right-2">
                <Badge className="bg-purple-500 text-white text-xs">
                  Pro
                </Badge>
              </div>
              <div className="flex justify-center mb-3 sm:mb-4 relative z-10">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Building2 className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-800 px-2">Je suis une agence</h3>
              <p className="text-gray-600 mb-3 sm:mb-4 leading-relaxed text-sm sm:text-base px-2">Optimisez votre gestion avec notre CRM immobilier complet</p>

              <div className="space-y-1.5 sm:space-y-2 text-left text-xs sm:text-sm">
                <div className="flex items-center text-gray-600">
                  <Building2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-purple-500" />
                  <span>Portfolio multi-biens</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-purple-500" />
                  <span>Gestion des locataires</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-purple-500" />
                  <span>Suivi des mandats</span>
                </div>
              </div>

              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-purple-200">
                <div className="flex items-center justify-center text-purple-600 font-medium group-hover:text-purple-700 text-sm">
                  <span>Découvrir le CRM</span>
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Section statistiques de confiance */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 sm:p-6 rounded-xl mb-4 sm:mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-center">
            <div>
              <div className="text-xl sm:text-2xl font-bold text-blue-600">500+</div>
              <div className="text-xs sm:text-sm text-gray-600">Biens vérifiés</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-orange-600">10K+</div>
              <div className="text-xs sm:text-sm text-gray-600">Utilisateurs</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-purple-600">48h</div>
              <div className="text-xs sm:text-sm text-gray-600">Temps moyen</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-green-600">98%</div>
              <div className="text-xs sm:text-sm text-gray-600">Satisfaction</div>
            </div>
          </div>
        </div>

        <div className="border-t pt-4 sm:pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="ghost"
              className="flex-1 h-10 sm:h-12 text-sm sm:text-base font-medium hover:bg-gray-100 transition-colors"
              onClick={handleClose}
            >
              Explorer sans compte
            </Button>
            <Button
              className="flex-1 h-10 sm:h-12 text-sm sm:text-base font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
              onClick={handleClose}
            >
              Créer mon compte
            </Button>
          </div>
          <p className="text-center text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4 px-2">
            Rejoignez +10,000 Ivoiriens qui font confiance à Mon Toit ✨
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;
