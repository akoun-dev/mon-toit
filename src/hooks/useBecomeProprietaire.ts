import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { roleTransformationService, RoleTransformationData, DocumentUpload } from '@/services/roleTransformationService';
import { transformationValidationService } from '@/services/transformationValidationService';
import { useAuth } from '@/hooks/useAuth';

export interface TransformationState {
  currentStep: number;
  formData: any;
  isSubmitting: boolean;
  verificationStatus: 'idle' | 'processing' | 'success' | 'error';
  transformationId?: string;
}

export interface UseBecomeProprietaireReturn {
  state: TransformationState;
  actions: {
    nextStep: () => void;
    previousStep: () => void;
    updateFormData: (data: any) => void;
    setSubmitting: (submitting: boolean) => void;
    setVerificationStatus: (status: TransformationState['verificationStatus']) => void;
    submitTransformation: () => Promise<void>;
    resetTransformation: () => void;
    validateCurrentStep: () => { isValid: boolean; errors: string[]; warnings: string[] };
  };
}

export const useBecomeProprietaire = (): UseBecomeProprietaireReturn => {
  const { user } = useAuth();
  const [state, setState] = useState<TransformationState>({
    currentStep: 1,
    formData: {
      fullName: '',
      phone: '',
      address: '',
      city: '',
      ownerType: 'particulier',
      agencyName: '',
      agencyLicense: '',
      idDocument: null,
      proofOfAddress: null,
      professionalCard: null,
      idNumber: '',
      bankAccount: '',
      acceptTerms: false
    },
    isSubmitting: false,
    verificationStatus: 'idle'
  });

  const nextStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, 4),
      [`step${prev.currentStep}Completed`]: true
    }));
  }, []);

  const previousStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 1)
    }));
  }, []);

  const updateFormData = useCallback((data: any) => {
    setState(prev => ({
      ...prev,
      formData: { ...prev.formData, ...data }
    }));
  }, []);

  const setSubmitting = useCallback((submitting: boolean) => {
    setState(prev => ({
      ...prev,
      isSubmitting: submitting
    }));
  }, []);

  const setVerificationStatus = useCallback((status: TransformationState['verificationStatus']) => {
    setState(prev => ({
      ...prev,
      verificationStatus: status
    }));
  }, []);

  const submitTransformation = useCallback(async () => {
    if (!user) {
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour soumettre une demande.",
        variant: "destructive",
      });
      return;
    }

    setState(prev => ({ ...prev, isSubmitting: true, verificationStatus: 'processing' }));

    try {
      // Validation complète avant soumission
      const completeValidation = await transformationValidationService.validateCompleteSubmission(state.formData, user.id);

      if (!completeValidation.isValid) {
        throw new Error(completeValidation.errors[0] || 'Formulaire invalide');
      }

      // Afficher les avertissements
      if (completeValidation.warnings.length > 0) {
        completeValidation.warnings.forEach(warning => {
          toast({
            title: "Information",
            description: warning,
            variant: "default",
          });
        });
      }

      // Formater les données pour la soumission
      const formattedData = transformationValidationService.formatDataForSubmission(state.formData);

      const transformationData: RoleTransformationData = {
        fullName: formattedData.fullName,
        phone: formattedData.phone,
        address: formattedData.address,
        city: formattedData.city,
        ownerType: formattedData.ownerType,
        agencyName: formattedData.agencyName,
        agencyLicense: formattedData.agencyLicense,
        idNumber: formattedData.idNumber,
        bankAccount: formattedData.bankAccount,
        acceptTerms: formattedData.acceptTerms
      };

      // Préparer les documents
      const documents: DocumentUpload[] = [];

      if (state.formData.idDocument) {
        documents.push({
          type: 'idDocument',
          file: state.formData.idDocument
        });
      }

      if (state.formData.proofOfAddress) {
        documents.push({
          type: 'proofOfAddress',
          file: state.formData.proofOfAddress
        });
      }

      if (state.formData.professionalCard && state.formData.ownerType === 'professionnel') {
        documents.push({
          type: 'professionalCard',
          file: state.formData.professionalCard
        });
      }

      // Obtenir le rôle actuel de l'utilisateur
      const { data: profile } = await supabase
        .from('profiles')
        .select('active_role')
        .eq('id', user.id)
        .single();

      const currentRole = profile?.active_role || 'locataire';

      // Soumettre la demande via le service
      const result = await roleTransformationService.submitTransformationRequest(
        user.id,
        currentRole,
        transformationData,
        documents
      );

      if (result.success) {
        setState(prev => ({
          ...prev,
          verificationStatus: 'success',
          transformationId: result.requestId
        }));

        toast({
          title: "Demande envoyée !",
          description: "Votre demande de transformation en propriétaire a été soumise. Vous recevrez une réponse sous 48h.",
        });

        // Générer un résumé pour l'utilisateur
        const summary = transformationValidationService.generateSummary(state.formData);
        console.log('Résumé de la demande:', summary);

      } else {
        throw new Error(result.error || 'Erreur lors de la soumission');
      }

    } catch (error) {
      console.error('Erreur soumission transformation:', error);
      setState(prev => ({ ...prev, verificationStatus: 'error' }));
      toast({
        title: "Erreur lors de l'envoi",
        description: error instanceof Error ? error.message : "Une erreur est survenue. Veuillez réessayer plus tard.",
        variant: "destructive",
      });
    } finally {
      setState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [user, state.formData]);

  const validateCurrentStep = useCallback(() => {
    const validation = transformationValidationService.validateFormData(state.formData, state.currentStep);

    if (!validation.isValid && validation.errors.length > 0) {
      toast({
        title: "Informations incomplètes",
        description: validation.errors[0],
        variant: "destructive",
      });
    }

    if (validation.warnings.length > 0) {
      validation.warnings.forEach(warning => {
        toast({
          title: "Attention",
          description: warning,
          variant: "default",
        });
      });
    }

    return {
      isValid: validation.isValid,
      errors: validation.errors,
      warnings: validation.warnings
    };
  }, [state.formData, state.currentStep]);

  const resetTransformation = useCallback(() => {
    setState({
      currentStep: 1,
      formData: {
        fullName: '',
        phone: '',
        address: '',
        city: '',
        ownerType: 'particulier',
        agencyName: '',
        agencyLicense: '',
        idDocument: null,
        proofOfAddress: null,
        professionalCard: null,
        idNumber: '',
        bankAccount: '',
        acceptTerms: false
      },
      isSubmitting: false,
      verificationStatus: 'idle'
    });
  }, []);

  return {
    state,
    actions: {
      nextStep,
      previousStep,
      updateFormData,
      setSubmitting,
      setVerificationStatus,
      submitTransformation,
      resetTransformation,
      validateCurrentStep
    }
  };
};