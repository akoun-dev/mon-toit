import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, User, LogOut, ShieldCheck, DollarSign, Search, PlusCircle, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Separator } from '@/components/ui/separator';
import { CertificationBadge } from '@/components/shared/CertificationBadge';

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
        <div className="flex flex-col gap-6 mt-8">
          {/* Navigation Links */}
          <div className="flex flex-col gap-1">
            <Link
              to="/explorer"
              onClick={handleNavClick}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent transition-colors"
            >
              <Search className="h-5 w-5 text-primary" />
              <span>Explorer</span>
            </Link>
            <Link
              to="/publier"
              onClick={handleNavClick}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent transition-colors"
            >
              <PlusCircle className="h-5 w-5 text-primary" />
              <span>Publier</span>
            </Link>
            <Link
              to="/guide"
              onClick={handleNavClick}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent transition-colors"
            >
              <BookOpen className="h-5 w-5 text-primary" />
              <span>Guide</span>
            </Link>
            <Link
              to="/certification"
              onClick={handleNavClick}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold bg-primary/5 border-l-2 border-primary hover:bg-primary/10 transition-colors"
            >
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span>Certification ANSUT</span>
            </Link>
            <Link
              to="/tarifs"
              onClick={handleNavClick}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent transition-colors"
            >
              <DollarSign className="h-5 w-5 text-primary" />
              <span>Tarifs</span>
            </Link>
          </div>

          {user && (
            <>
              <Separator />
              {/* User Info */}
              <div className="px-3">
                <p className="text-sm font-semibold text-foreground mb-1">{profile?.full_name}</p>
                <p className="text-xs text-muted-foreground mb-2">{user.email}</p>
                {(profile?.oneci_verified || profile?.cnam_verified) && (
                  <CertificationBadge variant="compact" />
                )}
              </div>

              <Separator />
              
              {/* Account Links */}
              <div className="flex flex-col gap-1">
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
