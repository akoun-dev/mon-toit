/*
  =========================================
  Page: BecomeProprietaire
  =========================================

  Cette page permet aux utilisateurs de devenir propriétaire
  avec les fonctionnalités suivantes :

  1. Checklist des prérequis (ONECI, téléphone, email, profil)
  2. Barre de progression dynamique
  3. Instructions détaillées pour chaque étape
  4. Interface pour compléter les prérequis manquants
  5. Liste des avantages du rôle propriétaire
  6. Intégration avec le système de changement de rôle V2

  Date: 2025-10-17
  Version: 2.0.0
  Auteur: Manus AI
*/

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRoleSwitchV2 } from '@/hooks/useRoleSwitchV2'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

// Icons
import {
  Building2,
  Home,
  CheckCircle2,
  Circle,
  AlertTriangle,
  ArrowRight,
  Star,
  TrendingUp,
  Users,
  Shield,
  Clock,
  FileCheck,
  Phone,
  Mail,
  User,
  Camera,
  Loader2,
  ExternalLink,
  BookOpen,
  HelpCircle,
  Lightbulb
} from 'lucide-react'

// Types
interface Prerequisite {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  completed: boolean
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  priority: 'high' | 'medium' | 'low'
}

interface Advantage {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}

// Configuration des prérequis
const prerequisitesConfig = [
  {
    id: 'oneci_verification',
    title: 'Vérification d\'identité ONECI',
    description: 'Vérifiez votre identité avec la carte nationale d\'identité ivoirienne',
    icon: Shield,
    priority: 'high' as const,
    action: {
      label: 'Vérifier mon identité',
      href: '/profile/verification'
    }
  },
  {
    id: 'phone_verification',
    title: 'Téléphone vérifié',
    description: 'Confirmez votre numéro de téléphone par SMS',
    icon: Phone,
    priority: 'high' as const,
    action: {
      label: 'Vérifier mon téléphone',
      href: '/profile/phone'
    }
  },
  {
    id: 'email_verification',
    title: 'Email vérifié',
    description: 'Validez votre adresse email',
    icon: Mail,
    priority: 'high' as const,
    action: {
      label: 'Vérifier mon email',
      href: '/profile/email'
    }
  },
  {
    id: 'profile_completion',
    title: 'Profil complété à 80%',
    description: 'Renseignez vos informations personnelles (nom, prénom, téléphone, adresse)',
    icon: User,
    priority: 'medium' as const,
    action: {
      label: 'Compléter mon profil',
      href: '/profile'
    }
  }
]

// Configuration des avantages
const advantages: Advantage[] = [
  {
    icon: Home,
    title: 'Gérez vos biens',
    description: 'Ajoutez, modifiez et suivez l\'ensemble de vos propriétés'
  },
  {
    icon: Users,
    title: 'Recevez des candidatures',
    description: 'Consultez et gérez les demandes de location en temps réel'
  },
  {
    icon: FileCheck,
    title: 'Validation de dossiers',
    description: 'Accédez aux outils de vérification des locataires'
  },
  {
    icon: TrendingUp,
    title: 'Statistiques avancées',
    description: 'Analysez la performance de vos biens et optimisez vos revenus'
  },
  {
    icon: Camera,
    title: 'Galerie de photos',
    description: 'Présentez vos biens avec des photos et visites virtuelles'
  },
  {
    icon: BookOpen,
    title: 'Ressources propriétaires',
    description: 'Accédez à des guides juridiques et conseils de gestion'
  }
]

export default function BecomeProprietaire() {
  const navigate = useNavigate()
  const { user, refreshProfile } = useAuth()
  const { switchRole, isSwitching } = useRoleSwitchV2()
  const [prerequisites, setPrerequisites] = useState<Prerequisite[]>([])
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [validation, setValidation] = useState<any>(null)
  const [isValidating, setIsValidating] = useState(false)

  // Charger les données utilisateur au montage
  useEffect(() => {
    if (user) {
      loadUserData()
    }
  }, [user])

  // Charger les données utilisateur et valider les prérequis
  const loadUserData = async () => {
    setIsValidating(true)
    try {
      // Récupérer les données du profil
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          first_name,
          last_name,
          phone,
          phone_verified,
          email_confirmed_at,
          address,
          oneci_verified,
          avatar_url
        `)
        .eq('id', user?.id)
        .single()

      if (error || !profile) {
        console.error('Erreur profil:', error)
        return
      }

      // Calculer l'état des prérequis
      const updatedPrerequisites = prerequisitesConfig.map(prereq => {
        let completed = false

        switch (prereq.id) {
          case 'oneci_verification':
            completed = profile.oneci_verified === true
            break
          case 'phone_verification':
            completed = profile.phone_verified === true
            break
          case 'email_verification':
            completed = profile.email_confirmed_at !== null
            break
          case 'profile_completion':
            const profileCompletion = calculateProfileCompletion(profile)
            completed = profileCompletion >= 80
            break
        }

        return {
          ...prereq,
          completed
        }
      })

      setPrerequisites(updatedPrerequisites)

      // Calculer le pourcentage de complétion
      const completedCount = updatedPrerequisites.filter(p => p.completed).length
      const percentage = Math.round((completedCount / updatedPrerequisites.length) * 100)
      setCompletionPercentage(percentage)

      // Valider les prérequis pour devenir propriétaire
      const validationResult = await validateProprietairePrerequisites(user.id)
      setValidation(validationResult)

    } catch (error) {
      console.error('Erreur chargement données:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger vos informations",
        variant: "destructive"
      })
    } finally {
      setIsValidating(false)
    }
  }

  // Calculer le pourcentage de complétion du profil
  const calculateProfileCompletion = (profile: any): number => {
    let completion = 0
    const maxCompletion = 100

    if (profile.first_name) completion += 20
    if (profile.last_name) completion += 20
    if (profile.phone) completion += 20
    if (profile.address) completion += 20
    if (profile.avatar_url) completion += 20

    return Math.min(completion, maxCompletion)
  }

  // Valider les prérequis propriétaire
  const validateProprietairePrerequisites = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('validate_proprietaire_prerequisites', {
        p_user_id: userId
      })

      if (error) {
        console.error('Erreur validation:', error)
        return null
      }

      return data[0] || null
    } catch (error) {
      console.error('Exception validation:', error)
      return null
    }
  }

  // Gérer le clic sur une action
  const handleActionClick = (action: Prerequisite['action']) => {
    if (action?.href) {
      navigate(action.href)
    } else if (action?.onClick) {
      action.onClick()
    }
  }

  // Devenir propriétaire
  const handleBecomeProprietaire = async () => {
    if (!validation?.canUpgrade) {
      toast({
        title: "Prérequis manquants",
        description: "Veuillez compléter tous les prérequis avant de continuer",
        variant: "destructive"
      })
      return
    }

    try {
      await switchRole('proprietaire')
      // Le hook gère la redirection et les messages
    } catch (error) {
      console.error('Erreur changement de rôle:', error)
    }
  }

  // Priorité de couleur
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-amber-600'
      case 'low': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  if (isValidating) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">Chargement...</h2>
            <p className="text-muted-foreground">Vérification de vos prérequis</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* En-tête */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full mb-4">
          <Building2 className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Devenir Propriétaire</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Accédez à des fonctionnalités avancées pour gérer vos biens et optimiser vos revenus locatifs
        </p>
      </div>

      {/* Barre de progression */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Prérequis de validation
          </CardTitle>
          <CardDescription>
            Complétez ces étapes pour débloquer le rôle Propriétaire
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progression</span>
              <Badge variant={completionPercentage === 100 ? "default" : "secondary"}>
                {completionPercentage}%
              </Badge>
            </div>
            <Progress value={completionPercentage} className="h-3" />
            <p className="text-xs text-muted-foreground">
              {completionPercentage === 100
                ? "🎉 Tous les prérequis sont complétés !"
                : `${prerequisites.filter(p => p.completed).length} sur ${prerequisites.length} étapes complétées`
              }
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Liste des prérequis */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Étapes de validation</CardTitle>
              <CardDescription>
                Suivez ces étapes pour vérifier votre éligibilité
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {prerequisites.map((prereq, index) => {
                  const Icon = prereq.icon
                  const isCompleted = prereq.completed

                  return (
                    <div
                      key={prereq.id}
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-lg border transition-all duration-200",
                        isCompleted
                          ? "bg-green-50/50 border-green-200/50"
                          : "bg-muted/30 border-border/50"
                      )}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <Circle className={cn("h-5 w-5", getPriorityColor(prereq.priority))} />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={cn(
                            "font-medium",
                            isCompleted ? "text-green-900" : "text-foreground"
                          )}>
                            {prereq.title}
                          </h4>
                          <Badge
                            variant="outline"
                            className={cn("text-xs", getPriorityColor(prereq.priority))}
                          >
                            {prereq.priority === 'high' ? 'Obligatoire' : 'Recommandé'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {prereq.description}
                        </p>

                        {!isCompleted && prereq.action && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleActionClick(prereq.action)}
                            className="h-8"
                          >
                            {prereq.action.label}
                            <ArrowRight className="h-3 w-3 ml-2" />
                          </Button>
                        )}

                        {isCompleted && (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Complété
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {validation && !validation.canUpgrade && (
                <Alert className="mt-6">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">Prérequis manquants:</p>
                      <ul className="text-sm space-y-1">
                        {validation.missingRequirements.map((req: string, index: number) => (
                          <li key={index} className="flex items-center gap-2">
                            <Circle className="h-2 w-2 fill-current" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Carte d'action */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Devenir Propriétaire
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleBecomeProprietaire}
                disabled={!validation?.canUpgrade || isSwitching}
                className="w-full"
                size="lg"
              >
                {isSwitching ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Traitement en cours...
                  </>
                ) : validation?.canUpgrade ? (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Activer le rôle Propriétaire
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Prérequis incomplets
                  </>
                )}
              </Button>

              {!validation?.canUpgrade && (
                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Complétez tous les prérequis obligatoires pour débloquer cette fonctionnalité.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Avantages */}
          <Card>
            <CardHeader>
              <CardTitle>Vos avantages</CardTitle>
              <CardDescription>
                Ce que vous obtiendrez en tant que propriétaire
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {advantages.map((advantage, index) => {
                  const Icon = advantage.icon
                  return (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{advantage.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {advantage.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Aide */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Besoin d'aide ?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <BookOpen className="h-4 w-4 mr-2" />
                Guide du propriétaire
                <ExternalLink className="h-3 w-3 ml-auto" />
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Contacter le support
                <ExternalLink className="h-3 w-3 ml-auto" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Section FAQ */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Questions fréquentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">Général</TabsTrigger>
              <TabsTrigger value="verification">Vérification</TabsTrigger>
              <TabsTrigger value="advantages">Avantages</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-6">
              <div>
                <h4 className="font-medium mb-2">Combien de temps prend la validation ?</h4>
                <p className="text-sm text-muted-foreground">
                  La validation est généralement instantanée. Seule la vérification ONECI peut prendre jusqu'à 24-48h.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Puis-je changer de rôle plus tard ?</h4>
                <p className="text-sm text-muted-foreground">
                  Oui, vous pouvez basculer entre vos rôles actifs (limite de 3 changements par jour).
                </p>
              </div>
            </TabsContent>

            <TabsContent value="verification" className="space-y-4 mt-6">
              <div>
                <h4 className="font-medium mb-2">Quels documents sont nécessaires pour ONECI ?</h4>
                <p className="text-sm text-muted-foreground">
                  Une photo de votre carte nationale d'identité ivoirienne en cours de validité.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Comment vérifier mon téléphone ?</h4>
                <p className="text-sm text-muted-foreground">
                  Vous recevrez un code SMS à 6 chiffres que vous devrez saisir pour confirmer.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="advantages" className="space-y-4 mt-6">
              <div>
                <h4 className="font-medium mb-2">Le service est-il gratuit ?</h4>
                <p className="text-sm text-muted-foreground">
                  L'inscription et les fonctionnalités de base sont gratuites. Des options premium sont disponibles.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Puis-je gérer plusieurs biens ?</h4>
                <p className="text-sm text-muted-foreground">
                  Oui, il n'y a pas de limite au nombre de biens que vous pouvez gérer.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}