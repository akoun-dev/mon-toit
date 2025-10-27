import { supabase, supabasePublic } from '@/lib/supabase';
import { logger } from '@/services/logger';
import { emailService } from '@/services/emailService';

/**
 * Generate a UUID v4 compatible string for temporary user IDs
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Generate a temporary user ID with UUID format for development
 */
function generateTempUserId(email: string): string {
  return generateUUID(); // Always return a proper UUID for database compatibility
}

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
      const { data, error } = await supabasePublic.rpc('create_otp_code' as any, {
        email_param: email,
        code_type_param: type,
        temp_user_id_param: userId
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

      // La fonction retourne directement un objet JSON, pas un tableau
      const result = data;
      if (!result) {
        logger.error('🔑 [OTP] No result from RPC call', { userId, email, data });
        return {
          success: false,
          message: 'Erreur lors de la création du code OTP'
        };
      }

      logger.info('🔑 [OTP] Code creation result', {
        success: result.success,
        code: result.token ? result.token.replace(/./g, '*') : 'null', // Masquer le code dans les logs
        message: result.message,
        userId,
        email
      });

      return {
        success: result.success,
        code: result.token, // Utiliser 'token' au lieu de 'code'
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
      const { data, error } = await supabasePublic.rpc('verify_otp_code_simple' as any, {
        email_param: email,
        code_param: code,
        code_type_param: type
      });

      if (error) {
        logger.error('Error verifying OTP code', { error, email });
        return {
          success: false,
          message: error.message
        };
      }

      // La fonction retourne directement un objet JSON, pas un tableau
      const result = data;
      if (!result) {
        return {
          success: false,
          message: 'Erreur lors de la vérification du code OTP'
        };
      }

      logger.info('OTP code verification completed', {
        success: result.verified, // Utiliser 'verified' au lieu de 'success'
        message: result.message,
        email
      });

      return {
        success: result.verified, // Utiliser 'verified' au lieu de 'success'
        message: result.message,
        user_id: undefined // La fonction ne retourne pas user_id
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
   * Envoie un code OTP par email en utilisant le service email existant
   */
  async sendOTPByEmail(
    email: string,
    code: string,
    type: 'signup' | 'reset_password' | 'email_change' = 'signup'
  ): Promise<{ success: boolean; error?: string; messageId?: string }> {
    try {
      logger.info('📧 [OTP] Starting email sending', {
        email,
        type,
        code: code.replace(/./g, '*'),
        environment: import.meta.env.MODE
      });

      // Utiliser le template OTP existant
      const emailSubject = type === 'signup' ? 'Code de vérification - Mon Toit' :
                        type === 'reset_password' ? 'Réinitialisation du mot de passe - Mon Toit' :
                        'Changement d\'email - Mon Toit';

      const emailHtml = this.generateOTPEmailHTML(code, type, email, import.meta.env.VITE_MAILPIT_URL || '');

      // Utiliser le service email existant pour envoyer l'email OTP
      const result = await emailService.sendEmail({
        to: email,
        subject: emailSubject,
        html: emailHtml,
        text: `Votre code de vérification Mon Toit est : ${code}`,
        from: import.meta.env.VITE_SMTP_GMAIL_FROM || 'noreply@mon-toit.ci',
        replyTo: 'support@mon-toit.ci'
      });

      logger.info('📧 [OTP] Email sending result', {
        email,
        type,
        success: result.success,
        messageId: result.messageId,
        error: result.error
      });

      // Afficher le code dans la console pour le développement
      if (import.meta.env.DEV) {
        console.log(`🔐 [OTP] CODE DE DÉVELOPPEMENT: ${code}`);
        console.log(`📧 [OTP] Email: ${email}`);
        console.log(`📋 [OTP] Type: ${type}`);
        console.log(`📧 [OTP] Message ID: ${result.messageId}`);
      }

      return result;

    } catch (error) {
      logger.error('💥 [OTP] Unexpected error in sendOTPByEmail', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email,
        stack: error instanceof Error ? error.stack : undefined
      });
      return {
        success: false,
        error: 'Erreur inattendue lors de l\'envoi de l\'email OTP'
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
      const { data, error } = await supabasePublic.rpc('cleanup_old_otp_notifications' as any);

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

  /**
   * Génère un code de test pour un email spécifique
   */
  generateTestCode(email: string): string {
    // Pour le développement, toujours retourner 123456
    return '123456';
  }

  /**
   * Vérifie si un email a été vérifié avec OTP (stockage local pour le développement)
   */
  isEmailVerified(email: string, type: 'signup' | 'reset_password' | 'email_change' = 'signup'): boolean {
    try {
      const storageKey = `otp_verified_${email}_${type}`;
      const verified = localStorage.getItem(storageKey);
      if (verified) {
        const data = JSON.parse(verified);
        // Vérifier si la vérification est encore valide (24 heures)
        const isValid = new Date().getTime() - data.timestamp < 24 * 60 * 60 * 1000;
        if (!isValid) {
          localStorage.removeItem(storageKey);
          return false;
        }
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Error checking email verification', { error, email });
      return false;
    }
  }

  /**
   * Vérifie un code OTP (version simplifiée pour le développement)
   */
  async verifyOTP(
    email: string,
    token: string,
    type: 'signup' | 'reset_password' | 'email_change' = 'signup'
  ): Promise<OTPVerifyResult> {
    try {
      logger.info('🔍 [OTP] Starting OTP verification', { email, token: token.replace(/./g, '*'), type });

      // En développement, accepter le code de test
      if (import.meta.env.DEV && token === '123456') {
        logger.info('✅ [OTP] Using test code in development', { email });
        
        // Marquer l'email comme vérifié
        const storageKey = `otp_verified_${email}_${type}`;
        localStorage.setItem(storageKey, JSON.stringify({
          verified: true,
          timestamp: new Date().getTime(),
          email,
          type
        }));

        return {
          success: true,
          message: 'Code vérifié avec succès (mode développement)',
          user_id: generateTempUserId(email)
        };
      }

      // Utiliser la fonction RPC pour la vérification en production
      const { data, error } = await supabasePublic.rpc('verify_otp_code_simple' as any, {
        email_param: email,
        code_param: token,
        code_type_param: 'signup'
      });

      if (error) {
        logger.error('❌ [OTP] RPC verification failed', { error, email });
        return {
          success: false,
          message: error.message || 'Code invalide ou expiré'
        };
      }

      const result = data;
      if (!result || !result.verified) {
        return {
          success: false,
          message: result?.message || 'Code invalide ou expiré'
        };
      }

      // Marquer l'email comme vérifié localement
      const storageKey = `otp_verified_${email}_${type}`;
      localStorage.setItem(storageKey, JSON.stringify({
        verified: true,
        timestamp: new Date().getTime(),
        email,
        type
      }));

      logger.info('✅ [OTP] Verification successful', { email, type });
      
      return {
        success: true,
        message: result.message || 'Code vérifié avec succès',
        user_id: result.user_id
      };

    } catch (error) {
      logger.error('💥 [OTP] Unexpected error in verifyOTP', { error, email });
      return {
        success: false,
        message: 'Erreur technique lors de la vérification du code'
      };
    }
  }

  /**
   * Crée et envoie un code OTP (méthode combinée pour simplifier le flux)
   */
  async createAndSendOTP(
    email: string,
    type: 'signup' | 'reset_password' | 'email_change' = 'signup'
  ): Promise<OTPCreateResult> {
    try {
      logger.info('🔑 [OTP] Starting create and send OTP', { email, type });

      // Générer un user_id temporaire pour le développement avec format UUID valide
      const userId = generateTempUserId(email);

      // Créer le code OTP
      const createResult = await this.createOTPCode(userId, email, type);
      
      if (!createResult.success || !createResult.code) {
        return createResult;
      }

      // Envoyer le code par email
      const sendResult = await this.sendOTPByEmail(email, createResult.code, type);
      
      if (!sendResult.success) {
        return {
          success: false,
          message: sendResult.error || 'Erreur lors de l\'envoi de l\'email'
        };
      }

      logger.info('✅ [OTP] Create and send completed successfully', { email, type });
      
      return {
        success: true,
        code: createResult.code,
        message: `Code envoyé à ${email}. En développement, utilisez: ${createResult.code}`
      };

    } catch (error) {
      logger.error('💥 [OTP] Unexpected error in createAndSendOTP', { error, email });
      return {
        success: false,
        message: 'Erreur technique lors de la création du code OTP'
      };
    }
  }

  /**
   * Nettoie les codes OTP expirés (version simplifiée)
   */
  cleanupExpiredOTPs(): void {
    try {
      const keys = Object.keys(localStorage);
      const now = new Date().getTime();
      
      keys.forEach(key => {
        if (key.startsWith('otp_verified_')) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            if (data.timestamp && (now - data.timestamp > 24 * 60 * 60 * 1000)) {
              localStorage.removeItem(key);
              logger.info('🧹 [OTP] Cleaned up expired OTP verification', { key });
            }
          } catch (parseError) {
            // Nettoyer les clés invalides
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      logger.error('Error cleaning up expired OTPs', { error });
    }
  }
}

export const otpService = new OTPService();
export default otpService;