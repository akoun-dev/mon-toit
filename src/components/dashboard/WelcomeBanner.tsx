import { useAuth } from "@/hooks/useAuth";
import { LazyIllustration } from "@/components/illustrations/LazyIllustration";
import { getIllustrationPath } from "@/lib/utils";
import { type IllustrationKey } from "@/assets/illustrations/ivorian/illustrationPaths";

export const WelcomeBanner = () => {
  const { profile } = useAuth();

  if (!profile) return null;

  const roleConfig: Record<string, { illustration: IllustrationKey; message: string }> = {
    locataire: {
      illustration: "apartment-visit",
      message: "Trouvez votre logement idéal en Côte d'Ivoire"
    },
    proprietaire: {
      illustration: "ivorian-family-house",
      message: "Gérez vos biens en toute simplicité"
    },
    agence: {
      illustration: "real-estate-agent",
      message: "Développez votre activité immobilière"
    }
  };

  const config = roleConfig[profile.user_type] || roleConfig["locataire"];
  const illustrationPath = getIllustrationPath(config.illustration);

  return (
    <div className="relative overflow-hidden rounded-lg sm:rounded-xl lg:rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/5 to-background border border-border/50 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-[1fr,200px] lg:grid-cols-[1fr,250px] xl:grid-cols-[1fr,300px] gap-3 sm:gap-4 md:gap-6 p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="space-y-1 sm:space-y-2 md:space-y-3">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground">
            Bienvenue, {profile.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
            {config.message}
          </p>
        </div>

        <LazyIllustration
          src={illustrationPath}
          alt="Illustration dashboard"
          className="hidden md:block w-full h-[120px] lg:h-[150px] xl:h-[200px] rounded-lg"
          animate={true}
        />
      </div>
    </div>
  );
};
