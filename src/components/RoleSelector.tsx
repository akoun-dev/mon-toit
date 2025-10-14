import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Home, Key, Building2, ArrowRight } from "lucide-react";

const RoleSelector = () => {
  const roles = [
    {
      type: "locataire",
      icon: Home,
      title: "Locataire",
      description: "Trouvez le logement de vos rêves",
      benefits: "Recherche simplifiée, alertes personnalisées, dossier sécurisé",
      color: "from-primary/20 to-primary/5",
      iconColor: "text-primary",
      hoverColor: "hover:border-primary/50",
      bgGradient: "from-primary/10 via-primary/5 to-transparent",
    },
    {
      type: "proprietaire",
      icon: Key,
      title: "Propriétaire",
      description: "Gérez et louez votre bien facilement",
      benefits: "Publication gratuite, outils de gestion, suivi locataires",
      color: "from-secondary/20 to-secondary/5",
      iconColor: "text-secondary",
      hoverColor: "hover:border-secondary/50",
      bgGradient: "from-secondary/10 via-secondary/5 to-transparent",
    },
    {
      type: "agence",
      icon: Building2,
      title: "Agence Immobilière",
      description: "Solution complète pour professionnels",
      benefits: "Dashboard avancé, multi-propriétés, reporting détaillé",
      color: "from-accent/20 to-accent/5",
      iconColor: "text-accent-foreground",
      hoverColor: "hover:border-accent/50",
      bgGradient: "from-accent/10 via-accent/5 to-transparent",
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight animate-fade-in">
            Qui êtes-vous ?
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto animate-fade-in">
            Choisissez votre profil pour accéder à une expérience personnalisée et des fonctionnalités adaptées
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {roles.map((role, index) => {
            const Icon = role.icon;
            return (
              <Link 
                key={role.type} 
                to={`/auth?type=${role.type}`}
                className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl block animate-fade-in"
                aria-label={`S'inscrire en tant que ${role.title}`}
                style={{ 
                  animationDelay: `${index * 150}ms`,
                }}
              >
                <Card className={`h-full transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 cursor-pointer border-2 ${role.hoverColor} relative overflow-hidden`}>
                  {/* Fond graduel animé au hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${role.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  
                  <CardContent className="p-8 relative z-10">
                    {/* Icône avec animation */}
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${role.color} flex items-center justify-center mb-6 mx-auto group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg`}>
                      <Icon className={`h-10 w-10 ${role.iconColor} group-hover:scale-110 transition-transform duration-300`} />
                    </div>
                    
                    {/* Contenu */}
                    <div className="space-y-4 text-center">
                      <h3 className="text-2xl font-bold tracking-tight">
                        {role.title}
                      </h3>
                      <p className="text-muted-foreground font-medium">
                        {role.description}
                      </p>
                      <p className="text-sm text-muted-foreground/80">
                        {role.benefits}
                      </p>
                      
                      {/* Bouton CTA */}
                      <div className="pt-4 flex items-center justify-center gap-2 text-primary font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                        <span>Commencer</span>
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </CardContent>
                  
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Section d'aide */}
        <div className="text-center mt-12 animate-fade-in" style={{ animationDelay: '600ms' }}>
          <p className="text-sm text-muted-foreground">
            Vous ne savez pas quel profil choisir ?{" "}
            <Link 
              to="/a-propos" 
              className="text-primary font-medium hover:underline transition-all"
            >
              Consultez notre guide
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
};

export default RoleSelector;
