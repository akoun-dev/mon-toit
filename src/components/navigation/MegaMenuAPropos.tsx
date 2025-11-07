import { NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink } from "@/components/ui/navigation-menu";
import { Link } from "react-router-dom";
import { Info, Target, Handshake, DollarSign, Mail, Phone } from "lucide-react";

export const MegaMenuAPropos = () => {
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className="text-sm font-medium">
        <Info className="mr-2 h-4 w-4" />
        À propos
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className="grid gap-4 p-6 w-[500px] grid-cols-2 bg-background border border-border shadow-xl rounded-lg">
          {/* Colonne 1: Qui sommes-nous */}
          <div>
            <h4 className="text-sm font-semibold text-primary mb-3">
              Qui sommes-nous ?
            </h4>
            <ul className="space-y-2">
              <li>
                <NavigationMenuLink asChild>
                  <Link to="/a-propos" className="block p-2 hover:bg-accent rounded-md transition-colors">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-primary" />
                      <span className="text-sm">À propos de DONIA</span>
                    </div>
                  </Link>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link to="/a-propos#mission" className="block p-2 hover:bg-accent rounded-md transition-colors">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="text-sm">Notre mission</span>
                    </div>
                  </Link>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link to="/a-propos#partenaires" className="block p-2 hover:bg-accent rounded-md transition-colors">
                    <div className="flex items-center gap-2">
                      <Handshake className="h-4 w-4 text-primary" />
                      <span className="text-sm">Nos partenaires</span>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6 mt-1">
                      Infosec Burkina, Faso Arzeka
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link to="/tarifs" className="block p-2 hover:bg-accent rounded-md transition-colors">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="text-sm">Tarifs et plans</span>
                    </div>
                  </Link>
                </NavigationMenuLink>
              </li>
            </ul>
          </div>

          {/* Colonne 2: Contact */}
          <div>
            <h4 className="text-sm font-semibold text-primary mb-3">
              Nous contacter
            </h4>
            <ul className="space-y-2">
              <li>
                <NavigationMenuLink asChild>
                  <Link to="/contact" className="block p-2 hover:bg-accent rounded-md transition-colors">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <span className="text-sm">Formulaire de contact</span>
                    </div>
                  </Link>
                </NavigationMenuLink>
              </li>
              <li className="px-2 py-2">
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3 text-primary mt-0.5" />
                  <span>contact@donia.bf</span>
                </div>
              </li>
            </ul>

            <div className="mt-4 pt-4 border-t border-border">
              <h5 className="text-xs font-semibold text-muted-foreground mb-2">
                Légal
              </h5>
              <ul className="space-y-1">
                <li>
                  <NavigationMenuLink asChild>
                    <Link to="/confidentialite" className="block text-xs text-muted-foreground hover:text-primary p-1">
                      Confidentialité
                    </Link>
                  </NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink asChild>
                    <Link to="/mentions-legales" className="block text-xs text-muted-foreground hover:text-primary p-1">
                      Mentions légales
                    </Link>
                  </NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink asChild>
                    <Link to="/conditions" className="block text-xs text-muted-foreground hover:text-primary p-1">
                      Conditions d'utilisation
                    </Link>
                  </NavigationMenuLink>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
};
