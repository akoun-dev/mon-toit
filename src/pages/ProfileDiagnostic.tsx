import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import Navbar from "@/components/Navbar";

const ProfileDiagnostic = () => {
  const { user, profile } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <Card>
          <CardHeader>
            <CardTitle>Diagnostic du Profil Utilisateur</CardTitle>
            <CardDescription>
              Informations détaillées sur votre compte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Statut d'authentification</h3>
              {user ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span>Connecté</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span>Non connecté</span>
                </div>
              )}
            </div>

            {user && (
              <>
                <div>
                  <h3 className="font-semibold mb-2">Email</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">ID Utilisateur</h3>
                  <p className="text-sm text-muted-foreground font-mono">{user.id}</p>
                </div>
              </>
            )}

            {profile ? (
              <>
                <div>
                  <h3 className="font-semibold mb-2">Nom complet</h3>
                  <p className="text-sm text-muted-foreground">{profile.full_name}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Type d'utilisateur</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{profile.user_type}</Badge>
                    {(profile.user_type === 'proprietaire' || profile.user_type === 'agence') ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm">Accès CRM autorisé</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm">Accès CRM non autorisé</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Statut de vérification</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {profile.is_verified ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">Profil vérifié: {profile.is_verified ? 'Oui' : 'Non'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {profile.oneci_verified ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">ONECI vérifié: {profile.oneci_verified ? 'Oui' : 'Non'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {profile.cnam_verified ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">CNAM vérifié: {profile.cnam_verified ? 'Oui' : 'Non'}</span>
                    </div>
                  </div>
                </div>

                <Alert>
                  <AlertDescription>
                    {(profile.user_type === 'proprietaire' || profile.user_type === 'agence') ? (
                      <>
                        <strong>Votre compte a accès au CRM Visites.</strong>
                        <br />
                        Le lien "CRM Visites" devrait apparaître dans le menu utilisateur (en haut à droite)
                        et dans le menu mobile. Si vous ne le voyez pas, essayez de vous déconnecter et
                        de vous reconnecter.
                      </>
                    ) : (
                      <>
                        <strong>Votre compte n'a pas accès au CRM Visites.</strong>
                        <br />
                        Le CRM Visites est réservé aux propriétaires et agences. Votre type actuel est: {profile.user_type}.
                        Vous devez changer votre type d'utilisateur pour "proprietaire" ou "agence" dans votre profil.
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              </>
            ) : (
              <div>
                <h3 className="font-semibold mb-2">Profil</h3>
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span>Aucun profil trouvé</span>
                </div>
              </div>
            )}

            <div className="pt-4">
              <h3 className="font-semibold mb-2">Debug Info</h3>
              <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">
                {JSON.stringify({ user: user ? { id: user.id, email: user.email } : null, profile }, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileDiagnostic;
