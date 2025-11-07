import { NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink } from "@/components/ui/navigation-menu";
import { Link } from "react-router-dom";
import { PlusCircle, FileText, Building, Lightbulb, CheckCircle } from "lucide-react";

export const MegaMenuPublier = () => {
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className="text-sm font-medium">
        <PlusCircle className="mr-2 h-4 w-4" />
        Publier
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className="grid gap-4 p-6 w-[500px] grid-cols-2 bg-background border border-border shadow-xl rounded-lg">
          {/* Colonne 1: Actions */}
          <div>
            <h4 className="text-sm font-semibold text-primary mb-3">
              Gérer mes biens
            </h4>
            <ul className="space-y-2">
              <li>
                <NavigationMenuLink asChild>
                  <Link to="/publier" className="block p-2 hover:bg-accent rounded-md transition-colors">
                    <div className="flex items-center gap-2">
                      <PlusCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm">Publier une annonce</span>
                    </div>
                  </Link>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link to="/mes-biens" className="block p-2 hover:bg-accent rounded-md transition-colors">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-sm">Mes annonces</span>
                    </div>
                  </Link>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link to="/dashboard/agence" className="block p-2 hover:bg-accent rounded-md transition-colors">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-primary" />
                      <span className="text-sm">Compte agence</span>
                    </div>
                  </Link>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link to="/my-mandates" className="block p-2 hover:bg-accent rounded-md transition-colors">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-sm">Gérer mes mandats</span>
                    </div>
                  </Link>
                </NavigationMenuLink>
              </li>
            </ul>
          </div>

          {/* Colonne 2: Ressources */}
          <div>
            <h4 className="text-sm font-semibold text-primary mb-3">
              Ressources
            </h4>
            <ul className="space-y-2">
              <li>
                <NavigationMenuLink asChild>
                  <Link to="/guide#publier" className="block p-2 hover:bg-accent rounded-md transition-colors">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-primary" />
                      <span className="text-sm">Guide de publication</span>
                    </div>
                  </Link>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link to="/guide#conseils" className="block p-2 hover:bg-accent rounded-md transition-colors">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm">Conseils pour une bonne annonce</span>
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
