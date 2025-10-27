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

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  text: string;
  variables?: Record<string, any>;
}

/**
 * Service d'envoi d'emails via SMTP
 */
class EmailService {
  private isDevelopment = import.meta.env.DEV;
  private useSmtp = import.meta.env.VITE_SMTP_HOST && import.meta.env.VITE_SMTP_USER; // Utiliser SMTP si configuré

  /**
   * Envoyer un email via SMTP
   */
  async sendEmail(data: EmailData): Promise<{ success: boolean; error?: string; messageId?: string }> {
    try {
      // Toujours utiliser SMTP (Gmail) qu'il soit configuré ou non
      logger.info('Sending email via SMTP (Gmail)', {
        to: data.to,
        subject: data.subject,
        development: this.isDevelopment
      });
      return await this.sendEmailViaSMTP(data);
    } catch (error) {
      logger.error('Failed to send email', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Envoyer un email via SMTP (Gmail)
   */
  private async sendEmailViaSMTP(data: EmailData): Promise<{ success: boolean; error?: string; messageId?: string }> {
    try {
      // Utiliser l'API backend pour envoyer via SMTP
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          to: data.to,
          subject: data.subject,
          html: data.html,
          text: data.text,
          from: data.from,
          replyTo: data.replyTo
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        logger.error('SMTP API error', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        return {
          success: false,
          error: `SMTP API error: ${response.status} ${response.statusText}`
        };
      }

      const result = await response.json();
      logger.info('Email sent successfully via SMTP', { messageId: result.messageId });

      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      logger.error('Failed to send email via SMTP', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Envoyer un email de confirmation d'inscription
   */
  async sendWelcomeEmail(userEmail: string, userName: string): Promise<{ success: boolean; error?: string }> {
    const template = this.getWelcomeEmailTemplate(userName);

    const result = await this.sendEmail({
      to: userEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
      from: 'noreply@mon-toit.ci',
      replyTo: 'support@mon-toit.ci'
    });

    if (result.success) {
      logger.info('Welcome email sent', { userEmail });
    }

    return result;
  }

  /**
   * Envoyer un email de confirmation de contact
   */
  async sendContactNotification(
    propertyId: string,
    guestName: string,
    guestEmail: string,
    guestPhone: string,
    message: string
  ): Promise<{ success: boolean; error?: string }> {
    const template = this.getContactNotificationTemplate(propertyId, guestName, guestEmail, guestPhone, message);

    const result = await this.sendEmail({
      to: 'notifications@mon-toit.ci',
      subject: template.subject,
      html: template.html,
      text: template.text,
      replyTo: guestEmail
    });

    if (result.success) {
      logger.info('Contact notification sent', { propertyId, guestEmail });
    }

    return result;
  }

  /**
   * Envoyer un email de notification de candidature
   */
  async sendApplicationNotification(
    propertyId: string,
    applicantName: string,
    applicantEmail: string,
    propertyName: string
  ): Promise<{ success: boolean; error?: string }> {
    const template = this.getApplicationNotificationTemplate(propertyId, applicantName, applicantEmail, propertyName);

    const result = await this.sendEmail({
      to: 'applications@mon-toit.ci',
      subject: template.subject,
      html: template.html,
      text: template.text,
      replyTo: applicantEmail
    });

    if (result.success) {
      logger.info('Application notification sent', { propertyId, applicantEmail });
    }

    return result;
  }

  /**
   * Envoyer un email de réinitialisation de mot de passe
   */
  async sendPasswordResetEmail(userEmail: string, resetToken: string): Promise<{ success: boolean; error?: string }> {
    const resetUrl = `${window.location.origin}/reset-password?token=${resetToken}`;
    const template = this.getPasswordResetTemplate(resetUrl);

    const result = await this.sendEmail({
      to: userEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    });

    if (result.success) {
      logger.info('Password reset email sent', { userEmail });
    }

    return result;
  }


  // Templates d'emails

  private getWelcomeEmailTemplate(userName: string): EmailTemplate {
    return {
      id: 'welcome',
      name: 'Email de bienvenue',
      subject: 'Bienvenue sur Mon Toit - Plateforme Immobilière Certifiée ANSUT',
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
              <p>Cet email a été envoyé depuis l'environnement de développement de Mon Toit.</p>
              <p>© 2025 Mon Toit - Tous droits réservés</p>
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
      `
    };
  }

  private getContactNotificationTemplate(
    propertyId: string,
    guestName: string,
    guestEmail: string,
    guestPhone: string,
    message: string
  ): EmailTemplate {
    return {
      id: 'contact',
      name: 'Notification de contact',
      subject: `Nouveau message de ${guestName} - Propriété ${propertyId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Notification de contact</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px;">
          <h2>📧 Nouveau message de contact</h2>

          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
            <p><strong>De :</strong> ${guestName}</p>
            <p><strong>Email :</strong> ${guestEmail}</p>
            <p><strong>Téléphone :</strong> ${guestPhone}</p>
            <p><strong>Propriété :</strong> ${propertyId}</p>
          </div>

          <h3>💬 Message :</h3>
          <div style="background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 5px; white-space: pre-wrap;">${message}</div>

          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">

          <p style="font-size: 12px; color: #666;">
            Cet email a été généré automatiquement par Mon Toit - ${new Date().toLocaleString('fr-FR')}
          </p>
        </body>
        </html>
      `,
      text: `
        Nouveau message de contact de ${guestName}

        Email : ${guestEmail}
        Téléphone : ${guestPhone}
        Propriété : ${propertyId}

        Message :
        ${message}

        Généré le ${new Date().toLocaleString('fr-FR')}
      `
    };
  }

  private getApplicationNotificationTemplate(
    propertyId: string,
    applicantName: string,
    applicantEmail: string,
    propertyName: string
  ): EmailTemplate {
    return {
      id: 'application',
      name: 'Notification de candidature',
      subject: `Nouvelle candidature de ${applicantName} pour ${propertyName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Notification de candidature</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px;">
          <h2>📋 Nouvelle candidature reçue</h2>

          <div style="background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 10px 0;">
            <p><strong>Candidat :</strong> ${applicantName}</p>
            <p><strong>Email :</strong> ${applicantEmail}</p>
            <p><strong>Propriété :</strong> ${propertyName} (${propertyId})</p>
          </div>

          <p>Une nouvelle candidature a été soumise et nécessite votre attention.</p>

          <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 10px 0; border-left: 4px solid #ffc107;">
            <p><strong>Action requise :</strong></p>
            <p>Veuillez examiner cette candidature dans votre tableau de bord et prendre une décision.</p>
          </div>

          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">

          <p style="font-size: 12px; color: #666;">
            Cet email a été généré automatiquement par Mon Toit - ${new Date().toLocaleString('fr-FR')}
          </p>
        </body>
        </html>
      `,
      text: `
        Nouvelle candidature reçue de ${applicantName}

        Email : ${applicantEmail}
        Propriété : ${propertyName} (${propertyId})

        Une nouvelle candidature a été soumise et nécessite votre attention.
        Veuillez l'examiner dans votre tableau de bord.

        Généré le ${new Date().toLocaleString('fr-FR')}
      `
    };
  }

  private getPasswordResetTemplate(resetUrl: string): EmailTemplate {
    return {
      id: 'password-reset',
      name: 'Réinitialisation de mot de passe',
      subject: 'Mon Toit - Réinitialisation de votre mot de passe',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Réinitialisation de mot de passe</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px;">
          <h2>🔐 Réinitialisation de votre mot de passe</h2>

          <p>Vous avez demandé à réinitialiser votre mot de passe pour votre compte Mon Toit.</p>

          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h3>🔗 Cliquez sur le lien ci-dessous</h3>
            <p style="word-break: break-all; background: white; padding: 10px; border-radius: 4px; margin: 10px 0;">
              <a href="${resetUrl}" style="color: #1976d2; text-decoration: none; font-weight: bold;">
                ${resetUrl}
              </a>
            </p>
          </div>

          <div style="background: #fff3e0; padding: 15px; border-radius: 5px; border-left: 4px solid #ff9800;">
            <p><strong>⚠️ Sécurité :</strong></p>
            <ul>
              <li>Ce lien expirera dans 1 heure</li>
              <li>Ne partagez jamais ce lien</li>
              <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
            </ul>
          </div>

          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">

          <p style="font-size: 12px; color: #666; text-align: center;">
            Cet email a été généré automatiquement par Mon Toit - ${new Date().toLocaleString('fr-FR')}
          </p>
        </body>
        </html>
      `,
      text: `
        Réinitialisation de votre mot de passe Mon Toit

        Vous avez demandé à réinitialiser votre mot de passe.

        Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :
        ${resetUrl}

        Ce lien expirera dans 1 heure.
        Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.

        Généré le ${new Date().toLocaleString('fr-FR')}
      `
    };
  }

  // Utilitaires de conversion

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
export const emailService = new EmailService();
export default emailService;

// Export des types pour utilisation dans d'autres modules
export type { EmailService as EmailServiceType, EmailData, EmailTemplate };