import { useState, useEffect } from "react";
import { LazyIllustration } from "@/components/illustrations/LazyIllustration";
import { illustrationPaths, type IllustrationKey } from "@/assets/illustrations/ivorian/illustrationPaths";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Download, Image as ImageIcon, Home, Users, Building2, Sparkles, Search, Loader2, X, Eye } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

type CategoryFilter = "all" | "interior" | "exterior" | "people";

const illustrations = [
  { 
    key: "ivorian-family-house" as IllustrationKey, 
    title: "Famille et Maison Ivoirienne",
    description: "Scène familiale chaleureuse devant une maison traditionnelle",
    category: "people" as const,
    tags: ["Famille", "Tradition", "Accueil"]
  },
  { 
    key: "apartment-visit" as IllustrationKey, 
    title: "Visite d'Appartement",
    description: "Agent immobilier présentant un logement moderne à un couple",
    category: "people" as const,
    tags: ["Visite", "Location", "Service"]
  },
  { 
    key: "real-estate-agent" as IllustrationKey, 
    title: "Agent Immobilier Certifié",
    description: "Professionnel ANSUT accompagnant ses clients",
    category: "people" as const,
    tags: ["Professionnel", "ANSUT", "Confiance"]
  },
  { 
    key: "abidjan-neighborhood" as IllustrationKey, 
    title: "Quartier d'Abidjan",
    description: "Vue sur un quartier résidentiel dynamique d'Abidjan",
    category: "exterior" as const,
    tags: ["Urbain", "Abidjan", "Quartier"]
  },
  { 
    key: "modern-living-room" as IllustrationKey, 
    title: "Salon Moderne",
    description: "Intérieur contemporain avec décoration ivoirienne",
    category: "interior" as const,
    tags: ["Moderne", "Décoration", "Confort"]
  },
  { 
    key: "abidjan-skyline" as IllustrationKey, 
    title: "Skyline d'Abidjan",
    description: "Horizon emblématique du Plateau au coucher du soleil",
    category: "exterior" as const,
    tags: ["Plateau", "Skyline", "Urbain"]
  },
  { 
    key: "key-handover" as IllustrationKey, 
    title: "Remise de Clés",
    description: "Moment symbolique de la signature du bail",
    category: "people" as const,
    tags: ["Signature", "Succès", "Bail"]
  },
  { 
    key: "family-moving" as IllustrationKey, 
    title: "Famille en Déménagement",
    description: "Installation dans un nouveau logement avec joie",
    category: "people" as const,
    tags: ["Déménagement", "Nouveau départ", "Famille"]
  },
  { 
    key: "co-ownership-meeting" as IllustrationKey, 
    title: "Réunion de Copropriété",
    description: "Assemblée professionnelle de gestion immobilière",
    category: "people" as const,
    tags: ["Gestion", "Professionnel", "Communauté"]
  },
  { 
    key: "certification-ansut-illustration" as IllustrationKey, 
    title: "Certification ANSUT",
    description: "Symbole de confiance et de sécurité immobilière",
    category: "people" as const,
    tags: ["ANSUT", "Certification", "Sécurité"]
  },
];

const Illustrations = () => {
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchViewCounts = async () => {
      const { data } = await supabase
        .from('illustration_analytics')
        .select('illustration_key, view_count');

      if (data) {
        const counts = data.reduce((acc, item) => {
          acc[item.illustration_key] = item.view_count || 0;
          return acc;
        }, {} as Record<string, number>);
        setViewCounts(counts);
      }
    };

    fetchViewCounts();
  }, []);

  const allTags = Array.from(new Set(illustrations.flatMap(ill => ill.tags)));

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setFilter("all");
    setSelectedTags([]);
    setSearchQuery("");
  };

  const trackView = async (illustrationKey: string) => {
    await supabase.rpc('track_illustration_view', {
      p_illustration_key: illustrationKey
    });
  };

  const trackDownload = async (illustrationKey: string) => {
    await supabase.rpc('track_illustration_download', {
      p_illustration_key: illustrationKey
    });
  };

  const downloadImage = async (key: IllustrationKey, title: string) => {
    try {
      const path = illustrationPaths[key];
      if (!path) return;

      const response = await fetch(path);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${key}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      await trackDownload(key);
      toast.success(`${title} téléchargée avec succès`);
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  const downloadAllImages = async () => {
    setDownloading(true);
    toast.info('Téléchargement de toutes les illustrations...');

    try {
      for (const illustration of filteredIllustrations) {
        await downloadImage(illustration.key, illustration.title);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      toast.success('Toutes les illustrations ont été téléchargées');
    } catch (error) {
      toast.error('Erreur lors du téléchargement groupé');
    } finally {
      setDownloading(false);
    }
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
    const illustration = filteredIllustrations[index];
    trackView(illustration.key);
  };

  const filteredIllustrations = illustrations.filter(ill => {
    const matchesCategory = filter === "all" || ill.category === filter;
    const matchesSearch = searchQuery === "" ||
      ill.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ill.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags = selectedTags.length === 0 ||
      selectedTags.some(tag => ill.tags.includes(tag));

    return matchesCategory && matchesSearch && matchesTags;
  });

  const lightboxSlides = filteredIllustrations.map(ill => ({
    src: illustrationPaths[ill.key] || '',
    title: ill.title,
    description: ill.description
  }));

  const activeFiltersCount = (filter !== "all" ? 1 : 0) + selectedTags.length + (searchQuery ? 1 : 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 pattern-bogolan opacity-5" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4 animate-fade-in">
              <Sparkles className="h-3 w-3 mr-1" />
              10 Illustrations Exclusives
            </Badge>
            <h1 className="text-h1 font-bold mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent animate-fade-in">
              Galerie d'Illustrations Ivoiriennes
            </h1>
            <p className="text-body-lg text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in">
              Découvrez notre collection exclusive d'illustrations représentant la vie immobilière en Côte d'Ivoire. 
              Chaque image raconte une histoire de confiance, de modernité et de tradition.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">10</div>
                <div className="text-sm text-muted-foreground">Illustrations</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent mb-1">100%</div>
                <div className="text-sm text-muted-foreground">Ivoiriennes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary mb-1">WebP</div>
                <div className="text-sm text-muted-foreground">Optimisées</div>
              </div>
            </div>

            {/* Hero Illustration */}
            <div className="relative max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-elegant animate-float-smooth">
              <LazyIllustration
                src={illustrationPaths["abidjan-skyline"]}
                alt="Skyline d'Abidjan au coucher du soleil"
                className="h-[400px] w-full"
                animate={true}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-center pb-8">
                <h2 className="text-2xl font-bold text-white">Skyline d'Abidjan</h2>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="border-b border-border bg-muted/20 sticky top-16 z-30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 space-y-4">
          {/* Search and Download */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher par titre ou description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={downloadAllImages}
              disabled={downloading || filteredIllustrations.length === 0}
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Télécharger tout ({filteredIllustrations.length})
            </Button>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
                className="gap-2"
              >
                <ImageIcon className="h-4 w-4" />
                Toutes ({illustrations.length})
              </Button>
              <Button
                variant={filter === "interior" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("interior")}
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                Intérieurs ({illustrations.filter(i => i.category === "interior").length})
              </Button>
              <Button
                variant={filter === "exterior" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("exterior")}
                className="gap-2"
              >
                <Building2 className="h-4 w-4" />
                Extérieurs ({illustrations.filter(i => i.category === "exterior").length})
              </Button>
              <Button
                variant={filter === "people" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("people")}
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                Personnes ({illustrations.filter(i => i.category === "people").length})
              </Button>
            </div>

            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-2 text-muted-foreground"
              >
                <X className="h-3 w-3" />
                Effacer les filtres ({activeFiltersCount})
              </Button>
            )}
          </div>

          {/* Tag Filters */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground self-center mr-2">Tags:</span>
              {allTags.map(tag => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer transition-all hover:scale-105"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredIllustrations.map((illustration, index) => (
              <Card
                key={illustration.key}
                className={cn(
                  "illustration-card group overflow-hidden border-2 transition-all duration-500 hover:shadow-elegant hover:border-primary/50",
                  "animate-fade-in cursor-pointer"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
                onMouseEnter={() => setHoveredCard(illustration.key)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <CardContent className="p-0">
                  {/* Image */}
                  <div
                    className="relative h-64 overflow-hidden"
                    onClick={() => openLightbox(index)}
                  >
                    <LazyIllustration
                      src={illustrationPaths[illustration.key]}
                      alt={illustration.title}
                      className="h-full w-full illustration-bg"
                      animate={true}
                    />
                    <div className="illustration-overlay" />

                    {/* View Count Badge */}
                    {viewCounts[illustration.key] > 0 && (
                      <Badge
                        variant="secondary"
                        className="absolute top-3 right-3 bg-black/60 text-white backdrop-blur-sm"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        {viewCounts[illustration.key]}
                      </Badge>
                    )}
                    
                    {/* Overlay Info */}
                    <div className={cn(
                      "absolute inset-0 flex flex-col justify-end p-6 transition-all duration-300",
                      hoveredCard === illustration.key ? "opacity-100" : "opacity-0"
                    )}>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {illustration.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs bg-white/90 text-foreground">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-6">
                    <h3 className="font-semibold text-lg mb-2 text-foreground group-hover:text-primary transition-colors">
                      {illustration.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {illustration.description}
                    </p>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadImage(illustration.key, illustration.title);
                      }}
                    >
                      <Download className="h-3 w-3" />
                      Télécharger
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredIllustrations.length === 0 && (
            <div className="text-center py-16">
              <ImageIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
              <h3 className="text-lg font-semibold mb-2">Aucune illustration trouvée</h3>
              <p className="text-muted-foreground mb-4">
                Essayez de modifier vos critères de recherche ou de filtrage
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Réinitialiser les filtres
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={lightboxSlides}
        index={lightboxIndex}
        on={{
          view: ({ index }) => {
            const illustration = filteredIllustrations[index];
            if (illustration) {
              trackView(illustration.key);
            }
          }
        }}
      />

      {/* Playground Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-h2 font-bold text-center mb-4">
              Playground Animations
            </h2>
            <p className="text-center text-muted-foreground mb-12">
              Expérimentez avec nos animations CSS optimisées pour une expérience fluide.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Fade In Up */}
              <Card className="p-6 text-center">
                <div className="h-32 bg-primary/10 rounded-lg mb-4 flex items-center justify-center animate-fade-in-up">
                  <Home className="h-12 w-12 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">Fade In Up</h4>
                <code className="text-xs text-muted-foreground">animate-fade-in-up</code>
              </Card>
              
              {/* Float Smooth */}
              <Card className="p-6 text-center">
                <div className="h-32 bg-accent/10 rounded-lg mb-4 flex items-center justify-center animate-float-smooth">
                  <Building2 className="h-12 w-12 text-accent" />
                </div>
                <h4 className="font-semibold mb-2">Float Smooth</h4>
                <code className="text-xs text-muted-foreground">animate-float-smooth</code>
              </Card>
              
              {/* Scale Smooth */}
              <Card className="p-6 text-center">
                <div className="h-32 bg-secondary/10 rounded-lg mb-4 flex items-center justify-center hover:scale-105 transition-transform duration-300">
                  <Users className="h-12 w-12 text-secondary" />
                </div>
                <h4 className="font-semibold mb-2">Scale on Hover</h4>
                <code className="text-xs text-muted-foreground">hover:scale-105</code>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto p-8 text-center bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/20">
            <Download className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h2 className="text-h2 font-bold mb-4">
              Télécharger Toutes les Illustrations
            </h2>
            <p className="text-muted-foreground mb-6">
              Obtenez l'ensemble complet des 10 illustrations optimisées en WebP et PNG dans une archive ZIP.
            </p>
            <Button
              size="lg"
              className="gap-2 shadow-lg hover:shadow-xl"
              onClick={downloadAllImages}
              disabled={downloading}
            >
              {downloading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Download className="h-5 w-5" />
              )}
              {downloading ? 'Téléchargement...' : `Télécharger l'Archive Complète (${illustrations.length} images)`}
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Formats inclus : WebP (optimisé) + PNG (fallback) • Licence : Usage interne Mon Toit
            </p>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Illustrations;
