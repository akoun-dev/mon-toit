import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, CheckCircle2, Mic, MicOff } from "lucide-react";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";
import heroFamilyHome from "@/assets/hero/hero-family-home.jpg";

const Hero = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { isListening, transcript, isSupported, startListening, stopListening } = useVoiceSearch();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/recherche?location=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/recherche');
    }
  };

  const handleQuickSearch = (location: string) => {
    navigate(`/recherche?location=${encodeURIComponent(location)}`);
  };

  const toggleVoiceSearch = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Update search query when voice transcript changes
  useState(() => {
    if (transcript) {
      setSearchQuery(transcript);
    }
  });

  return (
    <section className="hero-section relative min-h-[700px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-white via-primary/5 to-secondary/5 pattern-bogolan">
      {/* Fixed Background Image - Right Side */}
      <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden lg:block">
        <img
          src={heroFamilyHome}
          alt="Famille ivoirienne heureuse devant sa nouvelle maison"
          className="w-full h-full object-cover animate-float"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-6 sm:px-8 md:px-4 py-20 md:py-28 max-w-7xl z-10 animate-fade-in">
        <div className="max-w-2xl lg:max-w-xl animate-fade-in-slow">
          {/* Badge Gratuit */}
          <div className="inline-flex items-center gap-2 bg-secondary/10 border-2 border-secondary px-4 py-2 rounded-full mb-6">
            <CheckCircle2 className="h-5 w-5 text-secondary" />
            <span className="text-sm font-bold text-secondary uppercase tracking-wide">
              100% Gratuit pour locataires
            </span>
          </div>

          {/* Small decorative line */}
          <div className="mb-6 w-20 h-1 bg-gradient-to-r from-primary to-secondary rounded-full" />
          
          {/* Main Title - Bold and Large */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-6 text-foreground leading-tight tracking-tight">
            Votre logement{" "}
            <span className="block mt-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              en toute sécurité
            </span>
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-10 max-w-xl font-medium">
            <span className="text-foreground font-semibold">Trouvez, louez ou publiez votre logement</span> en toute confiance avec la première plateforme certifiée ANSUT en Côte d'Ivoire.
          </p>

          {/* Search bar rapide */}
          <div className="relative max-w-2xl mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Cocody, Yopougon, Marcory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-12 pr-14 h-14 text-lg border-2 border-primary/20 focus:border-primary rounded-full"
            />
            {isSupported && (
              <button
                onClick={toggleVoiceSearch}
                className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${
                  isListening 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'bg-primary/10 text-primary hover:bg-primary/20'
                }`}
                aria-label={isListening ? "Arrêter la recherche vocale" : "Recherche vocale"}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
            )}
          </div>

          {/* Primary CTA + Secondary Link */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <Button 
              size="lg" 
              className="h-14 px-10 text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300 bg-secondary hover:bg-secondary/90 text-white rounded-full inline-flex items-center gap-2"
              onClick={handleSearch}
            >
              <Search className="h-5 w-5" />
              Je cherche un logement
            </Button>
            
            <Link 
              to="/auth?type=proprietaire" 
              className="text-primary hover:text-primary/80 font-semibold underline underline-offset-4 transition-colors"
            >
              Je suis propriétaire
            </Link>
          </div>

          {/* Recherches rapides */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Populaire :</span>
            {['Cocody', 'Yopougon', 'Marcory', 'Plateau'].map((location) => (
              <Button
                key={location}
                onClick={() => handleQuickSearch(location)}
                variant="outline"
                size="sm"
                className="rounded-full border-primary/30 hover:bg-primary hover:text-white transition-all font-medium"
              >
                {location}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
