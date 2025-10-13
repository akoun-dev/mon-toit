import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, AlertTriangle, Shield, Upload, FileText } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const OrganizerVerificationFlow = () => {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [identityDocument, setIdentityDocument] = useState<File | null>(null);
  const [ansutCertificate, setAnsutCertificate] = useState("");

  // Fetch current verification status
  const { data: verification, isLoading } = useQuery({
    queryKey: ["organizer-verification"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("visit_organizer_verification")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Create verification request
  const createVerification = useMutation({
    mutationFn: async (organizerType: "owner" | "agency" | "agent") => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("visit_organizer_verification")
        .insert({
          user_id: user.id,
          organizer_type: organizerType,
          verification_status: "pending",
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizer-verification"] });
      toast.success("Demande de vérification créée");
      setCurrentStep(2);
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Upload identity document
  const uploadIdentity = useMutation({
    mutationFn: async ({ file, method }: { file: File; method: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload file to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("verification-documents")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("verification-documents")
        .getPublicUrl(fileName);

      // Update verification
      const { error: updateError } = await supabase
        .from("visit_organizer_verification")
        .update({
          identity_verified: false,
          identity_verification_method: method,
          identity_document_url: publicUrl,
        })
        .eq("user_id", user.id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizer-verification"] });
      toast.success("Document téléchargé avec succès");
      setCurrentStep(3);
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Submit ANSUT certification
  const submitAnsut = useMutation({
    mutationFn: async (certificateNumber: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("visit_organizer_verification")
        .update({
          ansut_certificate_number: certificateNumber,
          verification_status: "in_review",
        })
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizer-verification"] });
      toast.success("Certification ANSUT soumise pour vérification");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  // If already verified
  if (verification?.verification_status === "verified") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            <CardTitle>Organisateur Vérifié</CardTitle>
          </div>
          <CardDescription>
            Vous êtes autorisé à organiser des visites de biens immobiliers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {verification.identity_verified && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Identité vérifiée</span>
              </div>
            )}
            {verification.ansut_certified && (
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                <span>Certifié ANSUT</span>
                <Badge variant="secondary">{verification.ansut_certificate_number}</Badge>
              </div>
            )}
            {verification.average_rating && (
              <div className="flex items-center gap-2">
                <span>Note moyenne:</span>
                <Badge variant="outline">
                  {verification.average_rating.toFixed(1)} / 5
                </Badge>
                <span className="text-sm text-muted-foreground">
                  ({verification.total_reviews} avis)
                </span>
              </div>
            )}
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold">{verification.total_visits_organized}</div>
                <div className="text-sm text-muted-foreground">Visites organisées</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{verification.completed_visits}</div>
                <div className="text-sm text-muted-foreground">Complétées</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{verification.no_show_visits}</div>
                <div className="text-sm text-muted-foreground">No-show</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If suspended or banned
  if (["suspended", "banned"].includes(verification?.verification_status || "")) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Compte Suspendu</AlertTitle>
        <AlertDescription>
          Votre compte a été suspendu suite à des signalements de fraude.
          {verification?.blacklist_reason && (
            <div className="mt-2">
              <strong>Raison:</strong> {verification.blacklist_reason}
            </div>
          )}
          Contactez le support pour plus d'informations.
        </AlertDescription>
      </Alert>
    );
  }

  // If in review
  if (verification?.verification_status === "in_review") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
            <CardTitle>Vérification en cours</CardTitle>
          </div>
          <CardDescription>
            Votre demande est en cours de vérification par notre équipe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={75} />
            <Alert>
              <AlertDescription>
                Notre équipe examine vos documents. Ce processus prend généralement 24-48 heures.
                Vous recevrez une notification par email dès que la vérification sera terminée.
              </AlertDescription>
            </Alert>
            {verification.identity_document_url && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Document d'identité soumis</span>
              </div>
            )}
            {verification.ansut_certificate_number && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Certification ANSUT soumise</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Verification flow steps
  const progress = (currentStep / 3) * 100;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Devenir Organisateur de Visites Vérifié</CardTitle>
          <CardDescription>
            Pour organiser des visites, vous devez être vérifié. Ce processus garantit la sécurité de tous.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="mb-6" />

          {/* Step 1: Choose organizer type */}
          {currentStep === 1 && !verification && (
            <div className="space-y-4">
              <h3 className="font-semibold">Étape 1: Type d'organisateur</h3>
              <p className="text-sm text-muted-foreground">
                Sélectionnez votre profil:
              </p>
              <div className="grid gap-4">
                <Button
                  variant="outline"
                  className="h-auto p-4 justify-start"
                  onClick={() => createVerification.mutate("owner")}
                >
                  <div className="text-left">
                    <div className="font-semibold">Propriétaire</div>
                    <div className="text-sm text-muted-foreground">
                      Je suis propriétaire et j'organise des visites de mes biens
                    </div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto p-4 justify-start"
                  onClick={() => createVerification.mutate("agency")}
                >
                  <div className="text-left">
                    <div className="font-semibold">Agence</div>
                    <div className="text-sm text-muted-foreground">
                      Je suis une agence immobilière avec des mandats
                    </div>
                  </div>
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Upload identity */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Étape 2: Vérification d'identité</h3>
              <p className="text-sm text-muted-foreground">
                Téléchargez une copie de votre pièce d'identité officielle
              </p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="identity-doc">Document d'identité</Label>
                  <Input
                    id="identity-doc"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setIdentityDocument(e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    CNI, Passeport, ou Attestation d'identité
                  </p>
                </div>
                <Button
                  onClick={() => {
                    if (!identityDocument) {
                      toast.error("Veuillez sélectionner un document");
                      return;
                    }
                    uploadIdentity.mutate({
                      file: identityDocument,
                      method: "oneci",
                    });
                  }}
                  disabled={!identityDocument || uploadIdentity.isPending}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Télécharger le document
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: ANSUT certification (optional but recommended) */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Étape 3: Certification ANSUT (Optionnelle)</h3>
              <p className="text-sm text-muted-foreground">
                Si vous avez une certification ANSUT, vous pouvez l'ajouter pour augmenter votre crédibilité
              </p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="ansut-cert">Numéro de certificat ANSUT</Label>
                  <Input
                    id="ansut-cert"
                    placeholder="ANSUT-XXXX-XXXX"
                    value={ansutCertificate}
                    onChange={(e) => setAnsutCertificate(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      if (ansutCertificate) {
                        submitAnsut.mutate(ansutCertificate);
                      } else {
                        // Skip ANSUT and submit for review anyway
                        submitAnsut.mutate("");
                      }
                    }}
                    disabled={submitAnsut.isPending}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Soumettre pour vérification
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => submitAnsut.mutate("")}
                    disabled={submitAnsut.isPending}
                  >
                    Passer cette étape
                  </Button>
                </div>
              </div>
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertTitle>Protection Anti-Fraude</AlertTitle>
                <AlertDescription>
                  Tous les organisateurs sont vérifiés pour garantir la sécurité des visiteurs.
                  Les frais de visite sont limités à 10 000 FCFA par la réglementation ANSUT.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
