import { Shield, Facebook, Linkedin, Twitter } from "lucide-react";
import { Link } from "react-router-dom";
import monToitLogo from "@/assets/logo/mon-toit-logo.png";

const Footer = () => {
  return (
    <footer className="relative bg-gradient-to-b from-background to-muted/30 text-foreground pt-16 pb-8">
      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
          {/* Colonne 1 - Mon Toit */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Mon Toit</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/a-propos" className="text-muted-foreground hover:text-primary transition-colors">
                  À propos
                </Link>
              </li>
              <li>
                <Link to="/comment-ca-marche" className="text-muted-foreground hover:text-primary transition-colors">
                  Comment ça marche
                </Link>
              </li>
              <li>
                <Link to="/certification" className="text-muted-foreground hover:text-primary transition-colors">
                  Certification ANSUT
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 2 - Explorer */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Explorer</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/recherche" className="text-muted-foreground hover:text-primary transition-colors">
                  Rechercher un logement
                </Link>
              </li>
              <li>
                <Link to="/publier" className="text-muted-foreground hover:text-primary transition-colors">
                  Publier une annonce
                </Link>
              </li>
              <li>
                <Link to="/tarifs" className="text-muted-foreground hover:text-primary transition-colors">
                  Tarifs
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 3 - Support */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Support</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/aide" className="text-muted-foreground hover:text-primary transition-colors">
                  Aide
                </Link>
              </li>
              <li>
                <Link to="/certification-faq" className="text-muted-foreground hover:text-primary transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 4 - Légal */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Légal</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/conditions" className="text-muted-foreground hover:text-primary transition-colors">
                  CGU
                </Link>
              </li>
              <li>
                <Link to="/confidentialite" className="text-muted-foreground hover:text-primary transition-colors">
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link to="/mentions-legales" className="text-muted-foreground hover:text-primary transition-colors">
                  Mentions légales
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 5 - Suivez-nous */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Suivez-nous</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a 
                  href="https://facebook.com/montoit" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Facebook className="h-4 w-4" />
                  Facebook
                </a>
              </li>
              <li>
                <a 
                  href="https://twitter.com/montoit" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Twitter className="h-4 w-4" />
                  Twitter
                </a>
              </li>
              <li>
                <a 
                  href="https://linkedin.com/company/montoit" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img src={monToitLogo} alt="Mon Toit" className="h-8 w-auto dark:brightness-0 dark:invert" />
            </div>

            {/* Copyright */}
            <p className="text-sm text-muted-foreground text-center">
              © 2025 Mon Toit. Tous droits réservés.
            </p>

            {/* Badge ANSUT */}
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Propulsé par ANSUT</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
