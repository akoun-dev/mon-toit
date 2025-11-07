import { NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink } from "@/components/ui/navigation-menu";
import { Link } from "react-router-dom";
import { HelpCircle, BookOpen, MessageCircle, ShieldCheck, FileCheck } from "lucide-react";

export const MegaMenuAide = () => {
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className="text-sm font-medium">
        <HelpCircle className="mr-2 h-4 w-4" />
        Aide
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className="grid gap-4 p-6 w-[500px] grid-cols-2 bg-background border border-border shadow-xl rounded-lg">
          {/* Colonne 1: Documentation */}
          <div>
            <h4 className="text-sm font-semibold text-primary mb-3">
              Documentation
            </h4>
            <ul className="space-y-2">
              <li>
                <NavigationMenuLink asChild>
                  <Link to="/guide" className="block p-2 hover:bg-accent rounded-md transition-colors">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span className="text-sm">Guide complet</span>
                    </div>
                  </Link>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link to="/guide#faq" className="block p-2 hover:bg-accent rounded-md transition-colors">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm">FAQ</span>
                    </div>
                  </Link>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link to="/guide#louer" className="block p-2 hover:bg-accent rounded-md transition-colors">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm">Comment louer ?</span>
                    </div>
                  </Link>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link to="/guide#publier" className="block p-2 hover:bg-accent rounded-md transition-colors">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm">Comment publier ?</span>
                    </div>
                  </Link>
                </NavigationMenuLink>
              </li>
            </ul>
          </div>

          {/* Colonne 2: Sécurité */}
          <div>
            <h4 className="text-sm font-semibold text-primary mb-3">
              Sécurité et confiance
            </h4>
            <ul className="space-y-2">
              <li>
                <NavigationMenuLink asChild>
                  <Link to="/confiance" className="block p-2 hover:bg-accent rounded-md transition-colors">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      <span className="text-sm">Plateforme sécurisée</span>
                    </div>
                  </Link>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link to="/verification" className="block p-2 hover:bg-accent rounded-md transition-colors">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      <span className="text-sm">Vérification d'identité</span>
                    </div>
                  </Link>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link to="/certification-faq" className="block p-2 hover:bg-accent rounded-md transition-colors">
                    <div className="flex items-center gap-2">
                      <FileCheck className="h-4 w-4 text-primary" />
                      <span className="text-sm">Certification des baux</span>
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
