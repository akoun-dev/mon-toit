import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export const VerificationInstructions = () => {
  return (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <strong>Instructions importantes :</strong>
        <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
          <li>Téléchargez une photo <strong>claire et nette</strong> de votre CNIB burkinabè</li>
          <li>Assurez-vous que <strong>toutes les informations</strong> sur la CNI sont lisibles</li>
          <li>Prenez un selfie avec un <strong>bon éclairage</strong> (lumière naturelle de préférence)</li>
          <li>Regardez <strong>directement la caméra</strong>, expression neutre</li>
          <li>Retirez <strong>lunettes, masque, chapeau</strong> ou tout accessoire</li>
        </ul>
      </AlertDescription>
    </Alert>
  );
};
