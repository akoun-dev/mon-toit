/**
 * MON TOIT - Page Protection des Données
 * Conformité RGPD et législation ivoirienne sur la protection des données
 */

import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Shield, Lock, Eye, FileText, Mail, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SUTAChatbot } from '@/components/SUTAChatbot';
import { MainLayout } from '@/components/layout/MainLayout';

const ProtectionDonneesPage = () => {
  return (
    <MainLayout>
      <div className="bg-gray-50">
      <Helmet>
        <title>Protection des Données - Mon Toit</title>
        <meta name="description" content="Politique de protection des données personnelles - Mon Toit, conformité RGPD et législation ivoirienne" />
      </Helmet>

      <SUTAChatbot />

      {/* En-tête */}
      <div className="bg-gradient-to-br from-primary via-primary-700 to-primary-900 text-white">
        <div className="container mx-auto px-2 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white/10 rounded-full">
                <Shield className="h-12 w-12" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4">
              Protection des Données
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Vos données sont protégées avec le plus grand soin
            </p>
            <div className="flex items-center justify-center gap-4">
              <Badge variant="secondary" className="bg-green-500/20 text-green-100 border-green-400/30">
                <CheckCircle className="h-4 w-4 mr-1" />
                RGPD Conforme
              </Badge>
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-100 border-blue-400/30">
                <Lock className="h-4 w-4 mr-1" />
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
                <Shield className="h-6 w-6 text-primary" />
                Notre engagement pour votre confidentialité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Chez Mon Toit, la protection de vos données personnelles est une priorité absolue.
                En tant que service public numérique certifié ANSUT, nous nous engageons à respecter
                les plus hauts standards de protection des données, conformément au Règlement Général
                sur la Protection des Données (RGPD) et à la législation ivoirienne sur la protection
                des données personnelles.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-green-900">Certification ANSUT</h4>
                    <p className="text-sm text-green-800">
                      Notre plateforme est auditée régulièrement par l'ANSUT pour garantir
                      la conformité avec les standards de sécurité et de protection des données.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Données collectées */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Eye className="h-6 w-6 text-primary" />
                Quelles données collectons-nous ?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Données de compte</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• Nom et prénom</li>
                    <li>• Adresse email</li>
                    <li>• Numéro de téléphone</li>
                    <li>• Adresse postale</li>
                    <li>• Informations de profil</li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Données d'utilisation</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• Historique des recherches</li>
                    <li>• Favoris et consultations</li>
                    <li>• Messages échangés</li>
                    <li>• Données de localisation</li>
                    <li>• Préférences utilisateur</li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900">Finalité de la collecte</h4>
                    <p className="text-sm text-blue-800">
                      Vos données sont collectées uniquement dans le but de fournir nos services,
                      d'améliorer votre expérience utilisateur et d'assurer la sécurité des transactions.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vos droits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-primary" />
                Vos droits sur vos données
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Droit d'accès</h4>
                      <p className="text-sm text-gray-700">
                        Accédez à toutes vos données personnelles que nous détenons.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Droit de modification</h4>
                      <p className="text-sm text-gray-700">
                        Mettez à jour vos informations personnelles à tout moment.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Droit de suppression</h4>
                      <p className="text-sm text-gray-700">
                        Demandez la suppression de vos données personnelles.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Droit de portabilité</h4>
                      <p className="text-sm text-gray-700">
                        Recevez vos données dans un format structuré et lisible.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Droit d'opposition</h4>
                      <p className="text-sm text-gray-700">
                        Opposez-vous à l'utilisation de vos données à des fins commerciales.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Droit à l'oubli</h4>
                      <p className="text-sm text-gray-700">
                        Demandez l'effacement permanent de vos données.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mesures de sécurité */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Lock className="h-6 w-6 text-primary" />
                Nos mesures de sécurité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Lock className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">Chiffrement</h4>
                  <p className="text-sm text-gray-700">
                    Toutes vos données sont chiffrées de bout en bout
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Shield className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">Audits réguliers</h4>
                  <p className="text-sm text-gray-700">
                    Des audits de sécurité sont effectués trimestriellement
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Eye className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">Contrôle d'accès</h4>
                  <p className="text-sm text-gray-700">
                    Seuls les autorisés peuvent accéder à vos données
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-900">Conservation des données</h4>
                    <p className="text-sm text-amber-800">
                      Vos données sont conservées uniquement pendant la durée nécessaire
                      à la fourniture de nos services, conformément aux exigences légales.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cookies et suivi */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Eye className="h-6 w-6 text-primary" />
                Cookies et suivi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Nous utilisons des cookies pour améliorer votre expérience, analyser l'utilisation
                de notre site et personnaliser les contenus. Vous pouvez contrôler vos préférences
                via notre panneau de configuration des cookies.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm">
                  Gérer les cookies
                </Button>
                <Link to="/confidentialite">
                  <Button variant="ghost" size="sm">
                    Politique de confidentialité
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Contact pour données */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Mail className="h-6 w-6 text-primary" />
                Contact Délégué à la Protection des Données
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Pour toute question concernant la protection de vos données ou pour exercer
                vos droits, contactez notre Délégué à la Protection des Données (DPD).
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-primary" />
                    <span>dpd@montoit.ci</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-primary" />
                    <span>+225 07 00 00 00 00</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold">Délai de réponse</h4>
                  <p className="text-sm text-gray-700">
                    Nous nous engageons à répondre à votre demande dans un délai maximum de 30 jours.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button>
                  Envoyer une demande
                </Button>
                <Button variant="outline">
                  Télécharger le formulaire de demande
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Actualités réglementaires */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-primary" />
                Actualités réglementaires
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4 py-2">
                  <h4 className="font-semibold text-gray-900">Mise à jour RGPD - Juin 2024</h4>
                  <p className="text-sm text-gray-600">
                    Renforcement des obligations de consentement et des droits des utilisateurs.
                  </p>
                </div>
                <div className="border-l-4 border-primary pl-4 py-2">
                  <h4 className="font-semibold text-gray-900">Loi ivoirienne sur la protection des données - Mars 2024</h4>
                  <p className="text-sm text-gray-600">
                    Nouvelles directives pour la collecte et le traitement des données personnelles en Côte d'Ivoire.
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Voir toutes les actualités
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer rapide */}
      <div className="bg-gray-100 py-12">
        <div className="container mx-auto px-2">
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">
              Des questions sur vos données ?
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Notre équipe de protection des données est à votre disposition pour répondre
              à toutes vos questions concernant la confidentialité et la sécurité de vos informations.
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Button size="lg">
                <Mail className="h-4 w-4 mr-2" />
                Contactez le DPD
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

export default ProtectionDonneesPage;