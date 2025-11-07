import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, LayoutDashboard, User, LogOut, ShieldCheck, HelpCircle, DollarSign, Search, PlusCircle, Map, Building, FileText, BookOpen, Info, Mail, FileCheck } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export const MobileMenu = () => {
  const { user, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const handleNavClick = () => {
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] overflow-y-auto bg-background">
        <div className="flex flex-col gap-4 mt-8">
          {/* Navigation Accordéon */}
          <Accordion type="single" collapsible className="w-full">
            {/* Explorer */}
            <AccordionItem value="explorer">
              <AccordionTrigger className="px-3 py-2 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Explorer</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-1 pl-9">
                  <Link to="/explorer" onClick={handleNavClick} className="py-2 text-sm hover:text-primary">
                    Tous les biens
                  </Link>
                  <Link to="/carte-intelligente" onClick={handleNavClick} className="py-2 text-sm hover:text-primary">
                    Carte interactive
                  </Link>
                  <Link to="/explorer?verified=true" onClick={handleNavClick} className="py-2 text-sm hover:text-primary">
                    Biens vérifiés DONIA
                  </Link>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Publier */}
            <AccordionItem value="publier">
              <AccordionTrigger className="px-3 py-2 hover:no-underline">
                <div className="flex items-center gap-2">
                  <PlusCircle className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Publier</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-1 pl-9">
                  <Link to="/publier" onClick={handleNavClick} className="py-2 text-sm hover:text-primary">
                    Publier une annonce
                  </Link>
                  <Link to="/mes-biens" onClick={handleNavClick} className="py-2 text-sm hover:text-primary">
                    Mes annonces
                  </Link>
                  <Link to="/my-mandates" onClick={handleNavClick} className="py-2 text-sm hover:text-primary">
                    Mes mandats
                  </Link>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Aide */}
            <AccordionItem value="aide">
              <AccordionTrigger className="px-3 py-2 hover:no-underline">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Aide</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-1 pl-9">
                  <Link to="/guide" onClick={handleNavClick} className="py-2 text-sm hover:text-primary">
                    Guide complet
                  </Link>
                  <Link to="/guide#faq" onClick={handleNavClick} className="py-2 text-sm hover:text-primary">
                    FAQ
                  </Link>
                  <Link to="/confiance" onClick={handleNavClick} className="py-2 text-sm hover:text-primary">
                    Sécurité
                  </Link>
                  <Link to="/certification-faq" onClick={handleNavClick} className="py-2 text-sm hover:text-primary">
                    Certification
                  </Link>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* À propos */}
            <AccordionItem value="apropos">
              <AccordionTrigger className="px-3 py-2 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">À propos</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-1 pl-9">
                  <Link to="/a-propos" onClick={handleNavClick} className="py-2 text-sm hover:text-primary">
                    Qui sommes-nous
                  </Link>
                  <Link to="/tarifs" onClick={handleNavClick} className="py-2 text-sm hover:text-primary">
                    Tarifs
                  </Link>
                  <Link to="/contact" onClick={handleNavClick} className="py-2 text-sm hover:text-primary">
                    Contact
                  </Link>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {user && (
            <>
              <Separator />
              {/* User Info */}
              <div className="px-3">
                <p className="text-sm font-semibold text-foreground mb-1">{profile?.full_name}</p>
                <p className="text-xs text-muted-foreground mb-2">{user.email}</p>
                {(profile?.cnib_verified || profile?.cnam_verified) && (
                <Badge variant="outline" className="text-xs border-primary text-primary">
                  ✓ Vérifié DONIA
                </Badge>
                )}
              </div>

              <Separator />
              
              {/* Account Links */}
              <div className="flex flex-col gap-1">
                <Link
                  to="/dashboard"
                  onClick={handleNavClick}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent transition-colors"
                >
                  <LayoutDashboard className="h-5 w-5 text-primary" />
                  <span>Tableau de bord</span>
                </Link>

                <Link
                  to="/profil"
                  onClick={handleNavClick}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent transition-colors"
                >
                  <User className="h-5 w-5 text-primary" />
                  <span>Mon profil</span>
                </Link>

                <Link
                  to="/verification"
                  onClick={handleNavClick}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent transition-colors"
                >
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <span>Vérification</span>
                </Link>
              </div>

              <Separator />
              
              {/* Logout */}
              <Button
                variant="outline"
                className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => {
                  signOut();
                  setOpen(false);
                }}
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </Button>
            </>
          )}

          {!user && (
            <>
              <Separator />
              <div className="flex flex-col gap-3">
                <Button 
                  variant="outline" 
                  className="w-full border-primary text-primary hover:bg-primary/5" 
                  asChild
                >
                  <Link to="/auth?type=locataire" onClick={handleNavClick}>
                    Je suis locataire
                  </Link>
                </Button>
                <Button className="w-full" asChild>
                  <Link to="/auth?type=proprietaire" onClick={handleNavClick}>
                    Je suis propriétaire
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
