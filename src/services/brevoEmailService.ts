import { logger } from '@/services/logger';

interface EmailData {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    type?: string;
  }>;
}

interface BrevoEmailResponse {
  messageId?: string;
  success: boolean;
  error?: string;
}

/**
 * Service d'envoi d'emails via Brevo API
 */
class BrevoEmailService {
  private apiKey: string;
  private baseUrl: string;
  private isDevelopment: boolean;

  constructor() {
    this.apiKey = import.meta.env.VITE_BREVO_API_KEY || '';
    this.baseUrl = import.meta.env.VITE_BREVO_BASE_URL || 'https://api.brevo.com/v3';
    this.isDevelopment = import.meta.env.DEV;

    if (!this.apiKey) {
      logger.warn('🔧 Brevo API key not configured - emails will be logged only');
    }
  }

  /**
   * Envoyer un email via Brevo API
   */
  async sendEmail(data: EmailData): Promise<BrevoEmailResponse> {
    try {
      logger.info('📧 [Brevo] Sending email', {
        to: data.to,
        subject: data.subject,
        hasApiKey: !!this.apiKey,
        development: this.isDevelopment
      });

      // En développement, logger sans envoyer
      if (this.isDevelopment && !this.apiKey) {
        logger.info('📧 [Development] Email would be sent:', {
          to: data.to,
          subject: data.subject,
          htmlLength: data.html?.length || 0,
          textLength: data.text?.length || 0
        });

        return {
          success: true,
          messageId: `dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
      }

      if (!this.apiKey) {
        return {
          success: false,
          error: 'Brevo API key not configured'
        };
      }

      const payload = {
        sender: {
          name: 'Mon Toit',
          email: data.from || 'noreply@mon-toit.ci'
        },
        to: Array.isArray(data.to)
          ? data.to.map(email => ({ email }))
          : [{ email: data.to }],
        subject: data.subject,
        htmlContent: data.html || this.textToHtml(data.text || ''),
       textContent: data.text || this.htmlToText(data.html || ''),
        replyTo: data.replyTo ? { email: data.replyTo } : undefined,
        attachment: data.attachments?.map(att => ({
          name: att.filename,
          content: att.content,
          contentType: att.type || 'application/octet-stream'
        }))
      };

      const response = await fetch(`${this.baseUrl}/smtp/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.text();
        logger.error('❌ [Brevo] API error', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });

        return {
          success: false,
          error: `Brevo API error: ${response.status} ${response.statusText} - ${errorData}`
        };
      }

      const result = await response.json();
      logger.info('✅ [Brevo] Email sent successfully', {
        messageId: result.messageId,
        to: data.to
      });

      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      logger.error('💥 [Brevo] Failed to send email', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Envoyer un code OTP par email
   */
  async sendOTPCode(
    email: string,
    code: string,
    type: 'signup' | 'reset_password' | 'email_change' = 'signup'
  ): Promise<BrevoEmailResponse> {
    const formattedCode = this.formatOTPCode(code);
    const typeText = type === 'signup' ? 'Inscription' :
                    type === 'reset_password' ? 'Réinitialisation' : 'Changement d\'email';

    const template = this.generateOTPTemplate(formattedCode, typeText, email);

    return this.sendEmail({
      to: email,
      subject: `🔐 Code OTP - Mon Toit (${typeText})`,
      html: template.html,
      text: template.text,
      from: 'noreply@mon-toit.ci',
      replyTo: 'support@mon-toit.ci'
    });
  }

  /**
   * Envoyer un email de bienvenue
   */
  async sendWelcomeEmail(userEmail: string, userName: string): Promise<BrevoEmailResponse> {
    const template = this.getWelcomeEmailTemplate(userName);

    return this.sendEmail({
      to: userEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
      from: 'noreply@mon-toit.ci',
      replyTo: 'support@mon-toit.ci'
    });
  }

  /**
   * Envoyer un email de réinitialisation de mot de passe
   */
  async sendPasswordResetEmail(userEmail: string, resetToken: string): Promise<BrevoEmailResponse> {
    const resetUrl = `${window.location.origin}/reset-password?token=${resetToken}`;
    const template = this.getPasswordResetTemplate(resetUrl);

    return this.sendEmail({
      to: userEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  /**
   * Vérifier la configuration Brevo
   */
  checkConfiguration(): { configured: boolean; missing: string[] } {
    const missing = [];
    if (!this.apiKey) missing.push('VITE_BREVO_API_KEY');
    if (!this.baseUrl) missing.push('VITE_BREVO_BASE_URL');

    return {
      configured: missing.length === 0,
      missing
    };
  }

  // Templates privés

  private generateOTPTemplate(code: string, typeText: string, email: string) {
    return {
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Code OTP - Mon Toit</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .code-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
            .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; font-family: monospace; }
            .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #666; }
            .security { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 0 5px 5px 0; }
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
              <div class="code">${code}</div>
            </div>

            <div class="security">
              <p><strong>⚠️ Important :</strong></p>
              <ul>
                <li>Entrez ce code dans les 24 heures</li>
                <li>Ne partagez jamais ce code avec personne</li>
                <li>Mon Toit ne vous demandera jamais ce code par téléphone</li>
              </ul>
            </div>

            <p>Si vous n'avez pas demandé ce code, vous pouvez ignorer cet email en toute sécurité.</p>
          </div>

          <div class="footer">
            <p>Cet email a été envoyé automatiquement par Mon Toit - Plateforme immobilière certifiée ANSUT</p>
            <p>Pour toute question, contactez notre support : support@mon-toit.ci</p>
            <p>© 2025 Mon Toit - Tous droits réservés</p>
          </div>
        </body>
        </html>
      `,
      text: `
        ${typeText} - Mon Toit

        Votre code de vérification est : ${code}

        Instructions :
        - Entrez ce code dans les 24 heures
        - Ne partagez jamais ce code avec personne
        - Mon Toit ne vous demandera jamais ce code par téléphone

        Si vous n'avez pas demandé ce code, vous pouvez ignorer cet email.

        ---
        Mon Toit - Plateforme immobilière certifiée ANSUT
        Support: support@mon-toit.ci
        © 2025 Tous droits réservés
      `
    };
  }

  private getWelcomeEmailTemplate(userName: string) {
    return {
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bienvenue sur Mon Toit</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 10px; margin-top: 20px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🏠 Mon Toit</div>
              <h1>Bienvenue ${userName} !</h1>
              <p>Votre compte a été créé avec succès</p>
            </div>
            <div class="content">
              <h2>🎉 Merci de vous joindre à notre plateforme</h2>
              <p>Mon Toit est la première plateforme immobilière certifiée ANSUT en Côte d'Ivoire, dédiée à la location sécurisée et transparente.</p>

              <h3>🚀 Prochaines étapes</h3>
              <ul>
                <li>Complétez votre profil pour une meilleure visibilité</li>
                <li>Explorez nos biens immobiliers certifiés</li>
                <li>Postulez aux locations qui vous intéressent</li>
              </ul>

              <div style="text-align: center;">
                <a href="${window.location.origin}/explorer" class="button">Explorer les biens</a>
              </div>
            </div>
            <div class="footer">
              <p>© 2025 Mon Toit - Tous droits réservés</p>
              <p>Support: support@mon-toit.ci</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Bienvenue sur Mon Toit, ${userName} !

        Votre compte a été créé avec succès sur notre plateforme immobilière certifiée ANSUT.

        Mon Toit est la première plateforme immobilière certifiée ANSUT en Côte d'Ivoire, dédiée à la location sécurisée et transparente.

        Connectez-vous pour explorer nos biens certifiés et postuler aux locations.

        À bientôt !
        L'équipe Mon Toit
        support@mon-toit.ci
        © 2025 Tous droits réservés
      `
    };
  }

  private getPasswordResetTemplate(resetUrl: string) {
    return {
      subject: 'Mon Toit - Réinitialisation de votre mot de passe',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Réinitialisation de mot de passe</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center; border-bottom: 3px solid #007bff; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 10px; margin: 20px 0; }
            .button { display: inline-block; padding: 15px 30px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .security { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 0 5px 5px 0; }
            .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Réinitialisation de votre mot de passe</h1>
              <p>Mon Toit - Sécurité de votre compte</p>
            </div>

            <div class="content">
              <p>Bonjour,</p>
              <p>Vous avez demandé à réinitialiser votre mot de passe pour votre compte Mon Toit.</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" class="button">🔗 Réinitialiser mon mot de passe</a>
              </div>

              <div class="security">
                <p><strong>⚠️ Informations de sécurité :</strong></p>
                <ul>
                  <li>Ce lien expirera dans 1 heure</li>
                  <li>Ne partagez jamais ce lien</li>
                  <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
                </ul>
              </div>

              <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
              <p style="word-break: break-all; background: white; padding: 10px; border-radius: 4px; border: 1px solid #ddd;">
                <a href="${resetUrl}" style="color: #007bff;">${resetUrl}</a>
              </p>
            </div>

            <div class="footer">
              <p>Cet email a été envoyé automatiquement par Mon Toit</p>
              <p>Support: support@mon-toit.ci | © 2025 Tous droits réservés</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Réinitialisation de votre mot de passe - Mon Toit

        Bonjour,

        Vous avez demandé à réinitialiser votre mot de passe.

        Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :
        ${resetUrl}

        Informations de sécurité :
        - Ce lien expirera dans 1 heure
        - Ne partagez jamais ce lien
        - Si vous n'avez pas demandé cette réinitialisation, ignorez cet email

        Si vous avez des questions, contactez notre support : support@mon-toit.ci

        Mon Toit - Plateforme immobilière certifiée ANSUT
        © 2025 Tous droits réservés
      `
    };
  }

  // Utilitaires

  private formatOTPCode(code: string): string {
    // Format: XXX-XXX si le code a 6 chiffres
    if (code.length === 6) {
      return `${code.slice(0, 3)}-${code.slice(3)}`;
    }
    return code;
  }

  private textToHtml(text: string): string {
    return text
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<br[^>]*>/gi, '\n')
      .replace(/<\/?[^>]+>/gi, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .trim();
  }
}

// Export du service singleton
export const brevoEmailService = new BrevoEmailService();
export default brevoEmailService;

// Export des types
export type { BrevoEmailService, EmailData };