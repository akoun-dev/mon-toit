/**
 * MON TOIT - Page d'Aide et Support
 * Page d'aide pour guider les utilisateurs
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { DynamicBreadcrumb } from '@/components/navigation/DynamicBreadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Search,
  MessageCircle,
  Phone,
  Mail,
  HelpCircle,
  BookOpen,
  Users,
  Home,
  ShieldCheck,
  AlertCircle,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from '@/hooks/use-toast';

export default function Aide() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>('getting-started');

  const faqCategories = [
    {
      id: 'getting-started',
      title: 'Premiers pas',
      icon: Home,
      color: 'bg-blue-500',
      questions: [
        {
          q: 'Comment créer un compte sur Mon Toit ?',
          a: 'Vous pouvez créer un compte en cliquant sur le bouton "Se connecter" en haut à droite, puis sur "Créer un compte". Le processus est simple et ne prend que 2 minutes.',
          category: 'Compte'
        },
        {
          q: 'Comment rechercher un logement ?',
          a: 'Utilisez la barre de recherche sur la page d\'accueil ou accédez à la page "Explorer" pour filtrer par ville, type de bien, prix et autres critères.',
          category: 'Recherche'
        },
        {
          q: 'Quels sont les documents nécessaires ?',
          a: 'Selon votre statut, vous aurez besoin d\'une pièce d\'identité, d\'un justificatif de domicile, de 3 derniers bulletins de salaire pour les locataires, ou d\'un titre de propriété pour les propriétaires.',
          category: 'Documents'
        }
      ]
    },
    {
      id: 'properties',
      title: 'Propriétés',
      icon: Home,
      color: 'bg-green-500',
      questions: [
        {
          q: 'Comment publier une annonce ?',
          a: 'Connectez-vous, allez dans votre tableau de bord et cliquez sur "Ajouter une propriété". Remplissez toutes les informations requises, ajoutez des photos de qualité et publiez votre annonce.',
          category: 'Publication'
        },
        {
          q: 'Quelles sont les certifications requises ?',
          a: 'Toutes les annonces doivent être certifiées par l\'ANSUT. Vous devrez fournir les documents justificatifs et passer par notre processus de vérification.',
          category: 'Certification'
        },
        {
          q: 'Comment modifier mon annonce ?',
          a: 'Accédez à votre tableau de bord, sélectionnez la propriété à modifier et cliquez sur "Modifier". Les changements seront soumis à validation avant publication.',
          category: 'Gestion'
        },
        {
          q: 'Puis-je contacter directement les propriétaires ?',
          a: 'Oui, une fois certifiée, vous pouvez contacter les propriétaires via notre système de messagerie sécurisé ou par les moyens de communication fournis.',
          category: 'Communication'
        }
      ]
    },
    {
      id: 'applications',
      title: 'Candidatures',
      icon: Users,
      color: 'bg-purple-500',
      questions: [
        {
          q: 'Comment postuler à une location ?',
          a: 'Sur la page de la propriété, cliquez sur "Postuler" et remplissez le formulaire de candidature. Vous pourrez joindre vos documents directement.',
          category: 'Processus'
        },
        {
          q: 'Comment suivre ma candidature ?',
          a: 'Vous recevrez des notifications par email pour chaque étape : réception, examen, décision finale. Vous pouvez suivre l\'état dans votre tableau de bord.',
          category: 'Suivi'
        },
        {
          q: 'Quels sont les critères de sélection ?',
          a: 'Les critères incluent la stabilité financière, les références vérifiables, le respect du bail et la correspondance avec le profil du bien.',
          category: 'Critères'
        }
      ]
    },
    {
      id: 'payments',
      title: 'Paiements',
      icon: ShieldCheck,
      color: 'bg-yellow-500',
      questions: [
        {
          q: 'Quels modes de paiement sont acceptés ?',
          a: 'Nous acceptons les virements bancaires, Mobile Money, Orange Money, MTN Mobile Money et les paiements en espèce pour le premier mois.',
          category: 'Moyens'
        },
        {
          q: 'Comment le loyer est-il sécurisé ?',
          a: 'Les paiements sont gérés via notre plateforme sécurisée avec cryptage SSL. L\'argent est conservé en compte de séquest jusqu\'à la finalisation du bail.',
          category: 'Sécurité'
        },
        {
          q: 'Puis-je payer en plusieurs fois ?',
          a: 'Oui, nous proposons des options de paiement échelonné pour faciliter l\'accès au logement.',
          category: 'Options'
        }
      ]
    },
    {
      id: 'technical',
      title: 'Technique',
      icon: AlertCircle,
      color: 'bg-red-500',
      questions: [
        {
          q: 'Mon navigateur affiche des erreurs',
          a: 'Essayez de vider votre cache et cookies, ou utilisez un autre navigateur compatible (Chrome, Firefox, Safari). Assurez-vous que JavaScript est activé.',
          category: 'Navigation'
        },
        {
          q: 'L\'application est très lente',
          a: 'Vérifiez votre connexion internet, fermez les autres onglets et essayez de redémarrer. Le problème peut venir de votre appareil ou de la connexion.',
          category: 'Performance'
        },
        {
          q: 'Je ne peux pas téléverser de photos',
          a: 'Vérifiez que vous autorisez l\'accès à votre appareil photo dans les paramètres du navigateur. Assurez-vous que les fichiers respectent la taille limite de 10MB.',
          category: 'Photos'
        },
        {
          q: 'Comment activer les notifications ?',
          a: 'Allez dans vos paramètres de profil et activez les notifications par email et/ou push pour recevoir des alertes importantes.',
          category: 'Notifications'
        }
      ]
    }
  ];

  const filteredQuestions = faqCategories.find(cat => cat.id === expandedCategory)?.questions || [];

  const filteredFAQs = faqCategories.flatMap(category =>
    category.questions.filter(item =>
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleContactSupport = (type: 'email' | 'phone') => {
    if (type === 'email') {
      window.location.href = 'mailto:support@montoit.ci?subject=Demande%20d\'aide';
    } else {
      window.location.href = 'tel:+2250700000000';
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <DynamicBreadcrumb />

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Centre d'Aide et Support
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Retrouvez des réponses rapides à vos questions et découvrez comment utiliser efficacement Mon Toit
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <MessageCircle className="h-12 w-12 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Support Chat</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Discutez avec notre équipe en temps réel
              </p>
              <Button
                onClick={() => window.open('#chat', '_blank')}
                className="w-full"
              >
                Démarrer un chat
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <Mail className="h-12 w-12 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Email Support</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Recevez une réponse par email sous 24h
              </p>
              <Button
                onClick={() => handleContactSupport('email')}
                variant="outline"
                className="w-full"
              >
                Envoyer un email
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <Phone className="h-12 w-12 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Support Téléphonique</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Disponible du lundi au vendredi, 8h-18h
              </p>
              <Button
                onClick={() => handleContactSupport('phone')}
                variant="outline"
                className="w-full"
              >
                Appeler maintenant
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans l'aide..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 h-12 text-base"
            />
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4 max-w-4xl mx-auto">
          {searchQuery === '' ? (
            // Affichage par catégories quand aucune recherche
            faqCategories.map((category) => (
              <Collapsible
                key={category.id}
                open={expandedCategory === category.id}
                onOpenChange={(open) => setExpandedCategory(open ? category.id : null)}
                className="border rounded-lg"
              >
                <CollapsibleTrigger className="w-full p-4 text-left hover:bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${category.color} text-white`}>
                        <category.icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-semibold text-lg">{category.title}</h3>
                    </div>
                    <ChevronRight className={`h-5 w-5 transition-transform ${
                      expandedCategory === category.id ? 'rotate-90' : ''
                    }`} />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4 space-y-3">
                  {category.questions.map((item, index) => (
                    <Card key={index} className="border-l-4 border-l-muted">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <HelpCircle className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground mb-2">
                              {item.q}
                            </h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {item.a}
                            </p>
                            <Badge variant="outline" className="mt-2 text-xs">
                              {item.category}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ))
          ) : (
            // Affichage des résultats de recherche
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center mb-4">
                Résultats de recherche ({filteredFAQs.length})
              </h3>
              {filteredFAQs.length > 0 ? (
                filteredFAQs.map((item, index) => (
                  <Card key={index} className="border-l-4 border-l-primary">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <HelpCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground mb-2">
                            {item.q}
                          </h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {item.a}
                          </p>
                          <Badge variant="outline" className="mt-2 text-xs">
                            {item.category}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">
                      Aucun résultat trouvé
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Essayez d'autres mots-clés ou contactez notre support.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="mt-12 pt-8 border-t">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold mb-4">Liens rapides</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <Button variant="outline" asChild className="w-full">
              <Link to="/guide">
                <BookOpen className="h-4 w-4 mr-2" />
                Guide d'utilisation
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link to="/comment-ca-marche">
                <HelpCircle className="h-4 w-4 mr-2" />
                Comment ça marche
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link to="/certification-faq">
                <ShieldCheck className="h-4 w-4 mr-2" />
                FAQ Certification
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link to="/tarifs">
                <AlertCircle className="h-4 w-4 mr-2" />
                Tarifs et commissions
              </Link>
            </Button>
          </div>
        </div>

        {/* Emergency Support */}
        <div className="mt-12 p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <h3 className="text-lg font-semibold text-red-900">
              Support d'urgence
            </h3>
          </div>
          <p className="text-red-800 mb-4">
            Pour toute situation d'urgence (problème de sécurité, urgence médicale, etc.), contactez-nous immédiatement :
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => window.open('tel:+2250700000000')}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Phone className="h-4 w-4 mr-2" />
              Appeler d'urgence
            </Button>
            <Button
              onClick={() => window.location.href = 'mailto:urgence@montoit.ci?subject=URGENCE'}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              <Mail className="h-4 w-4 mr-2" />
              Email urgence
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}