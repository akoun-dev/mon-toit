import { Button } from '@/components/ui/button';
import { Shield, RefreshCw } from 'lucide-react';

interface VerificationButtonsProps {
  captureMethod: 'local' | 'popup';
  canVerify: boolean;
  isVerifying: boolean;
  isPolling: boolean;
  pollingMessage: string;
  hasContent: boolean;
  onVerify: () => void;
  onReset: () => void;
}

export const VerificationButtons = ({
  captureMethod,
  canVerify,
  isVerifying,
  isPolling,
  pollingMessage,
  hasContent,
  onVerify,
  onReset,
}: VerificationButtonsProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Button
        onClick={onVerify}
        disabled={!canVerify || isVerifying || isPolling}
        className="flex-1"
        size="lg"
      >
        {isVerifying || isPolling ? (
          <>
            <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
            {isPolling ? pollingMessage : 'Vérification en cours...'}
          </>
        ) : (
          <>
            <Shield className="mr-2 h-5 w-5" />
            {captureMethod === 'local' 
              ? 'Vérifier avec caméra locale' 
              : 'Vérifier avec NeoFace'
            }
          </>
        )}
      </Button>

      {hasContent && (
        <Button
          onClick={onReset}
          variant="outline"
          disabled={isVerifying || isPolling}
          size="lg"
        >
          Recommencer
        </Button>
      )}
    </div>
  );
};
