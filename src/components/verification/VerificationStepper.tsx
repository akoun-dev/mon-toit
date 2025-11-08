import { Upload, Camera, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MotionDiv } from '@/components/ui/motion';

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
  status: 'pending' | 'active' | 'completed' | 'error';
}

interface VerificationStepperProps {
  currentStep: number;
  progress: number;
  message: string;
  status: 'idle' | 'uploading' | 'selfie' | 'verifying' | 'completed' | 'error';
}

export const VerificationStepper = ({ 
  currentStep, 
  progress, 
  message,
  status 
}: VerificationStepperProps) => {
  const steps: Step[] = [
    {
      id: 1,
      title: 'Upload',
      description: 'Document CNIB',
      icon: Upload,
      status: currentStep > 1 ? 'completed' : currentStep === 1 ? 'active' : 'pending'
    },
    {
      id: 2,
      title: 'Selfie',
      description: 'Capture visage',
      icon: Camera,
      status: currentStep > 2 ? 'completed' : currentStep === 2 ? 'active' : 'pending'
    },
    {
      id: 3,
      title: 'Vérification',
      description: 'Analyse biométrique',
      icon: CheckCircle2,
      status: status === 'completed' ? 'completed' : currentStep === 3 ? 'active' : 'pending'
    }
  ];

  // Si erreur, marquer l'étape actuelle en erreur
  if (status === 'error' && currentStep > 0) {
    steps[currentStep - 1].status = 'error';
  }

  const getStepStyles = (step: Step) => {
    switch (step.status) {
      case 'completed':
        return {
          circle: 'bg-green-100 border-green-500 text-green-700',
          text: 'text-green-700',
          icon: 'text-green-600'
        };
      case 'active':
        return {
          circle: 'bg-primary/10 border-primary text-primary animate-pulse',
          text: 'text-primary font-medium',
          icon: 'text-primary'
        };
      case 'error':
        return {
          circle: 'bg-destructive/10 border-destructive text-destructive',
          text: 'text-destructive',
          icon: 'text-destructive'
        };
      default:
        return {
          circle: 'bg-muted border-muted-foreground/20 text-muted-foreground',
          text: 'text-muted-foreground',
          icon: 'text-muted-foreground'
        };
    }
  };

  return (
    <MotionDiv
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 p-4 bg-muted/30 rounded-lg border"
    >
      {/* Steps */}
      <div className="flex justify-between items-start relative">
        {/* Line connector for desktop */}
        <div className="hidden md:block absolute top-6 left-0 right-0 h-0.5 bg-muted-foreground/20" 
             style={{ width: 'calc(100% - 48px)', marginLeft: '24px' }} 
        />
        
        {steps.map((step, index) => {
          const styles = getStepStyles(step);
          const Icon = step.icon;
          
          return (
            <div key={step.id} className="flex flex-col items-center relative z-10 flex-1">
              {/* Circle */}
              <MotionDiv
                initial={{ scale: 0.8 }}
                animate={{ scale: step.status === 'active' ? [1, 1.1, 1] : 1 }}
                transition={{ duration: 1, repeat: step.status === 'active' ? Infinity : 0 }}
                className={cn(
                  'w-12 h-12 rounded-full border-2 flex items-center justify-center mb-2 bg-background shadow-sm',
                  styles.circle
                )}
              >
                {step.status === 'completed' ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : step.status === 'error' ? (
                  <AlertCircle className="h-6 w-6" />
                ) : step.status === 'active' ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Icon className="h-6 w-6" />
                )}
              </MotionDiv>
              
              {/* Text */}
              <div className="text-center">
                <p className={cn('text-sm font-medium', styles.text)}>
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {step.description}
                </p>
              </div>
              
              {/* Connector line for mobile */}
              {index < steps.length - 1 && (
                <div className="md:hidden absolute top-6 left-[calc(50%+24px)] w-[calc(100%-24px)] h-0.5 bg-muted-foreground/20" />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <MotionDiv
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={cn(
              'h-full rounded-full transition-colors',
              status === 'error' ? 'bg-destructive' : 
              status === 'completed' ? 'bg-green-500' : 
              'bg-primary'
            )}
          />
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className={cn(
            'font-medium',
            status === 'error' ? 'text-destructive' : 
            status === 'completed' ? 'text-green-600' : 
            'text-primary'
          )}>
            {message}
          </span>
          <span className="text-muted-foreground">{progress}%</span>
        </div>
      </div>
    </MotionDiv>
  );
};
