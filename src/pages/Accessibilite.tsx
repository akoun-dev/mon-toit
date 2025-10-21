/**
 * MON TOIT - Page Accessibilité
 * Conformité WCAG 2.1 AA et accessibilité numérique pour tous
 */

import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  Users,
  Eye,
  Keyboard,
  Volume2,
  Smartphone,
  CheckCircle,
  AlertCircle,
  User,
  Zap,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SUTAChatbot } from '@/components/SUTAChatbot';
import { MainLayout } from '@/components/layout/MainLayout';

const AccessibilitePage = () => {
  return (
    <MainLayout>
      <div className="bg-gray-50">
      <Helmet>
        <title>Accessibilité - Mon Toit</title>
        <meta name="description" content="Politique d'accessibilité numérique - Mon Toit, conforme aux normes WCAG 2.1 AA et RGAA pour l'accès à tous" />
      </Helmet>

      <SUTAChatbot />

      {/* En-tête */}
      <div className="bg-gradient-to-br from-primary via-primary-700 to-primary-900 text-white">
        <div className="container mx-auto px-2 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white/10 rounded-full">
                <Users className="h-12 w-12" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4">
              Accessibilité pour tous
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Mon Toit s'engage à rendre ses services accessibles à toutes et à tous
            </p>
            <div className="flex items-center justify-center gap-4">
              <Badge variant="secondary" className="bg-green-500/20 text-green-100 border-green-400/30">
                <CheckCircle className="h-4 w-4 mr-1" />
                WCAG 2.1 AA
              </Badge>
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-100 border-blue-400/30">
                <CheckCircle className="h-4 w-4 mr-1" />
                RGAA Conforme
              </Badge>
              <Badge variant="secondary" className="bg-purple-500/20 text-purple-100 border-purple-400/30">
                <CheckCircle className="h-4 w-4 mr-1" />
                ANSUT Certifié
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="container mx-auto px-2 py-6">
        <div className="max-w-4xl mx-auto space-y-12">

          {/* Notre engagement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Users className="h-6 w-6 text-primary" />
                Notre engagement accessibilité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Chez Mon Toit, nous croyons que les services numériques doivent être accessibles à
                tous, sans exception. En tant que service public numérique certifié ANSUT, nous nous
                engageons à respecter les normes d'accessibilité les plus strictes pour garantir
                une expérience utilisateur inclusive.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-green-900">Conformité WCAG 2.1 AA</h4>
                    <p className="text-sm text-green-800">
                      Notre plateforme est conçue pour respecter les critères de niveau AA des
                      Web Content Accessibility Guidelines (WCAG) 2.1.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fonctionnalités d'accessibilité */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Settings className="h-6 w-6 text-primary" />
                Fonctionnalités d'accessibilité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Eye className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Accessibilité visuelle</h4>
                      <ul className="text-sm text-gray-700 space-y-1 mt-2">
                        <li>• Contrastes élevés respectés</li>
                        <li>• Police adaptable (100%-200%)</li>
                        <li>• Mode lecteur optimisé</li>
                        <li>• Description d'images alternatives</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Keyboard className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Navigation au clavier</h4>
                      <ul className="text-sm text-gray-700 space-y-1 mt-2">
                        <li>• Navigation complète au clavier</li>
                        <li>• Tab order logique</li>
                        <li>• Raccourcis clavier standards</li>
                        <li>• Focus visible et contrasté</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Volume2 className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Accessibilité auditive</h4>
                      <ul className="text-sm text-gray-700 space-y-1 mt-2">
                        <li>• Transcriptions des contenus audio</li>
                        <li>• Sous-titres des vidéos</li>
                        <li>• Alertes visuelles</li>
                        <li>• Indicateurs visuels des notifications</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Smartphone className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Accessibilité mobile</h4>
                      <ul className="text-sm text-gray-700 space-y-1 mt-2">
                        <li>• Design responsive complet</li>
                        <li>• Zones tactiles adaptées</li>
                        <li>• Compatible lecteurs d'écran</li>
                        <li>• Navigation intuitive</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Aides techniques supportées */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Zap className="h-6 w-6 text-primary" />
                Technologies d'assistance supportées
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Eye className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">Lecteurs d'écran</h4>
                  <p className="text-sm text-gray-700">
                    NVDA, JAWS, VoiceOver, TalkBack
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Keyboard className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">Claviers adaptés</h4>
                  <p className="text-sm text-gray-700">
                    Claviers virtuels, switches, joysticks
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <User className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">Logiciels d'adaptation</h4>
                  <p className="text-sm text-gray-700">
                    Zoom, loupes, synthèses vocales
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Raccourcis clavier */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Keyboard className="h-6 w-6 text-primary" />
                Raccourcis clavier
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Utilisez ces raccourcis pour naviguer plus facilement sur notre plateforme :
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Aller au contenu principal</span>
                      <kbd className="px-2 py-1 bg-white border rounded">Alt + C</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Aller à la navigation</span>
                      <kbd className="px-2 py-1 bg-white border rounded">Alt + N</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Recherche rapide</span>
                      <kbd className="px-2 py-1 bg-white border rounded">Alt + R</kbd>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Menu accessibilité</span>
                      <kbd className="px-2 py-1 bg-white border rounded">Alt + A</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Augmenter la police</span>
                      <kbd className="px-2 py-1 bg-white border rounded">Alt + +</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Diminuer la police</span>
                      <kbd className="px-2 py-1 bg-white border rounded">Alt + -</kbd>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tester l'accessibilité */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Users className="h-6 w-6 text-primary" />
                Test utilisateur et amélioration continue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Tests réguliers</h4>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li>• Audits automatisés mensuels</li>
                    <li>• Tests manuels trimestriels</li>
                    <li>• Tests avec utilisateurs en situation de handicap</li>
                    <li>• Validation par des experts accessibilité</li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Formation continue</h4>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li>• Équipe formée aux normes WCAG</li>
                    <li>• Sensibilisation à l'accessibilité</li>
                    <li>• Veille technologique constante</li>
                    <li>• Partage des bonnes pratiques</li>
                  </ul>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-900">Amélioration continue</h4>
                    <p className="text-sm text-amber-800">
                      Nous travaillons constamment à l'amélioration de notre accessibilité.
                      Si vous rencontrez des difficultés, merci de nous le signaler.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Signaler un problème */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-primary" />
                Signaler un problème d'accessibilité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Malgré nos efforts pour rendre notre site accessible, vous pourriez rencontrer
                des difficultés. Nous vous invitons à nous signaler tout problème pour que nous
                puissions y remédier rapidement.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900">Information à fournir</h4>
                    <p className="text-sm text-blue-800">
                      Pour nous aider à traiter votre signalement, merci de préciser :
                      la page concernée, la nature du problème, votre navigateur et
                      les technologies d'assistance utilisées.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button>
                  Signaler un problème
                </Button>
                <Button variant="outline">
                  Formulaire de contact accessibilité
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Ressources accessibilité */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Users className="h-6 w-6 text-primary" />
                Ressources et documentation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Guides accessibilité</h4>
                  <ul className="space-y-2">
                    <li>
                      <Link to="/aide" className="text-primary hover:underline text-sm">
                        → Guide d'utilisation complet
                      </Link>
                    </li>
                    <li>
                      <Link to="/confidentialite" className="text-primary hover:underline text-sm">
                        → Aides techniques recommandées
                      </Link>
                    </li>
                    <li>
                      <Link to="/mentions-legales" className="text-primary hover:underline text-sm">
                        → Tutoriels vidéo sous-titrés
                      </Link>
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Ressources externes</h4>
                  <ul className="space-y-2">
                    <li>
                      <a href="https://www.w3.org/WAI/WCAG21/quickref/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                        → Référence WCAG 2.1 (EN)
                      </a>
                    </li>
                    <li>
                      <a href="https://www.numerique.gouv.fr/accessibilite-numerique/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                        → Accessibilité numérique France
                      </a>
                    </li>
                    <li>
                      <a href="https://www.ansut.ci/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                        → Standards ANSUT
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer rapide */}
      <div className="bg-gray-100 py-12">
        <div className="container mx-auto px-2">
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">
              Besoin d'aide pour l'accessibilité ?
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Notre équipe dédiée à l'accessibilité est à votre disposition pour vous accompagner
              et répondre à toutes vos questions sur l'utilisation de notre plateforme.
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Button size="lg">
                Contacter l'équipe accessibilité
              </Button>
              <Link to="/aide">
                <Button variant="outline" size="lg">
                  Visiter le centre d'aide
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      </div>
    </MainLayout>
  );
};

export default AccessibilitePage;