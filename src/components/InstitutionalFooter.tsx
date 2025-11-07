/**
 * MZAKA - Footer Institutionnel
 * Conforme aux directives ARCEP et service public numérique
 */

import { Link } from 'react-router-dom';
import { Shield, ShieldCheck, Mail, Phone, MapPin, ExternalLink } from 'lucide-react';
import monToitLogo from '@/assets/logo/mon-toit-logo.png';
import { BRANDING } from '@/config/branding';

export const InstitutionalFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-primary to-primary-700 text-white">
      {/* Bandeau confiance */}
      <div className="bg-primary-900 py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 text-center md:text-left">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-white" />
              <span className="font-bold text-lg">Plateforme de confiance</span>
            </div>
            <span className="hidden md:inline text-white/60">•</span>
            <span className="text-white/90">Location sécurisée au Burkina Faso</span>
          </div>
        </div>
      </div>

      {/* Contenu principal du footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          
          {/* Colonne 1 : À propos */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src={monToitLogo} 
                alt="MZAKA" 
                className="h-10 w-auto brightness-0 invert" 
              />
              <div>
                <h3 className="font-bold text-lg">MZAKA</h3>
                <p className="text-xs text-white/60">Le logement en toute confiance</p>
              </div>
            </div>
            <p className="text-sm text-white/80 leading-relaxed">
              Plateforme immobilière pour la recherche et la publication de logements au Burkina Faso. Sécurisée, transparente, 100% burkinabè.
            </p>
          </div>

          {/* Colonne 2 : Navigation */}
          <div className="space-y-4">
            <h4 className="font-bold text-base">Navigation</h4>
            <nav className="flex flex-col space-y-2">
              <Link 
                to="/explorer" 
                className="text-sm text-white/70 hover:text-white transition-colors flex items-center gap-2"
              >
                Rechercher un logement
              </Link>
              <Link 
                to="/publier" 
                className="text-sm text-white/70 hover:text-white transition-colors flex items-center gap-2"
              >
                Publier une annonce
              </Link>
              <Link 
                to="/artisans" 
                className="text-sm text-white/70 hover:text-white transition-colors flex items-center gap-2"
              >
                Artisans & Services
              </Link>
              <Link 
                to="/aide" 
                className="text-sm text-white/70 hover:text-white transition-colors flex items-center gap-2"
              >
                Aide & Support
              </Link>
            </nav>
          </div>

          {/* Colonne 3 : Informations légales */}
          <div className="space-y-4">
            <h4 className="font-bold text-base">Informations légales</h4>
            <nav className="flex flex-col space-y-2">
              <Link 
                to="/mentions-legales" 
                className="text-sm text-white/70 hover:text-white transition-colors"
              >
                Mentions légales
              </Link>
              <Link 
                to="/confidentialite" 
                className="text-sm text-white/70 hover:text-white transition-colors"
              >
                Politique de confidentialité
              </Link>
              <Link 
                to="/conditions-utilisation" 
                className="text-sm text-white/70 hover:text-white transition-colors"
              >
                Conditions d'utilisation
              </Link>
              <Link 
                to="/protection-donnees" 
                className="text-sm text-white/70 hover:text-white transition-colors"
              >
                Protection des données
              </Link>
              <Link 
                to="/accessibilite" 
                className="text-sm text-white/70 hover:text-white transition-colors"
              >
                Accessibilité
              </Link>
            </nav>
          </div>

          {/* Colonne 4 : Contact */}
          <div className="space-y-4">
            <h4 className="font-bold text-base">Contact</h4>
            <div className="space-y-3 text-sm text-white/80">
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 flex-shrink-0 text-secondary" />
                <a href="mailto:contact@mzaka.bf" className="hover:text-white transition-colors">
                  contact@mzaka.bf
                </a>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 flex-shrink-0 text-secondary" />
                <a href="tel:+22600000000" className="hover:text-white transition-colors">
                  +226 XX XX XX XX
                </a>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-secondary" />
                <span>
                  Ouagadougou<br />
                  Burkina Faso
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Séparateur */}
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/60">
            
            {/* Copyright */}
            <div className="flex items-center gap-2">
              <span>© {currentYear} MZAKA</span>
              <span className="hidden md:inline">•</span>
              <span className="hidden md:inline">Tous droits réservés</span>
            </div>

            {/* Badges de confiance */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-900/50 border border-primary-700 rounded-lg">
                <ShieldCheck className="h-4 w-4 text-white" />
                <span className="text-xs font-semibold text-white">Plateforme Sécurisée</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-success/20 border border-success/30 rounded-lg">
                <Shield className="h-4 w-4 text-success" />
                <span className="text-xs font-semibold text-white">100% Burkinabè</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mention légale */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <p className="text-xs text-white/50 text-center leading-relaxed">
            MZAKA - Plateforme privée de location immobilière au Burkina Faso. 
            Tous droits réservés. Données protégées conformément à la loi burkinabè.
          </p>
        </div>
      </div>
    </footer>
  );
};

