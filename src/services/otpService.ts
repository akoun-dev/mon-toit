import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';

export interface OTPCode {
  id: string;
  user_id: string;
  email: string;
  code: string;
  type: 'signup' | 'reset_password' | 'email_change';
  attempts: number;
  max_attempts: number;
  expires_at: string;
  used_at?: string;
  created_at: string;
  updated_at: string;
  ip_address?: string;
  user_agent?: string;
}

export interface OTPNotification {
  id: string;
  user_id: string;
  email: string;
  otp_code_id: string;
  type: 'signup' | 'reset_password' | 'email_change';
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  provider: string;
  message_id?: string;
  error_message?: string;
  sent_at?: string;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
  ip_address?: string;
  user_agent?: string;
  device_fingerprint?: string;
}

export interface OTPCreateResult {
  success: boolean;
  code?: string;
  message: string;
}

export interface OTPVerifyResult {
  success: boolean;
  message: string;
  user_id?: string;
}

class OTPService {
  /**
   * Crée et envoie un code OTP
   */
  async createOTPCode(
    userId: string,
    email: string,
    type: 'signup' | 'reset_password' | 'email_change' = 'signup',
    ipAddress?: string,
    userAgent?: string
  ): Promise<OTPCreateResult> {
    try {
      logger.info('🔑 [OTP] Starting OTP code creation', { userId, email, type });

      // 🔍 DEBUG: Utiliser une approche alternative si RPC n'est pas disponible
      // @ts-ignore - Les types ne sont pas générés pour les tables OTP
      const { data, error } = await supabase.rpc('create_otp_code' as any, {
        p_user_id: userId,
        p_email: email,
        p_type: type,
        p_ip_address: ipAddress,
        p_user_agent: userAgent
      });

      logger.info('🔑 [OTP] RPC call completed', {
        hasData: !!data,
        hasError: !!error,
        error: error?.message
      });

      if (error) {
        logger.error('Error creating OTP code', { error, userId, email });
        return {
          success: false,
          message: error.message
        };
      }

      const result = data?.[0];
      if (!result) {
        logger.error('🔑 [OTP] No result from RPC call', { userId, email, data });
        return {
          success: false,
          message: 'Erreur lors de la création du code OTP'
        };
      }

      logger.info('🔑 [OTP] Code creation result', {
        success: result.success,
        code: result.code ? result.code.replace(/./g, '*') : 'null', // Masquer le code dans les logs
        message: result.message,
        userId,
        email
      });

      return {
        success: result.success,
        code: result.code,
        message: result.message
      };

    } catch (error) {
      logger.error('Unexpected error creating OTP code', { error, userId, email });
      return {
        success: false,
        message: 'Erreur inattendue lors de la création du code OTP'
      };
    }
  }

  /**
   * Vérifie un code OTP
   */
  async verifyOTPCode(
    email: string,
    code: string,
    type: 'signup' | 'reset_password' | 'email_change' = 'signup'
  ): Promise<OTPVerifyResult> {
    try {
      logger.info('Verifying OTP code', { email, code: code.replace(/./g, '*'), type });

      // 🔍 DEBUG: Utiliser une approche alternative si RPC n'est pas disponible
      // @ts-ignore - Les types ne sont pas générés pour les tables OTP
      const { data, error } = await supabase.rpc('verify_otp_code' as any, {
        p_email: email,
        p_code: code,
        p_type: type
      });

      if (error) {
        logger.error('Error verifying OTP code', { error, email });
        return {
          success: false,
          message: error.message
        };
      }

      const result = data?.[0];
      if (!result) {
        return {
          success: false,
          message: 'Erreur lors de la vérification du code OTP'
        };
      }

      logger.info('OTP code verification completed', {
        success: result.success,
        message: result.message,
        userId: result.user_id,
        email
      });

      return {
        success: result.success,
        message: result.message,
        user_id: result.user_id
      };

    } catch (error) {
      logger.error('Unexpected error verifying OTP code', { error, email });
      return {
        success: false,
        message: 'Erreur inattendue lors de la vérification du code OTP'
      };
    }
  }

  /**
   * Envoie un code OTP par email en utilisant directement l'API Mailpit en développement
   */
  async sendOTPByEmail(
    email: string,
    code: string,
    type: 'signup' | 'reset_password' | 'email_change' = 'signup'
  ): Promise<{ success: boolean; error?: string; mailpitUrl?: string }> {
    try {
      // 🔍 DEBUG: Vérifier la configuration Mailpit
      const mailpitUrl = import.meta.env.VITE_MAILPIT_URL;
      const isDevelopment = import.meta.env.DEV;

      logger.info('🔍 [OTP] Démarrage envoi email', {
        mailpitUrl,
        nodeEnv: import.meta.env.NODE_ENV,
        isDevelopment,
        hasImportMeta: !!import.meta.env,
        envKeys: Object.keys(import.meta.env),
        email,
        type,
        code: code.replace(/./g, '*'),
        codeLength: code.length
      });

      // Envoyer via l'API Mailpit si disponible
      if (mailpitUrl) {
        logger.info('📤 [OTP] Envoi direct via API Mailpit', { email, mailpitUrl });

        // Créer un email simple pour le développement
        const emailData = {
          from: {
            name: 'Mon Toit',
            email: 'noreply@mon-toit.ci'
          },
          to: [{
            name: '',
            email: email
          }],
          subject: `🔐 Code OTP - Mon Toit (${type})`,
          html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Code de vérification</h2>
            <p>Votre code OTP est : <strong style="font-size: 24px; color: #667eea;">${this.formatOTPCode(code)}</strong></p>
            <p>Ce code expire dans 24 heures.</p>
            <hr>
            <p><small>Pour le développement : vérifiez dans <a href="${mailpitUrl}">Mailpit</a></small></p>
          </div>`,
          text: `Votre code OTP est : ${this.formatOTPCode(code)}`
        };

        logger.info('📤 [OTP] Données email préparées', {
          email,
          subject: emailData.subject,
          fromEmail: emailData.from.email,
          toEmail: emailData.to[0].email
        });

        try {
          // Utiliser le proxy Vite pour éviter les problèmes CORS
          const apiUrl = `/api/mailpit/send`;
          logger.info('📤 [OTP] Envoi via proxy', { apiUrl, originalUrl: `${mailpitUrl}/api/v1/send` });

          const mailpitResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailData)
          });

          logger.info('📤 [OTP] Réponse Mailpit reçue', {
            status: mailpitResponse.status,
            statusText: mailpitResponse.statusText,
            ok: mailpitResponse.ok
          });

          if (!mailpitResponse.ok) {
            const errorText = await mailpitResponse.text();
            logger.error('❌ [OTP] Échec envoi Mailpit', {
              status: mailpitResponse.status,
              statusText: mailpitResponse.statusText,
              errorText,
              email
            });
            return {
              success: false,
              error: `Erreur Mailpit (${mailpitResponse.status}): ${errorText}`
            };
          }

          const result = await mailpitResponse.json();
          logger.info('✅ [OTP] Email envoyé avec succès via Mailpit', {
            email,
            type,
            code: code.replace(/./g, '*'),
            messageId: result.id
          });

          return {
            success: true,
            mailpitUrl: mailpitUrl
          };

        } catch (fetchError) {
          logger.error('💥 [OTP] Erreur fetch Mailpit', {
            error: fetchError instanceof Error ? fetchError.message : 'Unknown error',
            errorType: fetchError instanceof Error ? fetchError.constructor.name : 'Unknown',
            email,
            mailpitUrl,
            stack: fetchError instanceof Error ? fetchError.stack : undefined,
            isNetworkError: fetchError instanceof TypeError,
            errorMessage: fetchError.message,
            errorDetails: {
              name: fetchError.name,
              message: fetchError.message,
              cause: fetchError.cause
            }
          });
          return {
            success: false,
            error: `Erreur réseau: ${fetchError instanceof Error ? fetchError.message : 'Erreur inconnue'}`
          };
        }
      } else {
        // Pas de Mailpit configuré
        logger.error('❌ [OTP] Aucune configuration Mailpit trouvée', {
          mailpitUrl,
          email,
          type,
          envMailpitUrl: import.meta.env.VITE_MAILPIT_URL
        });
        return {
          success: false,
          error: 'Configuration Mailpit manquante'
        };
      }

    } catch (error) {
      logger.error('💥 [OTP] Erreur inattendue sendOTPByEmail', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email,
        stack: error instanceof Error ? error.stack : undefined
      });
      return {
        success: false,
        error: 'Erreur inattendue lors de l\'envoi de l\'email'
      };
    }
  }

  /**
   * Génère le HTML pour l'email OTP (surtout pour le développement)
   */
  private generateOTPEmailHTML(
    code: string,
    type: 'signup' | 'reset_password' | 'email_change',
    email: string,
    mailpitUrl: string
  ): string {
    const formattedCode = this.formatOTPCode(code);
    const typeText = type === 'signup' ? 'Inscription' : type === 'reset_password' ? 'Réinitialisation' : 'Changement d\'email';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Code OTP - Mon Toit</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .code-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; font-family: monospace; }
          .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #666; }
          .debug-info { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0; border-radius: 5px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🔐 ${typeText} - Mon Toit</h1>
          <p>Code de vérification à usage unique</p>
        </div>

        <div class="content">
          <p>Bonjour,</p>
          <p>Pour finaliser votre ${typeText.toLowerCase()} sur Mon Toit, veuillez utiliser le code de vérification suivant :</p>

          <div class="code-box">
            <div class="code">${formattedCode}</div>
          </div>

          <p><strong>Instructions :</strong></p>
          <ul>
            <li>Entrez ce code à 6 chiffres dans la page de vérification</li>
            <li>Le code expire dans 24 heures</li>
            <li>Ne partagez jamais ce code avec personne</li>
          </ul>

          <div class="debug-info">
            <strong>🔍 INFORMATIONS DE DÉBOGAGE (DÉVELOPPEMENT)</strong><br>
            Email: ${email}<br>
            Code brut: ${code}<br>
            Type: ${type}<br>
            Mailpit URL: <a href="${mailpitUrl}">${mailpitUrl}</a><br>
            Timestamp: ${new Date().toISOString()}
          </div>

          <p>Si vous n'avez pas demandé ce code, vous pouvez ignorer cet email en toute sécurité.</p>
        </div>

        <div class="footer">
          <p>Cet email a été envoyé automatiquement par Mon Toit - Plateforme immobilière certifiée ANSUT</p>
          <p>Pour toute question, contactez notre support technique.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Récupère les codes OTP d'un utilisateur
   */
  async getUserOTPCodes(userId: string): Promise<OTPCode[]> {
    try {
      // 🔍 DEBUG: Utiliser une approche alternative si la table n'est pas dans les types
      // @ts-expect-error - Les types ne sont pas générés pour les tables OTP
      const { data, error } = await supabase
        .from('otp_codes' as any)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching user OTP codes', { error, userId });
        throw error;
      }

      return data || [];

    } catch (error) {
      logger.error('Unexpected error fetching user OTP codes', { error, userId });
      throw error;
    }
  }

  /**
   * Récupère les notifications OTP d'un utilisateur
   */
  async getUserOTPNotifications(userId: string): Promise<OTPNotification[]> {
    try {
      // 🔍 DEBUG: Utiliser une approche alternative si la table n'est pas dans les types
      // @ts-ignore - Les types ne sont pas générés pour les tables OTP
      const { data, error } = await supabase
        .from('otp_notifications' as any)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching user OTP notifications', { error, userId });
        throw error;
      }

      return data || [];

    } catch (error) {
      logger.error('Unexpected error fetching user OTP notifications', { error, userId });
      throw error;
    }
  }

  /**
   * Nettoie les anciens codes OTP
   */
  async cleanupOldOTPCodes(daysOld: number = 30): Promise<number> {
    try {
      // 🔍 DEBUG: Utiliser une approche alternative si RPC n'est pas disponible
      // @ts-ignore - Les types ne sont pas générés pour les tables OTP
      const { data, error } = await supabase.rpc('cleanup_old_otp_notifications' as any, {
        p_days_old: daysOld
      });

      if (error) {
        logger.error('Error cleaning up old OTP codes', { error });
        throw error;
      }

      const deletedCount = data || 0;
      logger.info('Cleaned up old OTP codes', { deletedCount, daysOld });

      return deletedCount;

    } catch (error) {
      logger.error('Unexpected error cleaning up old OTP codes', { error });
      throw error;
    }
  }

  /**
   * Vérifie si un utilisateur a des codes OTP actifs
   */
  async hasActiveOTPCodes(userId: string, email: string): Promise<boolean> {
    try {
      // 🔍 DEBUG: Utiliser une approche alternative si la table n'est pas dans les types
      // @ts-ignore - Les types ne sont pas générés pour les tables OTP
      const { data, error } = await supabase
        .from('otp_codes' as any)
        .select('id')
        .eq('user_id', userId)
        .eq('email', email)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .limit(1);

      if (error) {
        logger.error('Error checking active OTP codes', { error, userId });
        return false;
      }

      return (data && data.length > 0) || false;

    } catch (error) {
      logger.error('Unexpected error checking active OTP codes', { error, userId });
      return false;
    }
  }

  /**
   * Formate le code OTP pour l'affichage
   */
  formatOTPCode(code: string): string {
    // Format: XXX-XXX si le code a 6 chiffres
    if (code.length === 6) {
      return `${code.slice(0, 3)}-${code.slice(3)}`;
    }
    return code;
  }

  /**
   * Génère un code OTP de test (uniquement pour le développement)
   */
  generateTestOTPCode(): string {
    // Générer un code simple pour les tests
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}

export const otpService = new OTPService();
export default otpService;