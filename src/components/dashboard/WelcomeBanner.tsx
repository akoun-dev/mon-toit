import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from 'react-i18next';
import { LazyIllustration } from "@/components/illustrations/LazyIllustration";
import { getIllustrationPath } from "@/lib/utils";
import { type IllustrationKey } from "@/assets/illustrations/ivorian/illustrationPaths";

export const WelcomeBanner = () => {
  const { profile } = useAuth();
  const { t } = useTranslation('dashboard');

  if (!profile) return null;

  const roleConfig: Record<string, { illustration: IllustrationKey; messageKey: string }> = {
    locataire: {
      illustration: "apartment-visit",
      messageKey: "tenant.message"
    },
    proprietaire: {
      illustration: "ivorian-family-house",
      messageKey: "owner.message"
    },
    agence: {
      illustration: "real-estate-agent",
      messageKey: "agency.message"
    }
  };

  const config = roleConfig[profile.user_type || "locataire"];
  const illustrationPath = getIllustrationPath(config.illustration);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/5 to-background border border-border/50 shadow-sm">
      <div className="grid md:grid-cols-[1fr,300px] gap-6 p-6 md:p-8">
        <div className="space-y-3">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {t('welcome', { name: profile.full_name?.split(' ')[0] })}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t(config.messageKey)}
          </p>
        </div>
        
        <LazyIllustration
          src={illustrationPath}
          alt="Illustration dashboard"
          className="hidden md:block w-full h-[200px] rounded-xl"
          animate={true}
        />
      </div>
    </div>
  );
};
