import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle } from 'lucide-react';
import { SimpleProgress } from '@/utils/imageUtils';

interface VerificationResultDisplayProps {
  result: {
    verified: boolean;
    similarityScore: string;
    message: string;
    canRetry: boolean;
    resultText?: string;
  };
}

export const VerificationResultDisplay = ({ result }: VerificationResultDisplayProps) => {
  return (
    <Alert variant={result.verified ? "default" : "destructive"}>
      {result.verified ? (
        <CheckCircle className="h-4 w-4" />
      ) : (
        <XCircle className="h-4 w-4" />
      )}
      <AlertDescription>
        <div className="space-y-2">
          <p className="font-medium">{result.message}</p>
          <div className="flex items-center gap-2">
            <span className="text-sm">Score de similarité :</span>
            <SimpleProgress value={parseFloat(result.similarityScore)} className="flex-1" />
            <span className="text-sm font-bold">{result.similarityScore}%</span>
          </div>
          {!result.verified && result.canRetry && (
            <p className="text-sm">
              Vous pouvez réessayer avec de meilleures conditions.
            </p>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};
