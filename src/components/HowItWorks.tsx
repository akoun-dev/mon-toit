import { User, Home, Building2, ShieldCheck, FileCheck, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { LazyIllustration } from "@/components/illustrations/LazyIllustration";
import { getIllustrationPath } from "@/lib/utils";

const journeys = [
  {
    icon: User,
    title: "Locataire",
    color: "from-blue-500 to-blue-600",
    illustrationKey: 'apartment-visit' as const,
    steps: [
      {
        number: "1",
        icon: User,
        title: "Créez votre profil",
        description: "Inscrivez-vous et complétez vos informations personnelles"
      },
      {
        number: "2",
        icon: ShieldCheck,
        title: "Faites-vous certifier ANSUT",
        description: "Vérification biométrique et constitution de votre dossier digital"
      },
      {
        number: "3",
        icon: FileCheck,
        title: "Postulez en 1 clic",
        description: "Candidatez aux biens avec votre profil certifié"
      }
    ],
    cta: {
      text: "Créer mon profil locataire",
      link: "/auth?type=tenant"
    }
  },
  {
    icon: Home,
    title: "Propriétaire",
    color: "from-primary to-primary-600",
    illustrationKey: 'modern-living-room' as const,
    steps: [
      {
        number: "1",
        icon: Home,
        title: "Publiez votre bien",
        description: "Ajoutez photos, description et caractéristiques"
      },
      {
        number: "2",
        icon: User,
        title: "Recevez des candidatures certifiées",
        description: "Ne traitez que des dossiers vérifiés avec scoring"
      },
      {
        number: "3",
        icon: Wallet,
        title: "Signez & encaissez en ligne",
        description: "Bail digital + paiements Mobile Money sécurisés"
      }
    ],
    cta: {
      text: "Publier un bien",
      link: "/publier"
    }
  },
  {
    icon: Building2,
    title: "Agence",
    color: "from-secondary to-secondary-600",
    illustrationKey: 'co-ownership-meeting' as const,
    steps: [
      {
        number: "1",
        icon: Building2,
        title: "Créez votre profil d'agence",
        description: "Inscription professionnelle avec documents officiels"
      },
      {
        number: "2",
        icon: Home,
        title: "Gérez plusieurs propriétés",
        description: "Tableau de bord centralisé pour tous vos biens"
      },
      {
        number: "3",
        icon: FileCheck,
        title: "Signez des contrats digitaux",
        description: "Automatisez la gestion locative de A à Z"
      }
    ],
    cta: {
      text: "Créer mon compte agence",
      link: "/auth?type=agency"
    }
  }
];

const HowItWorks = () => {
  return (
    <section id="comment-ca-marche" className="py-24 md:py-32 bg-gradient-to-br from-primary/5 via-background to-secondary/5 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-0" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -z-0" />
      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">Comment ça marche ?</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Choisissez votre parcours et découvrez comment Mon Toit simplifie vos démarches immobilières
          </p>
        </div>

        <Tabs defaultValue="tenant" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-12 h-auto bg-white/80 backdrop-blur-sm shadow-md border border-primary/10">
            <TabsTrigger value="tenant" className="flex items-center gap-2 py-4 text-base">
              <User className="h-5 w-5" />
              <span className="hidden sm:inline">Locataire</span>
            </TabsTrigger>
            <TabsTrigger value="owner" className="flex items-center gap-2 py-4 text-base">
              <Home className="h-5 w-5" />
              <span className="hidden sm:inline">Propriétaire</span>
            </TabsTrigger>
            <TabsTrigger value="agency" className="flex items-center gap-2 py-4 text-base">
              <Building2 className="h-5 w-5" />
              <span className="hidden sm:inline">Agence</span>
            </TabsTrigger>
          </TabsList>

          {journeys.map((journey, journeyIndex) => {
            const tabValue = journeyIndex === 0 ? "tenant" : journeyIndex === 1 ? "owner" : "agency";
            const JourneyIcon = journey.icon;
            const borderColor = 
              journeyIndex === 0 ? "border-l-blue-600" : 
              journeyIndex === 1 ? "border-l-primary" : 
              "border-l-secondary";
            const iconBgColor = 
              journeyIndex === 0 ? "bg-blue-600" : 
              journeyIndex === 1 ? "bg-primary" : 
              "bg-secondary";

            return (
              <TabsContent key={journeyIndex} value={tabValue} className="mt-0">
                {/* Illustration Header */}
                <div className="mb-8 relative h-48 rounded-lg overflow-hidden shadow-xl">
                  <LazyIllustration 
                    src={getIllustrationPath(journey.illustrationKey)!}
                    alt={journey.title}
                    className="w-full h-full object-cover"
                    animate={true}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center p-6">
                    <div className="text-white">
                      <h3 className="text-3xl font-bold">{journey.title}</h3>
                      <p className="text-sm opacity-90">Votre parcours en 3 étapes</p>
                    </div>
                  </div>
                </div>
                
                <div className={`bg-gradient-to-br from-white to-gray-50/30 rounded-lg border-l-4 ${borderColor} shadow-lg hover:shadow-xl transition-all duration-300 p-8 md:p-12 backdrop-blur-sm`}>
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-10">
                    <div className={`${iconBgColor} p-3 rounded-full`}>
                      <JourneyIcon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground">{journey.title}</h3>
                  </div>

                  {/* Steps */}
                  <div className="space-y-8 mb-10">
                    {journey.steps.map((step, stepIndex) => {
                      const StepIcon = step.icon;
                      return (
                        <div key={stepIndex} className="flex gap-6">
                          <div className="flex-shrink-0">
                            <div className={`w-12 h-12 ${iconBgColor} rounded-full flex items-center justify-center text-white font-bold text-lg`}>
                              {step.number}
                            </div>
                          </div>
                          <div className="flex-1 pt-2">
                            <div className="flex items-center gap-2 mb-2">
                              <StepIcon className="h-5 w-5 text-primary" />
                              <h4 className="font-bold text-lg text-foreground">{step.title}</h4>
                            </div>
                            <p className="text-muted-foreground leading-relaxed">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* CTA */}
                  <div className="flex justify-center md:justify-start">
                    <Button asChild size="lg" className="px-8">
                      <Link to={journey.cta.link}>{journey.cta.text}</Link>
                    </Button>
                  </div>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </section>
  );
};

export default HowItWorks;
