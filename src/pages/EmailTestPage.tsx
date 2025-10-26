import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { emailService } from '@/services/emailService';
import { brevoEmailService } from '@/services/brevoEmailService';
import { Mail, Send, CheckCircle2, ExternalLink, Globe } from 'lucide-react';

export const EmailTestPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testMessage, setTestMessage] = useState('Ceci est un message de test depuis Mon Toit.');
  const [sentEmails, setSentEmails] = useState<any[]>([]);
  const { toast } = useToast();

  const handleSendTestEmail = async () => {
    setIsLoading(true);
    try {
      const result = await emailService.sendEmail({
        to: testEmail,
        subject: 'Test Email - Mon Toit',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #667eea;">🧪 Email de Test</h2>
            <p>Bonjour,</p>
            <p>Ceci est un email de test pour vérifier que le service Mailpit fonctionne correctement.</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
              <p><strong>Message test:</strong></p>
              <p>${testMessage}</p>
            </div>
            <p>Cordialement,<br>L'équipe Mon Toit</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #666;">
              Envoyé depuis Mon Toit - ${new Date().toLocaleString('fr-FR')}
            </p>
          </div>
        `,
        text: `Email de test\n\nCeci est un email de test pour vérifier que le service Mailpit fonctionne correctement.\n\nMessage: ${testMessage}\n\nEnvoyé depuis Mon Toit - ${new Date().toLocaleString('fr-FR')}`
      });

      if (result.success) {
        toast({
          title: 'Email envoyé avec succès !',
          description: `ID du message: ${result.messageId}`,
        });

        // Rafraîchir la liste des emails envoyés
        await fetchSentEmails();
      } else {
        toast({
          title: 'Erreur lors de l\'envoi',
          description: result.error || 'Erreur inconnue',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de l\'envoi de l\'email',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendWelcomeEmail = async () => {
    setIsLoading(true);
    try {
      const result = await emailService.sendWelcomeEmail(testEmail, 'Utilisateur Test');

      if (result.success) {
        toast({
          title: 'Email de bienvenue envoyé !',
          description: `Envoyé à: ${testEmail}`,
        });
        await fetchSentEmails();
      } else {
        toast({
          title: 'Erreur',
          description: result.error || 'Erreur inconnue',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendContactNotification = async () => {
    setIsLoading(true);
    try {
      const result = await emailService.sendContactNotification(
        'prop-123',
        'Jean Test',
        testEmail,
        '+225 01 23 45 67 89',
        testMessage
      );

      if (result.success) {
        toast({
          title: 'Notification de contact envoyée !',
          description: 'Email envoyé aux notifications',
        });
        await fetchSentEmails();
      } else {
        toast({
          title: 'Erreur',
          description: result.error || 'Erreur inconnue',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSentEmails = async () => {
    try {
      const result = await emailService.getSentEmails();
      if (result.success && result.emails) {
        setSentEmails(result.emails.messages || []);
      }
    } catch (error) {
      console.error('Error fetching sent emails:', error);
    }
  };

  const handleSendBrevoTestEmail = async () => {
    setIsLoading(true);
    try {
      const result = await brevoEmailService.sendEmail({
        to: testEmail,
        subject: '🧪 Test Brevo - Mon Toit',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #667eea;">🧪 Email de Test Brevo</h2>
            <p>Bonjour,</p>
            <p>Ceci est un email de test pour vérifier que le service Brevo fonctionne correctement.</p>
            <div style="background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 10px 0;">
              <p><strong>Message test:</strong></p>
              <p>${testMessage}</p>
            </div>
            <p>Cordialement,<br>L'équipe Mon Toit</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #666;">
              Envoyé via Brevo depuis Mon Toit - ${new Date().toLocaleString('fr-FR')}
            </p>
          </div>
        `,
        text: `Email de test Brevo\n\nCeci est un email de test pour vérifier que le service Brevo fonctionne correctement.\n\nMessage: ${testMessage}\n\nEnvoyé via Brevo depuis Mon Toit - ${new Date().toLocaleString('fr-FR')}`
      });

      if (result.success) {
        toast({
          title: 'Email Brevo envoyé avec succès !',
          description: `ID du message: ${result.messageId}`,
        });
      } else {
        toast({
          title: 'Erreur Brevo',
          description: result.error || 'Erreur inconnue',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOTPTest = async () => {
    setIsLoading(true);
    try {
      const result = await brevoEmailService.sendOTPCode(testEmail, '123456', 'signup');

      if (result.success) {
        toast({
          title: 'OTP envoyé avec succès !',
          description: `ID du message: ${result.messageId}`,
        });
      } else {
        toast({
          title: 'Erreur OTP',
          description: result.error || 'Erreur inconnue',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearMailbox = async () => {
    try {
      const result = await emailService.clearMailbox();
      if (result.success) {
        toast({
          title: 'Boîte de réception vidée',
          description: 'Tous les emails ont été supprimés',
        });
        setSentEmails([]);
      } else {
        toast({
          title: 'Erreur',
          description: result.error || 'Impossible de vider la boîte',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  };

  // Charger les emails envoyés au montage du composant
  React.useEffect(() => {
    fetchSentEmails();
  }, []);

  const mailpitUrl = emailService.getMailpitUrl();
  const brevoConfig = brevoEmailService.checkConfiguration();

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🧪 Test Email Services</h1>
        <p className="text-muted-foreground">
          Testez les services d'envoi d'emails (Mailpit développement & Brevo production)
        </p>

        {/* Configuration Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className={`p-4 rounded-lg border ${brevoConfig.configured ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-4 w-4" />
              <h3 className="font-semibold">Configuration Brevo</h3>
            </div>
            {brevoConfig.configured ? (
              <p className="text-sm text-green-700">✅ Brevo configuré et prêt</p>
            ) : (
              <div>
                <p className="text-sm text-yellow-700">⚠️ Variables manquantes:</p>
                <ul className="text-xs text-yellow-600 mt-1">
                  {brevoConfig.missing.map(varName => (
                    <li key={varName}>• {varName}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-4 w-4" />
              <h3 className="font-semibold">Mailpit (Développement)</h3>
            </div>
            <p className="text-sm text-blue-700">🔧 Disponible en développement</p>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(mailpitUrl, '_blank')}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Ouvrir Mailpit ({mailpitUrl})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSentEmails}
          >
            Rafraîchir les emails
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearMailbox}
          >
            Vider la boîte
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulaire de test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Envoyer un email de test
            </CardTitle>
            <CardDescription>
              Testez différentes fonctionnalités du service email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="testEmail">Email de destination</Label>
              <Input
                id="testEmail"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>

            <div>
              <Label htmlFor="testMessage">Message de test</Label>
              <Textarea
                id="testMessage"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Votre message de test..."
                rows={3}
              />
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">📧 Tests Mailpit (Développement)</h4>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    onClick={handleSendTestEmail}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>Envoi en cours...</>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Envoyer email simple
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleSendWelcomeEmail}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full"
                  >
                    Envoyer email de bienvenue
                  </Button>

                  <Button
                    onClick={handleSendContactNotification}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full"
                  >
                    Envoyer notification de contact
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">🌍 Tests Brevo (Production)</h4>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    onClick={handleSendBrevoTestEmail}
                    disabled={isLoading}
                    variant="default"
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? (
                      <>Envoi en cours...</>
                    ) : (
                      <>
                        <Globe className="mr-2 h-4 w-4" />
                        Envoyer email Brevo
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleSendOTPTest}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full border-green-200 text-green-700 hover:bg-green-50"
                  >
                    Envoyer code OTP via Brevo
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emails envoyés */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Emails envoyés ({sentEmails.length})
            </CardTitle>
            <CardDescription>
              Liste des emails dans la boîte Mailpit
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sentEmails.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Aucun email envoyé pour le moment
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {sentEmails.map((email: any, index) => (
                  <div key={email.ID || index} className="border rounded p-3 text-sm">
                    <div className="font-medium">{email.Subject}</div>
                    <div className="text-muted-foreground">
                      De: {email.From} → À: {email.To}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(email.Created).toLocaleString('fr-FR')}
                    </div>
                    {email.Tags && email.Tags.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {email.Tags.map((tag: string, tagIndex: number) => (
                          <span key={tagIndex} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">ℹ️ Informations Mailpit</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Mailpit est configuré pour le développement local</li>
          <li>• Les emails ne sont pas réellement envoyés</li>
          <li>• Vous pouvez visualiser les emails dans l'interface Mailpit</li>
          <li>• URL Mailpit: <a href={mailpitUrl} target="_blank" rel="noopener noreferrer" className="underline">{mailpitUrl}</a></li>
        </ul>
      </div>
    </div>
  );
};