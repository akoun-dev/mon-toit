import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Shield, Lock, FileCheck, Users } from "lucide-react";
import { LazyIllustration } from "@/components/illustrations/LazyIllustration";
import { getIllustrationPath } from "@/lib/utils";
import { BogolanPattern } from "@/components/ui/african-patterns";

const Confiance = () => {
  const features = [
    {
      icon: Shield,
      title: "Vérification d'identité",
      description: "Tous les utilisateurs sont vérifiés via Smile ID pour garantir l'authenticité des profils.",
    },
    {
      icon: Lock,
      title: "Transactions sécurisées",
      description: "Paiements cryptés (AES-256) et conformes aux normes bancaires burkinabè.",
    },
    {
      icon: FileCheck,
      title: "Validation des annonces",
      description: "Chaque bien est vérifié par l'équipe DONIA avant publication.",
    },
    {
      icon: Users,
      title: "Conformité légale",
      description: "Respect de la législation burkinabè sur la protection des données.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24">
        {/* Hero with illustration */}
        <section className="relative h-96 overflow-hidden mb-12">
          <LazyIllustration 
            src={getIllustrationPath('verification-donia-illustration')!}
            alt="DONIA - Plateforme de confiance"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/80 flex items-center justify-center">
            <div className="container mx-auto px-4 text-center text-white">
              <h1 className="text-h1 mb-4">
                <span className="text-gradient-animated">DONIA, une plateforme de confiance</span>
              </h1>
              <p className="text-lg max-w-2xl mx-auto opacity-95">
                Vérification d'identité, sécurité des transactions, et protection des données 
                pour tous vos projets immobiliers au Burkina Faso.
              </p>
            </div>
          </div>
        </section>

        <section className="py-6 md:py-10">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="bg-gradient-primary/10 border-2 border-primary/20 rounded-xl p-8 mb-12">
              <h2 className="text-2xl font-bold mb-4">Qu'est-ce que DONIA ?</h2>
              <p className="text-muted-foreground mb-4">
                DONIA est une plateforme immobilière privée dédiée à révolutionner le marché 
                de la location au Burkina Faso. Notre mission est de créer un environnement 
                sécurisé, transparent et efficace pour tous les acteurs de l'immobilier.
              </p>
              <p className="text-muted-foreground">
                Nous nous engageons à protéger vos données personnelles, vérifier l'authenticité 
                de chaque annonce et garantir la sécurité de vos transactions financières.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="bg-card border border-border rounded-xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-gradient-primary shrink-0">
                        <Icon className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-muted/50 rounded-xl p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Une plateforme 100% burkinabè</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Développée au Burkina Faso, pour les Burkinabè. DONIA s'adapte aux réalités 
                locales et propose des solutions de paiement compatibles avec Mobile Money 
                (Orange Money, Moov Africa).
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Confiance;
