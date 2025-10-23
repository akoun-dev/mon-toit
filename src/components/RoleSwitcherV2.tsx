/*
  =========================================
  Composant: RoleSwitcherV2
  =========================================

  Ce composant implémente l'interface utilisateur pour le système
  de changement de rôle V2 avec :

  1. 2 variantes (compact et full)
  2. Modal de confirmation avant changement
  3. Affichage du cooldown et des limites
  4. Animations fluides et micro-interactions
  5. Gestion d'état avancée
  6. Accessibilité optimale

  Date: 2025-10-17
  Version: 2.0.0
  Auteur: Manus AI
*/

import { useState, useEffect } from 'react'
import { useRoleSwitchV2 } from '@/hooks/useRoleSwitchV2'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

// Icons
import {
  Home,
  Building2,
  Briefcase,
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  UserCheck,
  Info,
  RefreshCw
} from 'lucide-react'

// Types
type UserType = 'locataire' | 'proprietaire' | 'agence' | 'admin_ansut' | 'tiers_de_confiance'
type Variant = 'compact' | 'full'

// Configuration des rôles
const roleConfig = {
  locataire: {
    label: 'Locataire',
    description: 'Recherchez et postulez aux annonces',
    icon: Home,
    gradient: 'from-blue-500/10 to-blue-500/5',
    borderColor: 'border-blue-200/50',
    iconColor: 'text-blue-600',
    badgeColor: 'bg-blue-100 text-blue-800',
    hoverColor: 'hover:bg-blue-50/50',
  },
  proprietaire: {
    label: 'Propriétaire',
    description: 'Gérez vos biens et recevez des candidatures',
    icon: Building2,
    gradient: 'from-green-500/10 to-green-500/5',
    borderColor: 'border-green-200/50',
    iconColor: 'text-green-600',
    badgeColor: 'bg-green-100 text-green-800',
    hoverColor: 'hover:bg-green-50/50',
  },
  agence: {
    label: 'Agence',
    description: 'Gérez un portefeuille de biens',
    icon: Briefcase,
    gradient: 'from-purple-500/10 to-purple-500/5',
    borderColor: 'border-purple-200/50',
    iconColor: 'text-purple-600',
    badgeColor: 'bg-purple-100 text-purple-800',
    hoverColor: 'hover:bg-purple-50/50',
  },
  tiers_de_confiance: {
    label: 'Tiers de confiance',
    description: 'Validez les dossiers et médiations',
    icon: Shield,
    gradient: 'from-orange-500/10 to-orange-500/5',
    borderColor: 'border-orange-200/50',
    iconColor: 'text-orange-600',
    badgeColor: 'bg-orange-100 text-orange-800',
    hoverColor: 'hover:bg-orange-50/50',
  },
} as const

interface RoleSwitcherV2Props {
  variant?: Variant
  className?: string
  showFullInfo?: boolean
}

// Composant principal
export const RoleSwitcherV2 = ({
  variant = 'compact',
  className,
  showFullInfo = false
}: RoleSwitcherV2Props) => {
  const {
    currentRole,
    availableRoles,
    hasMultipleRoles,
    isSwitching,
    pendingRole,
    canSwitchRole,
    isInCooldown,
    cooldownTimeLeft,
    remainingSwitches,
    timeUntilDailyReset,
    switchRole,
    validateRolePrerequisites,
    formatTimeLeft,
    error
  } = useRoleSwitchV2()

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    targetRole: UserType | null
  }>({ open: false, targetRole: null })

  const [validation, setValidation] = useState<{
    [role: string]: { canUpgrade: boolean; missingRequirements: string[]; completionPercentage: number }
  }>({})

  // Validation des prérequis au chargement du composant
  useEffect(() => {
    const validateRoles = async () => {
      const validations: typeof validation = {}

      for (const role of ['proprietaire'] as UserType[]) {
        if (availableRoles.includes(role)) {
          try {
            const result = await validateRolePrerequisites(role)
            validations[role] = result
          } catch (error) {
            console.error(`Erreur validation ${role}:`, error)
            validations[role] = { canUpgrade: false, missingRequirements: ['Erreur'], completionPercentage: 0 }
          }
        }
      }

      setValidation(validations)
    }

    if (availableRoles.length > 0) {
      validateRoles()
    }
  }, [availableRoles, validateRolePrerequisites])

  // Filtrer les rôles à afficher (exclure admin)
  const displayRoles = availableRoles.filter(role => role !== 'admin_ansut')
  const currentConfig = currentRole ? roleConfig[currentRole as keyof typeof roleConfig] : null

  // Gestion du changement de rôle
  const handleRoleSwitch = async (targetRole: UserType) => {
    // Validation pour le rôle propriétaire
    if (targetRole === 'proprietaire' && validation[targetRole]) {
      const validationResult = validation[targetRole]
      if (!validationResult.canUpgrade) {
        // Afficher les prérequis manquants
        setConfirmDialog({
          open: true,
          targetRole: targetRole
        })
        return
      }
    }

    // Pour les autres rôles ou si validation réussie, afficher la confirmation
    setConfirmDialog({
      open: true,
      targetRole: targetRole
    })
  }

  // Confirmation du changement de rôle
  const confirmRoleSwitch = async () => {
    if (confirmDialog.targetRole) {
      await switchRole(confirmDialog.targetRole)
      setConfirmDialog({ open: false, targetRole: null })
    }
  }

  // Rendu compact (switch simple pour 2 rôles, dropdown pour +)
  if (variant === 'compact' && currentConfig && hasMultipleRoles) {
    // Switch pour 2 rôles
    if (displayRoles.length === 2) {
      const otherRole = displayRoles.find(r => r !== currentRole) as UserType
      const otherConfig = roleConfig[otherRole]
      const CurrentIcon = currentConfig.icon

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300",
                "bg-gradient-to-r border shadow-sm hover:shadow-md",
                currentConfig.gradient,
                currentConfig.borderColor,
                !canSwitchRole && "opacity-75 cursor-not-allowed",
                className
              )}>
                <div className="flex items-center gap-2">
                  <CurrentIcon className={cn("h-4 w-4", currentConfig.iconColor)} />
                  <Label className="text-sm font-medium cursor-pointer">
                    {currentConfig.label}
                  </Label>
                </div>

                {isSwitching ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <Switch
                    checked={currentRole === displayRoles[1]}
                    onCheckedChange={() => handleRoleSwitch(otherRole)}
                    disabled={!canSwitchRole || isSwitching}
                    className="transition-all duration-300"
                  />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {canSwitchRole ? (
                <p>Basculer vers {otherConfig?.label}</p>
              ) : isInCooldown ? (
                <p>En attente: {formatTimeLeft(cooldownTimeLeft)}</p>
              ) : (
                <p>Limite quotidienne atteinte</p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    // Dropdown pour 3+ rôles
    const CurrentIcon = currentConfig.icon

    return (
      <TooltipProvider>
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300",
                    "bg-gradient-to-r border shadow-sm hover:shadow-md",
                    currentConfig.gradient,
                    currentConfig.borderColor,
                    !canSwitchRole && "opacity-75",
                    className
                  )}
                  disabled={!canSwitchRole || isSwitching}
                >
                  <CurrentIcon className={cn("h-4 w-4", currentConfig.iconColor)} />
                  <span className="text-sm font-medium">{currentConfig.label}</span>
                  {isSwitching && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                  {!isSwitching && canSwitchRole && (
                    <RefreshCw className="h-3 w-3 ml-1 opacity-70" />
                  )}
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Changer de rôle ({remainingSwitches}/{3} restants)</p>
            </TooltipContent>
          </Tooltip>

          <DropdownMenuContent align="end" className="w-64">
            <div className="px-2 py-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>Changements aujourd'hui</span>
                <Badge variant="outline" className="text-xs">
                  {remainingSwitches}/3
                </Badge>
              </div>

              {isInCooldown && (
                <Alert className="mb-2">
                  <Clock className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Attendez {formatTimeLeft(cooldownTimeLeft)} avant de changer
                  </AlertDescription>
                </Alert>
              )}

              {!canSwitchRole && !isInCooldown && (
                <Alert className="mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Limite atteinte. Réinitialisation dans {formatTimeLeft(timeUntilDailyReset)}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {displayRoles.map((role) => {
              const roleConfig = roleConfig[role as keyof typeof roleConfig]
              const RoleIcon = roleConfig.icon
              const isActive = role === currentRole
              const isPending = role === pendingRole
              const validationResult = validation[role]

              return (
                <DropdownMenuItem
                  key={role}
                  onClick={() => !isActive && handleRoleSwitch(role)}
                  disabled={isActive || isSwitching || !canSwitchRole}
                  className={cn(
                    "flex items-center gap-3 cursor-pointer transition-all duration-300",
                    isActive && "bg-primary/10 font-medium",
                    !canSwitchRole && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <RoleIcon className={cn("h-4 w-4", roleConfig.iconColor)} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span>{roleConfig.label}</span>
                      {isActive && (
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      )}
                      {isPending && (
                        <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                      )}
                    </div>
                    {validationResult && !validationResult.canUpgrade && (
                      <p className="text-xs text-amber-600 mt-0.5">
                        {validationResult.missingRequirements.length} prérequis manquant(s)
                      </p>
                    )}
                  </div>
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipProvider>
    )
  }

  // Rendu full (carte complète)
  if (variant === 'full' && currentConfig) {
    return (
      <Card className={cn("w-full max-w-md", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Gestion des Rôles
          </CardTitle>
          <CardDescription>
            {hasMultipleRoles
              ? 'Basculez entre vos différents rôles sans vous reconnecter'
              : 'Gérez vos rôles et accédez à plus de fonctionnalités'
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* État actuel */}
          <div className={cn(
            "p-4 rounded-xl border-2 transition-all duration-300",
            currentConfig.borderColor,
            currentConfig.gradient
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", currentConfig.badgeColor)}>
                  <currentConfig.icon className={cn("h-5 w-5", currentConfig.iconColor)} />
                </div>
                <div>
                  <h4 className="font-semibold">Rôle actuel</h4>
                  <p className="text-sm text-muted-foreground">
                    {currentConfig.label}
                  </p>
                </div>
              </div>
              <Badge className={currentConfig.badgeColor}>
                Actif
              </Badge>
            </div>
          </div>

          {/* Informations sur les limites */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Changements aujourd'hui</span>
              <Badge variant={remainingSwitches > 0 ? "default" : "destructive"}>
                {remainingSwitches}/3
              </Badge>
            </div>

            {isInCooldown && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Temps d'attente restant: <strong>{formatTimeLeft(cooldownTimeLeft)}</strong>
                </AlertDescription>
              </Alert>
            )}

            {!canSwitchRole && !isInCooldown && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Limite quotidienne atteinte. Réinitialisation dans {formatTimeLeft(timeUntilDailyReset)}.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Autres rôles disponibles */}
          {displayRoles.length > 1 && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-muted-foreground">Autres rôles disponibles</h5>
              <div className="space-y-2">
                {displayRoles.filter(role => role !== currentRole).map((role) => {
                  const roleConfig = roleConfig[role as keyof typeof roleConfig]
                  const RoleIcon = roleConfig.icon
                  const validationResult = validation[role]

                  return (
                    <div
                      key={role}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border transition-all duration-300",
                        roleConfig.hoverColor,
                        "border-border/50 hover:border-border cursor-pointer",
                        !canSwitchRole && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={() => canSwitchRole && handleRoleSwitch(role)}
                    >
                      <div className="flex items-center gap-3">
                        <RoleIcon className={cn("h-4 w-4", roleConfig.iconColor)} />
                        <div>
                          <p className="font-medium text-sm">{roleConfig.label}</p>
                          {validationResult && !validationResult.canUpgrade && (
                            <p className="text-xs text-amber-600">
                              {validationResult.missingRequirements.length} prérequis manquant(s)
                            </p>
                          )}
                        </div>
                      </div>

                      {canSwitchRole ? (
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Info className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Erreurs */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Une erreur est survenue: {error.message}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    )
  }

  // Modal de confirmation
  <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Confirmer le changement de rôle</DialogTitle>
        <DialogDescription>
          {confirmDialog.targetRole && (() => {
            const targetConfig = roleConfig[confirmDialog.targetRole as keyof typeof roleConfig]
            const validation = confirmDialog.targetRole ? validation[confirmDialog.targetRole] : null

            if (confirmDialog.targetRole === 'proprietaire' && validation && !validation.canUpgrade) {
              return (
                <div className="space-y-3">
                  <p>Vous ne pouvez pas encore devenir propriétaire. Prérequis manquants:</p>
                  <div className="space-y-2">
                    {validation.missingRequirements.map((req, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-amber-600">
                        <AlertTriangle className="h-4 w-4" />
                        {req}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Complétion</span>
                      <span>{validation.completionPercentage}%</span>
                    </div>
                    <Progress value={validation.completionPercentage} className="h-2" />
                  </div>
                </div>
              )
            }

            return (
              <div className="space-y-3">
                <p>
                  Vous êtes sur le point de changer votre rôle de <strong>{currentConfig?.label}</strong> vers{' '}
                  <strong>{targetConfig?.label}</strong>.
                </p>

                {confirmDialog.targetRole === 'proprietaire' && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      En tant que propriétaire, vous pourrez gérer vos biens et recevoir des candidatures.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="h-4 w-4" />
                  <span>
                    {remainingSwitches > 1
                      ? `Il vous restera ${remainingSwitches - 1} changement${remainingSwitches - 1 > 1 ? 's' : ''} aujourd'hui`
                      : 'Ce sera votre dernier changement aujourd\'hui'
                    }
                  </span>
                </div>

                {isInCooldown && (
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      Notez qu'il y a un temps d'attente de 15 minutes entre chaque changement.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )
          })()}
        </DialogDescription>
      </DialogHeader>

      <DialogFooter className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => setConfirmDialog({ open: false, targetRole: null })}
          disabled={isSwitching}
        >
          Annuler
        </Button>

        {confirmDialog.targetRole && validation[confirmDialog.targetRole]?.canUpgrade !== false && (
          <Button
            onClick={confirmRoleSwitch}
            disabled={isSwitching || !canSwitchRole}
            className="min-w-[100px]"
          >
            {isSwitching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Changement...
              </>
            ) : (
              <>
                Confirmer
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  </Dialog>

  // Pas de rendu si un seul rôle et variant compact
  if (variant === 'compact' && !hasMultipleRoles) {
    return null
  }

  return null
}

export default RoleSwitcherV2