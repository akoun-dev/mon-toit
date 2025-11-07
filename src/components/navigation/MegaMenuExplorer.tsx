import { NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink } from "@/components/ui/navigation-menu";
import { Link } from "react-router-dom";
import { Search, Map, Home, Building2, MapPin, DollarSign, ShieldCheck } from "lucide-react";

export const MegaMenuExplorer = () => {
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className="text-sm font-medium">
        <Search className="mr-2 h-4 w-4" />
        Explorer
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className="grid gap-4 p-6 w-[600px] md:w-[700px] grid-cols-2 bg-background border border-border shadow-xl rounded-lg">
          {/* Colonne 1: Recherche rapide */}
          <div>
            <h4 className="text-sm font-semibold text-primary mb-3">
              Recherche rapide
            </h4>
            <ul className="space-y-2">
              <li>
                <NavigationMenuLink asChild>
                  <Link to="/explorer" className="block p-2 hover:bg-accent rounded-md transition-colors">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-primary" />
                      <span className="text-sm">Tous les biens</span>
                    </div>
                  </Link>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link to="/carte-intelligente" className="block p-2 hover:bg-accent rounded-md transition-colors">
                    <div className="flex items-center gap-2">
                      <Map className="h-4 w-4 text-primary" />
                      <span className="text-sm">Carte interactive</span>
                    </div>
                  </Link>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link to="/explorer?verified=true" className="block p-2 hover:bg-accent rounded-md transition-colors">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      <span className="text-sm">Biens vérifiés DONIA</span>
                    </div>
                  </Link>
                </NavigationMenuLink>
              </li>
            </ul>
          </div>

          {/* Colonne 2: Types de biens */}
          <div>
            <h4 className="text-sm font-semibold text-primary mb-3">
              Types de biens
            </h4>
            <ul className="space-y-2">
              <li>
                <NavigationMenuLink asChild>
                  <Link to="/explorer?type=appartement" className="block p-2 hover:bg-accent rounded-md transition-colors">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span className="text-sm">Appartements</span>
                    </div>
                  </Link>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link to="/explorer?type=maison" className="block p-2 hover:bg-accent rounded-md transition-colors">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-primary" />
                      <span className="text-sm">Maisons</span>
                    </div>
                  </Link>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link to="/explorer?type=studio" className="block p-2 hover:bg-accent rounded-md transition-colors">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="text-sm">Studios</span>
                    </div>
                  </Link>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link to="/explorer?type=villa" className="block p-2 hover:bg-accent rounded-md transition-colors">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span className="text-sm">Villas</span>
                    </div>
                  </Link>
                </NavigationMenuLink>
              </li>
            </ul>
          </div>
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
};
