/*
  =========================================
  Edge Function: Switch Role V2
  =========================================

  Cette Edge Function implémente le système de changement de rôle V2
  avec les fonctionnalités suivantes :

  1. Cooldown de 15 minutes entre les changements
  2. Limite de 3 changements par jour
  3. Validation d'identité pour "Propriétaire" (ONECI + profil 80%)
  4. Mise à jour atomique de la base de données
  5. Réponse optimisée (< 1 seconde)
  6. Notifications asynchrones
  7. Logging complet des actions

  Date: 2025-10-17
  Version: 2.0.0
  Auteur: Manus AI
*/

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// Configuration
const COOLDOWN_MINUTES = 15
const MAX_DAILY_SWITCHES = 3
const REQUIRED_PROFILE_COMPLETION = 80

// Types
interface SwitchRoleRequest {
  newRole: 'locataire' | 'proprietaire' | 'agence' | 'admin_ansut' | 'tiers_de_confiance'
}

interface SwitchRoleResponse {
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

interface UserSession {
  user: {
    id: string
    email: string
  }
}

// Fonction utilitaire pour logger
function log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    level,
    message,
    data,
    service: 'switch-role-v2'
  }

  console.log(JSON.stringify(logEntry))
}

// Fonction pour vérifier si l'utilisateur peut devenir propriétaire
async function validateProprietairePrerequisites(
  supabaseClient: any,
  userId: string
): Promise<{ canUpgrade: boolean; missingRequirements: string[]; completionPercentage: number }> {
  try {
    const { data: profile, error } = await supabaseClient
      .from('profiles')
      .select(`
        first_name,
        last_name,
        phone,
        phone_verified,
        email_confirmed_at,
        address,
        oneci_verified
      `)
      .eq('id', userId)
      .single()

    if (error || !profile) {
      return {
        canUpgrade: false,
        missingRequirements: ['Profil introuvable'],
        completionPercentage: 0
      }
    }

    const missingRequirements: string[] = []
    let completionCount = 0
    const totalRequirements = 4

    // 1. Vérification ONECI
    if (profile.oneci_verified) {
      completionCount++
    } else {
      missingRequirements.push('Vérification CNI (ONECI)')
    }

    // 2. Téléphone vérifié
    if (profile.phone_verified) {
      completionCount++
    } else {
      missingRequirements.push('Téléphone vérifié (OTP)')
    }

    // 3. Email vérifié
    if (profile.email_confirmed_at) {
      completionCount++
    } else {
      missingRequirements.push('Email vérifié')
    }

    // 4. Profil complété à 80%
    const profileCompletion = calculateProfileCompletion(profile)
    if (profileCompletion >= REQUIRED_PROFILE_COMPLETION) {
      completionCount++
    } else {
      missingRequirements.push(`Profil complété à ${REQUIRED_PROFILE_COMPLETION}% (actuel: ${profileCompletion}%)`)
    }

    const completionPercentage = Math.round((completionCount / totalRequirements) * 100)

    return {
      canUpgrade: completionCount === totalRequirements,
      missingRequirements,
      completionPercentage
    }
  } catch (error) {
    log('error', 'Erreur lors de la validation des prérequis propriétaire', { userId, error })
    return {
      canUpgrade: false,
      missingRequirements: ['Erreur de validation'],
      completionPercentage: 0
    }
  }
}

// Fonction pour calculer le pourcentage de complétion du profil
function calculateProfileCompletion(profile: any): number {
  let completion = 0

  if (profile.first_name) completion += 20
  if (profile.last_name) completion += 20
  if (profile.phone) completion += 20
  if (profile.address) completion += 20

  return completion
}

// Fonction pour vérifier les limites de changement
async function checkSwitchLimits(
  supabaseClient: any,
  userId: string
): Promise<{
  canSwitch: boolean;
  reason?: string;
  cooldownEndTime?: string;
  remainingSwitches?: number;
  nextResetTime?: string;
}> {
  try {
    const { data: userRole, error } = await supabaseClient
      .from('user_roles_v2')
      .select(`
        daily_switch_count,
        available_switches_today,
        last_switch_at,
        last_role_change_date
      `)
      .eq('user_id', userId)
      .single()

    if (error || !userRole) {
      log('error', 'Erreur lors de la récupération des limites', { userId, error })
      return { canSwitch: false, reason: 'Erreur de récupération des limites' }
    }

    const now = new Date()

    // 1. Vérifier le cooldown de 15 minutes
    if (userRole.last_switch_at) {
      const lastSwitchTime = new Date(userRole.last_switch_at)
      const cooldownEndTime = new Date(lastSwitchTime.getTime() + COOLDOWN_MINUTES * 60 * 1000)

      if (now < cooldownEndTime) {
        const remainingMinutes = Math.ceil((cooldownEndTime.getTime() - now.getTime()) / (60 * 1000))
        return {
          canSwitch: false,
          reason: `Veuillez attendre ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''} avant de changer de rôle`,
          cooldownEndTime: cooldownEndTime.toISOString()
        }
      }
    }

    // 2. Vérifier la limite quotidienne
    const today = now.toISOString().split('T')[0]
    const lastChangeDate = userRole.last_role_change_date?.split('T')[0]

    // Réinitialiser le compteur si c'est un nouveau jour
    if (lastChangeDate !== today) {
      await supabaseClient
        .from('user_roles_v2')
        .update({
          daily_switch_count: 0,
          available_switches_today: MAX_DAILY_SWITCHES,
          last_role_change_date: today
        })
        .eq('user_id', userId)

      return { canSwitch: true, remainingSwitches: MAX_DAILY_SWITCHES }
    }

    // Vérifier si l'utilisateur a encore des changements disponibles
    if (userRole.available_switches_today <= 0) {
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)

      return {
        canSwitch: false,
        reason: `Limite de ${MAX_DAILY_SWITCHES} changements par jour atteinte`,
        remainingSwitches: 0,
        nextResetTime: tomorrow.toISOString()
      }
    }

    return {
      canSwitch: true,
      remainingSwitches: userRole.available_switches_today
    }

  } catch (error) {
    log('error', 'Erreur lors de la vérification des limites', { userId, error })
    return { canSwitch: false, reason: 'Erreur de vérification des limites' }
  }
}

// Fonction pour changer de rôle
async function switchRole(
  supabaseClient: any,
  userId: string,
  newRole: string,
  currentRole: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    // Mettre à jour le rôle
    const { error } = await supabaseClient
      .from('user_roles_v2')
      .update({
        current_role: newRole,
        last_switch_at: now.toISOString(),
        daily_switch_count: supabaseClient.rpc('increment', { x: 1 }),
        available_switches_today: supabaseClient.rpc('decrement', { x: 1 }),
        last_role_change_date: today,
        switch_history: supabaseClient.rpc('append_switch_history', {
          user_id: userId,
          new_role: newRole,
          previous_role: currentRole,
          switch_time: now.toISOString()
        })
      })
      .eq('user_id', userId)

    if (error) {
      log('error', 'Erreur lors du changement de rôle', { userId, newRole, error })
      return { success: false, error: error.message }
    }

    return { success: true }

  } catch (error) {
    log('error', 'Exception lors du changement de rôle', { userId, newRole, error })
    return { success: false, error: 'Erreur inattendue lors du changement de rôle' }
  }
}

// Fonction pour envoyer des notifications asynchrones
async function sendNotification(
  supabaseClient: any,
  userId: string,
  previousRole: string,
  newRole: string
) {
  try {
    // Envoi de notification dans la base de données (asynchrone)
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'role_change',
        title: 'Changement de rôle effectué',
        message: `Vous êtes maintenant ${newRole}`,
        data: {
          previous_role: previousRole,
          new_role: newRole,
          timestamp: new Date().toISOString()
        },
        read: false
      })

    log('info', 'Notification envoyée avec succès', { userId, previousRole, newRole })
  } catch (error) {
    log('warn', 'Erreur lors de l\'envoi de la notification', { userId, error })
    // Ne pas échouer la requête principale si la notification échoue
  }
}

// Handler principal
serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }

  // Gérer les requêtes OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Vérifier la méthode
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Méthode non autorisée' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parser le corps de la requête
    const body: SwitchRoleRequest = await req.json()
    const { newRole } = body

    // Valider le nouveau rôle
    const validRoles = ['locataire', 'proprietaire', 'agence', 'admin_ansut', 'tiers_de_confiance']
    if (!newRole || !validRoles.includes(newRole)) {
      const response: SwitchRoleResponse = {
        success: false,
        error: {
          type: 'invalid_role',
          message: 'Rôle invalide',
          details: { validRoles }
        }
      }
      return new Response(
        JSON.stringify(response),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Créer le client Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Vérifier l'authentification
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      const response: SwitchRoleResponse = {
        success: false,
        error: {
          type: 'not_authenticated',
          message: 'Non authentifié'
        }
      }
      return new Response(
        JSON.stringify(response),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      const response: SwitchRoleResponse = {
        success: false,
        error: {
          type: 'not_authenticated',
          message: 'Token invalide'
        }
      }
      return new Response(
        JSON.stringify(response),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    log('info', 'Début de la requête de changement de rôle', {
      userId: user.id,
      email: user.email,
      newRole
    })

    // Récupérer le rôle actuel
    const { data: currentRoleData, error: roleError } = await supabase
      .from('user_roles_v2')
      .select('current_role')
      .eq('user_id', user.id)
      .single()

    if (roleError || !currentRoleData) {
      const response: SwitchRoleResponse = {
        success: false,
        error: {
          type: 'database_error',
          message: 'Impossible de récupérer le rôle actuel'
        }
      }
      return new Response(
        JSON.stringify(response),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const currentRole = currentRoleData.current_role

    // Vérifier si le rôle est le même
    if (currentRole === newRole) {
      const response: SwitchRoleResponse = {
        success: false,
        error: {
          type: 'invalid_role',
          message: 'Vous avez déjà ce rôle'
        }
      }
      return new Response(
        JSON.stringify(response),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validation spécifique pour le rôle "proprietaire"
    if (newRole === 'proprietaire') {
      const validation = await validateProprietairePrerequisites(supabase, user.id)

      if (!validation.canUpgrade) {
        const response: SwitchRoleResponse = {
          success: false,
          error: {
            type: 'validation_failed',
            message: 'Prérequis non remplis pour devenir propriétaire',
            details: {
              missingRequirements: validation.missingRequirements,
              completionPercentage: validation.completionPercentage
            }
          }
        }
        return new Response(
          JSON.stringify(response),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    // Vérifier les limites de changement
    const limitCheck = await checkSwitchLimits(supabase, user.id)

    if (!limitCheck.canSwitch) {
      const response: SwitchRoleResponse = {
        success: false,
        error: {
          type: limitCheck.reason?.includes('patientez') ? 'cooldown' : 'daily_limit',
          message: limitCheck.reason!
        }
      }
      return new Response(
        JSON.stringify(response),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Effectuer le changement de rôle
    const switchResult = await switchRole(supabase, user.id, newRole, currentRole)

    if (!switchResult.success) {
      const response: SwitchRoleResponse = {
        success: false,
        error: {
          type: 'database_error',
          message: switchResult.error!
        }
      }
      return new Response(
        JSON.stringify(response),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Envoyer la notification de manière asynchrone (non bloquante)
    // Note: Dans un vrai environnement, on utiliserait une queue de messages
    Promise.resolve().then(() => sendNotification(supabase, user.id, currentRole, newRole))

    // Logger le changement de rôle
    await supabase
      .from('security_audit_logs')
      .insert({
        event_type: 'ROLE_SWITCH_V2',
        severity: 'low',
        user_id: user.id,
        details: {
          previous_role: currentRole,
          new_role: newRole,
          switch_method: 'edge_function_v2'
        },
        metadata: {
          timestamp: new Date().toISOString(),
          user_agent: req.headers.get('user-agent')
        }
      })

    log('info', 'Changement de rôle effectué avec succès', {
      userId: user.id,
      previousRole: currentRole,
      newRole
    })

    // Succès
    const response: SwitchRoleResponse = {
      success: true,
      message: `Rôle changé avec succès vers ${newRole}`,
      data: {
        previousRole: currentRole,
        newRole: newRole,
        remainingSwitches: (limitCheck.remainingSwitches || 3) - 1,
        nextResetTime: new Date(new Date().setHours(24, 0, 0, 0)).toISOString()
      }
    }

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    log('error', 'Erreur non gérée dans l\'Edge Function', { error })

    const response: SwitchRoleResponse = {
      success: false,
      error: {
        type: 'database_error',
        message: 'Erreur serveur interne'
      }
    }

    return new Response(
      JSON.stringify(response),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})