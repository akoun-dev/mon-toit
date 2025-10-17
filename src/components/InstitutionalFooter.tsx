/**
 * MON TOIT - Footer Institutionnel
 * Conforme aux directives ANSUT et service public numérique
 */

import { Link } from 'react-router-dom';
import { Shield, ShieldCheck, Mail, Phone, MapPin, ExternalLink } from 'lucide-react';
import monToitLogo from '@/assets/logo/mon-toit-logo.png';

export const InstitutionalFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      {/* Bandeau ANSUT */}
      <div className="bg-primary py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 text-center md:text-left">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-white" />
              <span className="font-bold text-lg">Certifié ANSUT</span>
            </div>
            <span className="hidden md:inline text-white/60">•</span>
            <span className="text-white/90">Service Public du Numérique</span>
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
                alt="Mon Toit" 
                className="h-10 w-auto brightness-0 invert" 
              />
              <div>
                <h3 className="font-bold text-lg">Mon Toit</h3>
                <p className="text-xs text-gray-400">Le logement en toute confiance</p>
              </div>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              Plateforme immobilière certifiée ANSUT pour la recherche et la publication de logements en Côte d'Ivoire.
            </p>
            <div className="flex items-start gap-2 text-xs text-gray-400">
              <Shield className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
              <span>
                Propulsé par la Direction de la Transformation Digitale et de l'Innovation (DTDI) – ANSUT
              </span>
            </div>
          </div>

          {/* Colonne 2 : Navigation */}
          <div className="space-y-4">
            <h4 className="font-bold text-base">Navigation</h4>
            <nav className="flex flex-col space-y-2">
              <Link 
                to="/explorer" 
                className="text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-2"
              >
                Rechercher un logement
              </Link>
              <Link 
                to="/publier" 
                className="text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-2"
              >
                Publier une annonce
              </Link>
              <Link 
                to="/artisans" 
                className="text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-2"
              >
                Artisans & Services
              </Link>
              <Link 
                to="/aide" 
                className="text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-2"
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
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Mentions légales
              </Link>
              <Link 
                to="/confidentialite" 
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Politique de confidentialité
              </Link>
              <Link 
                to="/conditions-utilisation" 
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Conditions d'utilisation
              </Link>
              <Link 
                to="/protection-donnees" 
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Protection des données
              </Link>
              <Link 
                to="/accessibilite" 
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Accessibilité
              </Link>
            </nav>
          </div>

          {/* Colonne 4 : Contact */}
          <div className="space-y-4">
            <h4 className="font-bold text-base">Contact</h4>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                <a href="mailto:contact@montoit.ci" className="hover:text-white transition-colors">
                  contact@montoit.ci
                </a>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                <a href="tel:+2250700000000" className="hover:text-white transition-colors">
                  +225 07 00 00 00 00
                </a>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                <span>
                  Abidjan, Plateau<br />
                  Côte d'Ivoire
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Séparateur */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
            
            {/* Copyright */}
            <div className="flex items-center gap-2">
              <span>© {currentYear} Mon Toit</span>
              <span className="hidden md:inline">•</span>
              <span className="hidden md:inline">Tous droits réservés</span>
            </div>

            {/* Badges de confiance */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 border border-primary/30 rounded-lg">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-white">ANSUT Certifié</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-success/20 border border-success/30 rounded-lg">
                <Shield className="h-4 w-4 text-success" />
                <span className="text-xs font-semibold text-white">100% Sécurisé</span>
              </div>
            </div>

            {/* Lien ANSUT */}
            <a
              href="https://ansut.ci"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
            >
              <span className="text-xs">En savoir plus sur ANSUT</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Mention interopérabilité */}
        <div className="mt-6 pt-6 border-t border-gray-800">
          <p className="text-xs text-gray-500 text-center leading-relaxed">
            Cette plateforme s'inscrit dans le cadre de l'interopérabilité des services publics numériques
            de la République de Côte d'Ivoire, conformément aux standards ANSUT.
          </p>
        </div>
      </div>
    </footer>
  );
};

