import { Mail, Phone, MapPin, Shield, Facebook, Linkedin, Twitter, FileText, HelpCircle, MessageCircle, DollarSign, Lock, Award, CheckCircle, Image as ImageIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import monToitLogo from "@/assets/logo/mon-toit-logo.png";

const Footer = () => {
  return (
    <footer className="relative bg-gradient-to-b from-background to-muted/30 text-foreground pt-16 pb-8">
      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
          {/* Brand Column */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img src={monToitLogo} alt="Mon Toit" className="h-12 w-auto dark:brightness-0 dark:invert" />
            </div>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed max-w-sm">
              La plateforme de confiance pour l'immobilier en Côte d'Ivoire. Service public certifié ANSUT.
            </p>
            
            <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 bg-success/10 text-success rounded-full text-xs font-semibold">
              <Award className="h-3 w-3" />
              Gratuit pour tous les locataires
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-2 mt-4">
              <div className="trust-badge flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 border border-primary/20 rounded-lg">
                <Shield className="h-3 w-3 text-primary" />
                <span className="text-xs font-medium">Certifié ANSUT</span>
              </div>
              <div className="trust-badge flex items-center gap-1.5 px-3 py-1.5 bg-success/5 border border-success/20 rounded-lg">
                <Lock className="h-3 w-3 text-success" />
                <span className="text-xs font-medium">Paiement sécurisé</span>
              </div>
              <div className="trust-badge flex items-center gap-1.5 px-3 py-1.5 bg-secondary/5 border border-secondary/20 rounded-lg">
                <CheckCircle className="h-3 w-3 text-secondary" />
                <span className="text-xs font-medium">RGPD conforme</span>
              </div>
            </div>

            {/* Social Media */}
            <div className="flex gap-3 mt-6">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Navigation Column */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Navigation</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/recherche" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                  Rechercher un bien
                </Link>
              </li>
              <li>
                <Link to="/explorer" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                  Explorer la carte
                </Link>
              </li>
              <li>
                <Link to="/publier" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                  Publier une annonce
                </Link>
              </li>
              <li>
                <Link to="/comment-ca-marche" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                  Comment ça marche
                </Link>
              </li>
              <li>
                <Link to="/a-propos" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                  À propos
                </Link>
              </li>
              <li>
                <Link to="/tarifs" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                  Tarifs
                </Link>
              </li>
              <li>
                <Link to="/illustrations" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors duration-200">
                  <ImageIcon className="h-4 w-4" />
                  Nos Illustrations
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">Nouveau</Badge>
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Légal</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/certification" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                  Certification ANSUT
                </Link>
              </li>
              <li>
                <Link to="/conditions" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                  Conditions d'utilisation
                </Link>
              </li>
              <li>
                <Link to="/confidentialite" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link to="/mentions-legales" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                  Mentions légales
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Ressources</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/certification-faq" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors duration-200">
                  <HelpCircle className="h-4 w-4" />
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/messages" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors duration-200">
                  <MessageCircle className="h-4 w-4" />
                  Support
                </Link>
              </li>
              <li>
                <Link to="/tarifs" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors duration-200">
                  <DollarSign className="h-4 w-4" />
                  Tarifs
                </Link>
              </li>
            </ul>

            {/* Contact */}
            <h3 className="font-semibold mb-4 mt-8 text-foreground">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                <a href="mailto:contact@montoit.ci" className="hover:text-primary transition-colors">
                  contact@montoit.ci
                </a>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                +225 27 XX XX XX XX
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                Abidjan, Côte d'Ivoire
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-8 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p className="text-center md:text-left">
              © 2025 Mon Toit - Financé par l'ANSUT. Tous droits réservés.
            </p>
            <p className="text-xs text-center md:text-right">
              Conforme à la loi ivoirienne 2013-450 sur la protection des données
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
