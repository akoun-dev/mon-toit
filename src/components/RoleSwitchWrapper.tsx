/*
  =========================================
  Composant: RoleSwitchWrapper
  =========================================

  Ce composant sert de wrapper pour gérer la transition
  entre l'ancien système V1 et le nouveau système V2 :

  1. Détecte si l'utilisateur a accès au système V2
  2. Affiche le composant approprié (V1 ou V2)
  3. Permet une migration progressive
  4. Assure la rétrocompatibilité

  Date: 2025-10-23
  Version: 1.0.0
  Auteur: Claude Code
*/

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRoleSwitch } from '@/hooks/useRoleSwitch'
import { useRoleSwitchV2 } from '@/hooks/useRoleSwitchV2'
import { RoleSwitcherCompact } from '@/components/navigation/RoleSwitcherCompact'
import RoleSwitcherV2 from '@/components/RoleSwitcherV2'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import {
  AlertTriangle,
  Info,
  Settings,
  Zap,
  Rocket,
  CheckCircle2
} from 'lucide-react'

interface RoleSwitchWrapperProps {
  variant?: 'compact' | 'full'
  className?: string
  showFullInfo?: boolean
}

export const RoleSwitchWrapper = ({
  variant = 'compact',
  className,
  showFullInfo = false
}: RoleSwitchWrapperProps) => {
  const { user, profile } = useAuth()

  // Hooks V1 et V2
  const roleSwitchV1 = useRoleSwitch()
  const roleSwitchV2 = useRoleSwitchV2()

  // État local pour gérer le choix du système
  const [useV2, setUseV2] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [v2Available, setV2Available] = useState(false)
  const [migrationStatus, setMigrationStatus] = useState<'not-migrated' | 'migrating' | 'migrated'>('not-migrated')

  // Détecter si le système V2 est disponible
  useEffect(() => {
    const checkV2Availability = async () => {
      if (!user?.id) return

      try {
        // Tenter de récupérer les données V2
        const response = await fetch('/api/role-switch-v2/status', {
          headers: {
            'Authorization': `Bearer ${user.session?.access_token}`
          }
        })

        // Si la requête réussit, le système V2 est disponible
        setV2Available(response.ok)

        if (response.ok) {
          const data = await response.json()
          setMigrationStatus(data.migrated ? 'migrated' : 'not-migrated')
        }
      } catch (error) {
        // En cas d'erreur, le système V2 n'est pas disponible
        console.log('Système V2 non disponible, utilisation du V1')
        setV2Available(false)
      }
    }

    checkV2Availability()
  }, [user])

  // Utiliser le système V2 par défaut si disponible
  const shouldUseV2 = v2Available && useV2

  // Si l'utilisateur n'a pas de rôle multiple, ne rien afficher
  const hasMultipleRolesV1 = roleSwitchV1.hasMultipleRoles
  const hasMultipleRolesV2 = roleSwitchV2.hasMultipleRoles
  const hasMultipleRoles = shouldUseV2 ? hasMultipleRolesV2 : hasMultipleRolesV1

  if (!hasMultipleRoles) {
    return null
  }

  // Composant d'indicateur de version
  const VersionIndicator = () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="h-6 px-2 text-xs"
          >
            {shouldUseV2 ? (
              <>
                <Zap className="h-3 w-3 mr-1 text-blue-500" />
                V2
              </>
            ) : (
              <>
                <Settings className="h-3 w-3 mr-1 text-gray-500" />
                V1
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            {shouldUseV2 ? (
              <div>
                <div className="font-medium text-green-600">Nouveau système V2</div>
                <div className="text-muted-foreground">Plus rapide et sécurisé</div>
              </div>
            ) : (
              <div>
                <div className="font-medium text-orange-600">Ancien système V1</div>
                <div className="text-muted-foreground">Fonctionnel mais plus lent</div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )

  // Panneau de configuration
  const SettingsPanel = () => {
    if (!showSettings || !v2Available) return null

    return (
      <div className="absolute top-full right-0 mt-2 w-80 bg-background border border-border rounded-lg shadow-lg z-50 p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Rocket className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Système de changement de rôle</span>
            </div>
            <VersionIndicator />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="use-v2" className="text-sm">
                Utiliser le nouveau système V2
              </Label>
              <Switch
                id="use-v2"
                checked={useV2}
                onCheckedChange={setUseV2}
              />
            </div>

            {useV2 && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <div className="font-medium mb-1">Avantages du système V2:</div>
                  <ul className="space-y-1 text-xs">
                    <li>• 2x plus rapide (&lt; 1s)</li>
                    <li>• Pas de rechargement de page</li>
                    <li>• Validation renforcée</li>
                    <li>• Cooldown intelligent</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {!useV2 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  L'ancien système V1 est fonctionnel mais plus lent.
                  Nous recommandons d'utiliser le nouveau système V2.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>État de migration:</span>
              <Badge variant={migrationStatus === 'migrated' ? 'default' : 'secondary'}>
                {migrationStatus === 'migrated' ? 'Migré' : migrationStatus === 'migrating' ? 'En cours' : 'Non migré'}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Conteneur principal
  return (
    <div className="relative">
      {/* Indicateur de version */}
      <div className="absolute -top-2 -right-2 z-10">
        <VersionIndicator />
      </div>

      {/* Composant de changement de rôle */}
      {shouldUseV2 ? (
        <RoleSwitcherV2
          variant={variant}
          className={className}
          showFullInfo={showFullInfo}
        />
      ) : (
        <RoleSwitcherCompact />
      )}

      {/* Panneau de configuration */}
      <SettingsPanel />

      {/* Alerte de migration si nécessaire */}
      {v2Available && !useV2 && (
        <Alert className="mt-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Une version plus rapide et sécurisée est disponible.
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 ml-1 text-xs"
              onClick={() => setUseV2(true)}
            >
              Activer le système V2
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default RoleSwitchWrapper