/*
  =========================================
  Hook React: useRoleSwitchV2
  =========================================

  Ce hook implémente le système de changement de rôle V2 avec :

  1. React Query pour la gestion du cache et de l'état serveur
  2. Mise à jour optimiste pour une expérience utilisateur fluide
  3. Rollback automatique en cas d'erreur
  4. Calcul du cooldown et des limites en temps réel
  5. Pas de rechargement de page
  6. Gestion des erreurs avancée
  7. Support des mutations optimistes

  Date: 2025-10-17
  Version: 2.0.0
  Auteur: Manus AI
*/

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { toast } from './use-toast'
import { logger } from '@/services/logger'

// Types
type UserType = 'locataire' | 'proprietaire' | 'agence' | 'admin_ansut' | 'tiers_de_confiance'

export interface UserRoleV2 {
  user_id: string
  current_role: UserType
  roles: Array<{
    role: UserType
    added_at: string
    source?: string
    metadata?: Record<string, any>
  }>
  daily_switch_count: number
  available_switches_today: number
  last_switch_at?: string
  is_in_cooldown: boolean
  can_switch_role: boolean
  updated_at: string
}

export interface SwitchRoleResponse {
  success: boolean
  message: string
  data?: {
    previousRole: string
    newRole: string
    remainingSwitches: number
    nextResetTime: string
    cooldownEndTime?: string
  }
  error?: {
    type: 'cooldown' | 'daily_limit' | 'invalid_role' | 'not_authenticated' | 'validation_failed' | 'database_error'
    message: string
    details?: any
  }
}

export interface RoleSwitchError {
  type: 'cooldown' | 'daily_limit' | 'network' | 'validation' | 'unknown'
  message: string
  details?: any
  cooldownEndTime?: string
  nextResetTime?: string
  retryAfter?: number
}

// Clés de requête pour React Query
export const roleSwitchKeys = {
  all: ['roleSwitchV2'] as const,
  user: (userId: string) => [...roleSwitchKeys.all, 'user', userId] as const,
  limits: (userId: string) => [...roleSwitchKeys.user(userId), 'limits'] as const,
  validation: (userId: string, role: string) => [...roleSwitchKeys.user(userId), 'validation', role] as const,
}

// Fonction pour récupérer les rôles de l'utilisateur
async function fetchUserRoles(userId: string): Promise<UserRoleV2 | null> {
  try {
    const { data, error } = await supabase
      .from('user_roles_summary')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      logger.logError(error, { context: 'useRoleSwitchV2', action: 'fetchUserRoles', userId })
      throw error
    }

    return data
  } catch (error) {
    logger.logError(error as Error, { context: 'useRoleSwitchV2', action: 'fetchUserRoles', userId })
    return null
  }
}

// Fonction pour valider les prérequis pour un rôle
async function validateRolePrerequisites(userId: string, role: UserType): Promise<{
  canUpgrade: boolean
  missingRequirements: string[]
  completionPercentage: number
}> {
  try {
    // Pour le rôle propriétaire, utiliser la fonction Supabase
    if (role === 'proprietaire') {
      const { data, error } = await supabase.rpc('validate_proprietaire_prerequisites', {
        p_user_id: userId
      })

      if (error) {
        logger.logError(error, { context: 'useRoleSwitchV2', action: 'validateProprietairePrerequisites', userId })
        throw error
      }

      return data[0] || { canUpgrade: false, missingRequirements: ['Erreur de validation'], completionPercentage: 0 }
    }

    // Pour les autres rôles, validation simple
    return { canUpgrade: true, missingRequirements: [], completionPercentage: 100 }
  } catch (error) {
    logger.logError(error as Error, { context: 'useRoleSwitchV2', action: 'validateRolePrerequisites', userId, role })
    return { canUpgrade: false, missingRequirements: ['Erreur de validation'], completionPercentage: 0 }
  }
}

// Hook principal
export const useRoleSwitchV2 = () => {
  const { user, refreshProfile } = useAuth()
  const queryClient = useQueryClient()
  const [pendingRole, setPendingRole] = useState<UserType | null>(null)

  // Récupérer les rôles de l'utilisateur
  const {
    data: userRoles,
    isLoading: isLoadingRoles,
    error: rolesError,
    refetch: refetchRoles
  } = useQuery({
    queryKey: roleSwitchKeys.user(user?.id || ''),
    queryFn: () => user?.id ? fetchUserRoles(user.id) : Promise.resolve(null),
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 secondes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000, // Rafraîchir chaque minute pour le cooldown
  })

  // Calcul du temps de cooldown restant
  const cooldownTimeLeft = useCallback(() => {
    if (!userRoles?.last_switch_at || !userRoles?.is_in_cooldown) {
      return null
    }

    const lastSwitch = new Date(userRoles.last_switch_at)
    const cooldownEnd = new Date(lastSwitch.getTime() + 15 * 60 * 1000) // 15 minutes
    const now = new Date()

    if (now >= cooldownEnd) {
      return null
    }

    return Math.ceil((cooldownEnd.getTime() - now.getTime()) / 1000) // secondes
  }, [userRoles])

  // Calcul du temps jusqu'à la réinitialisation quotidienne
  const timeUntilDailyReset = useCallback(() => {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    return Math.ceil((tomorrow.getTime() - now.getTime()) / 1000) // secondes
  }, [])

  // Mutation pour changer de rôle avec mise à jour optimiste
  const switchRoleMutation = useMutation({
    mutationFn: async (newRole: UserType): Promise<SwitchRoleResponse> => {
      if (!user?.id) {
        throw new Error('Utilisateur non authentifié')
      }

      const { data, error } = await supabase.functions.invoke<SwitchRoleResponse>('switch-role-v2', {
        body: { newRole }
      })

      if (error) {
        throw error
      }

      return data
    },
    onMutate: async (newRole) => {
      // Annuler les requêtes en cours
      await queryClient.cancelQueries({ queryKey: roleSwitchKeys.user(user!.id) })

      // Sauvegarder les données précédentes pour rollback
      const previousRoles = queryClient.getQueryData<UserRoleV2>(roleSwitchKeys.user(user!.id))

      // Mise à jour optimiste du cache
      if (previousRoles) {
        const optimisticUpdate: UserRoleV2 = {
          ...previousRoles,
          current_role: newRole,
          daily_switch_count: previousRoles.daily_switch_count + 1,
          available_switches_today: Math.max(0, previousRoles.available_switches_today - 1),
          last_switch_at: new Date().toISOString(),
          is_in_cooldown: true,
          can_switch_role: false
        }

        queryClient.setQueryData(roleSwitchKeys.user(user!.id), optimisticUpdate)
      }

      setPendingRole(newRole)

      return { previousRoles }
    },
    onError: (error, newRole, context) => {
      // Rollback en cas d'erreur
      if (context?.previousRoles) {
        queryClient.setQueryData(roleSwitchKeys.user(user!.id), context.previousRoles)
      }

      logger.logError(error as Error, { context: 'useRoleSwitchV2', action: 'switchRole', newRole })
      setPendingRole(null)
    },
    onSuccess: async (data, newRole) => {
      setPendingRole(null)

      if (data.success) {
        // Rafraîchir le profil pour mettre à jour l'état global
        await refreshProfile()

        // Rafraîchir les données de rôles
        await refetchRoles()

        toast({
          title: "✅ Rôle changé avec succès",
          description: data.message,
          duration: 3000,
        })

        logger.info('Changement de rôle réussi', {
          userId: user?.id,
          newRole,
          response: data.data
        })
      } else {
        // Gérer les erreurs de la réponse
        const errorDetails = data.error

        let errorMessage = errorDetails?.message || 'Une erreur est survenue'
        let toastTitle = "Erreur"
        let toastVariant: "default" | "destructive" = "destructive"

        if (errorDetails?.type === 'cooldown') {
          const cooldownMinutes = Math.ceil((cooldownTimeLeft() || 0) / 60)
          errorMessage = `Veuillez attendre ${cooldownMinutes} minute${cooldownMinutes > 1 ? 's' : ''} avant de changer de rôle`
          toastTitle = "⏰ En attente"
        } else if (errorDetails?.type === 'daily_limit') {
          const hoursUntilReset = Math.floor((timeUntilDailyReset() || 0) / 3600)
          const minutesUntilReset = Math.floor(((timeUntilDailyReset() || 0) % 3600) / 60)
          errorMessage = `Limite quotidienne atteinte. Réinitialisation dans ${hoursUntilReset}h${minutesUntilReset}min`
          toastTitle = "📊 Limite atteinte"
        } else if (errorDetails?.type === 'validation_failed') {
          toastTitle = "⚠️ Prérequis manquants"
          if (errorDetails.details?.missingRequirements) {
            errorMessage = `Prérequis manquants: ${errorDetails.details.missingRequirements.join(', ')}`
          }
        }

        toast({
          title: toastTitle,
          description: errorMessage,
          variant: toastVariant,
          duration: 5000,
        })

        // Rafraîchir les données pour mettre à jour les limites
        await refetchRoles()
      }
    },
    onSettled: () => {
      // Refetch pour s'assurer que les données sont à jour
      queryClient.invalidateQueries({ queryKey: roleSwitchKeys.user(user!.id) })
    }
  })

  // Fonction pour changer de rôle
  const switchRole = useCallback(async (newRole: UserType) => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour changer de rôle",
        variant: "destructive",
      })
      return
    }

    if (userRoles?.current_role === newRole) {
      toast({
        title: "Information",
        description: "Vous avez déjà ce rôle",
        duration: 3000,
      })
      return
    }

    // Vérifier si le changement est possible
    if (!userRoles?.can_switch_role) {
      if (userRoles?.is_in_cooldown) {
        const cooldownMinutes = Math.ceil((cooldownTimeLeft() || 0) / 60)
        toast({
          title: "⏰ En attente",
          description: `Veuillez attendre ${cooldownMinutes} minute${cooldownMinutes > 1 ? 's' : ''} avant de changer de rôle`,
          variant: "destructive",
        })
      } else if (userRoles?.available_switches_today === 0) {
        const hoursUntilReset = Math.floor((timeUntilDailyReset() || 0) / 3600)
        toast({
          title: "📊 Limite atteinte",
          description: `Limite quotidienne atteinte. Réinitialisation dans ${hoursUntilReset}h`,
          variant: "destructive",
        })
      }
      return
    }

    // Lancer la mutation
    switchRoleMutation.mutate(newRole)
  }, [user, userRoles, switchRoleMutation, cooldownTimeLeft, timeUntilDailyReset])

  // Validation des prérequis pour un rôle
  const validateRolePrerequisitesQuery = useQuery({
    queryKey: roleSwitchKeys.validation(user?.id || '', ''),
    queryFn: () => {
      if (!user?.id) return Promise.resolve({ canUpgrade: true, missingRequirements: [], completionPercentage: 100 })
      return validateRolePrerequisites(user.id, 'proprietaire')
    },
    enabled: false, // Cette requête sera lancée manuellement
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Fonction pour valider les prérequis
  const validateRolePrerequisites = useCallback(async (role: UserType) => {
    if (!user?.id) return { canUpgrade: false, missingRequirements: ['Non authentifié'], completionPercentage: 0 }

    try {
      const result = await validateRolePrerequisites(user.id, role)
      return result
    } catch (error) {
      logger.logError(error as Error, { context: 'useRoleSwitchV2', action: 'validateRolePrerequisites', role })
      return { canUpgrade: false, missingRequirements: ['Erreur de validation'], completionPercentage: 0 }
    }
  }, [user])

  // Rôles disponibles (filtrés)
  const availableRoles = useCallback(() => {
    if (!userRoles?.roles) return []
    return userRoles.roles.map(r => r.role).filter(role => role !== 'admin_ansut') // Exclure admin des choix visibles
  }, [userRoles])

  // L'utilisateur a-t-il plusieurs rôles ?
  const hasMultipleRoles = (availableRoles().length || 0) > 1

  // Effet pour gérer le cooldown timer
  useEffect(() => {
    if (!userRoles?.is_in_cooldown) return

    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: roleSwitchKeys.user(user!.id) })
    }, 5000) // Vérifier toutes les 5 secondes pendant le cooldown

    return () => clearInterval(interval)
  }, [userRoles?.is_in_cooldown, queryClient, user])

  return {
    // État
    userRoles,
    currentRole: userRoles?.current_role,
    availableRoles: availableRoles(),
    hasMultipleRoles,

    // État de chargement
    isLoading: isLoadingRoles || switchRoleMutation.isPending,
    isSwitching: switchRoleMutation.isPending,
    pendingRole,

    // Limites et cooldowns
    cooldownTimeLeft: cooldownTimeLeft(),
    timeUntilDailyReset: timeUntilDailyReset(),
    remainingSwitches: userRoles?.available_switches_today || 3,
    canSwitchRole: userRoles?.can_switch_role || false,
    isInCooldown: userRoles?.is_in_cooldown || false,

    // Actions
    switchRole,
    validateRolePrerequisites,
    refetchRoles,

    // Erreurs
    error: rolesError || switchRoleMutation.error,

    // Utilitaires
    formatTimeLeft: (seconds: number | null) => {
      if (!seconds || seconds <= 0) return null

      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const secs = seconds % 60

      if (hours > 0) {
        return `${hours}h${minutes}min`
      } else if (minutes > 0) {
        return `${minutes}min${secs}s`
      } else {
        return `${secs}s`
      }
    }
  }
}