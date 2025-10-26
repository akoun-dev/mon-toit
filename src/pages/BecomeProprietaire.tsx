import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageTransition } from '@/components/animations/PageTransition';
import { MainLayout } from "@/components/layout/MainLayout";
import { KentePattern } from "@/components/ui/african-patterns";
import { motion } from "framer-motion";
import { 
  User, 
  Building2, 
  FileText, 
  ShieldCheck, 
  CreditCard, 
  CheckCircle, 
  AlertTriangle,
  Star,
  TrendingUp,
  Users,
  Home,
  Camera,
  FileCheck,
  Banknote,
  Award,
  Phone,
  Mail,
  MapPin,
  Clock,
  ChevronRight,
  ArrowRight,
  Check
} from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useBecomeProprietaire } from '@/hooks/useBecomeProprietaire';

interface StepConfig {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  completed: boolean;
  optional?: boolean;
}

interface FormData {
  // Étape 1: Informations de base
  fullName: string;
  phone: string;
  address: string;
  city: string;
  // Étape 2: Type de propriétaire
  ownerType: 'particulier' | 'agence' | 'professionnel';
  agencyName?: string;
  agencyLicense?: string;
  // Étape 3: Documents
  idDocument: File | null;
  proofOfAddress: File | null;
  professionalCard?: File | null;
  // Étape 4: Vérification
  idNumber: string;
  bankAccount: string;
  acceptTerms: boolean;
}

const BecomeProprietaire = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  // Utiliser l'état du hook au lieu de variables locales
  const { state, actions } = useBecomeProprietaire();

  const steps: StepConfig[] = [
    {
      id: '1',
      title: 'Informations personnelles',
      description: 'Vos coordonnées et informations de base',
      icon: User,
      completed: false
    },
    {
      id: '2',
      title: 'Type de propriétaire',
      description: 'Particulier, agence ou professionnel',
      icon: Building2,
      completed: false
    },
    {
      id: '3',
      title: 'Documents justificatifs',
      description: 'Pièce d\'identité et justificatif de domicile',
      icon: FileText,
      completed: false
    },
    {
      id: '4',
      title: 'Vérification et validation',
      description: 'Vérification d\'identité, bancaire et soumission finale',
      icon: ShieldCheck,
      completed: false
    }
  ];

  const advantages = [
    {
      icon: TrendingUp,
      title: 'Revenus supplémentaires',
      description: 'Générez jusqu\'à 40% de revenus supplémentaires grâce à la location de vos biens'
    },
    {
      icon: Users,
      title: 'Gestion simplifiée',
      description: 'Tableau de bord intuitif pour suivre vos biens, locataires et paiements'
    },
    {
      icon: ShieldCheck,
      title: 'Sécurité renforcée',
      description: 'Vérification ANSUT et protection contre les impayés'
    },
    {
      icon: Home,
      title: 'Visibilité maximale',
      description: 'Mise en avant de vos biens sur notre plateforme certifiée'
    },
    {
      icon: CreditCard,
      title: 'Paiements sécurisés',
      description: 'Collecte des loyers directement via la plateforme'
    },
    {
      icon: Award,
      title: 'Accompagnement',
      description: 'Support dédié et ressources pour propriétaires'
    }
  ];

  const requirements = [
    'Pièce d\'identité en cours de validité',
    'Justificatif de domicile récent',
    'Compte bancaire actif',
    'Autorisation de location si applicable',
    'Certification ANSUT (recommandée)'
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, fileType: 'idDocument' | 'proofOfAddress' | 'professionalCard') => {
    const file = event.target.files?.[0];
    if (file) {
      actions.updateFormData({ [fileType]: file });
    }
  };

  const validateCurrentStep = (): boolean => {
    switch (state.currentStep) {
      case 1:
        return state.formData.fullName.trim() !== '' &&
               state.formData.phone.trim() !== '' &&
               state.formData.address.trim() !== '' &&
               state.formData.city.trim() !== '';
      case 2:
        return state.formData.ownerType !== '' &&
               (state.formData.ownerType !== 'agence' || (state.formData.agencyName?.trim() !== '' && state.formData.agencyLicense?.trim() !== ''));
      case 3:
        return state.formData.idDocument !== null && state.formData.proofOfAddress !== null;
      case 4:
        return state.formData.idNumber.trim() !== '' &&
               state.formData.bankAccount.trim() !== '' &&
               state.formData.acceptTerms === true;
      default:
        return false;
    }
  };

  const handleNextStep = async () => {
    if (!validateCurrentStep()) {
      toast({
        title: "Informations incomplètes",
        description: "Veuillez remplir tous les champs obligatoires avant de continuer.",
        variant: "destructive",
      });
      return;
    }

    if (state.currentStep < 4) {
      actions.nextStep();
    }
  };

  const handlePreviousStep = () => {
    if (state.currentStep > 1) {
      actions.previousStep();
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      return;
    }

    try {
      await actions.submitTransformation();

      // Rediriger vers le tableau de bord propriétaire après 2 secondes
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const getStepProgress = () => {
    return ((state.currentStep - 1) / 3) * 100;
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <PageTransition>
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-4 sm:py-6 lg:py-8 px-3 sm:px-4">
          <KentePattern />
          <div className="max-w-6xl mx-auto relative z-10">
            {/* En-tête */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-6 sm:mb-8"
            >
              <Badge className="mb-3 sm:mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 sm:px-6 py-2 text-sm sm:text-lg font-semibold">
                Devenir Propriétaire Certifié
              </Badge>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-4">
                Transformez votre expérience locative en opportunité immobilière
              </h1>
              <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto px-4">
                Rejoignez les milliers de propriétaires certifiés qui génèrent jusqu'à 40% de revenus
                supplémentaires grâce à la plateforme Mon Toit.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
              {/* Avantages */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="xl:col-span-1 order-2 xl:order-1"
              >
                <Card className="h-full">
                  <CardHeader className="pb-4 px-4 sm:px-6">
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <Star className="h-5 w-5 text-yellow-500" />
                      Pour devenir propriétaire ?
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base">
                      Les avantages de la certification ANSUT
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 px-4 sm:px-6">
                    {advantages.map((advantage, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + index * 0.1 }}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-shrink-0">
                          <advantage.icon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mt-1" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-gray-900 text-sm sm:text-base">{advantage.title}</h4>
                          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{advantage.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Formulaire multi-étapes */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="xl:col-span-2 order-1 xl:order-2"
              >
                <Card className="h-full">
                  <CardHeader className="pb-4 sm:pb-6 px-4 sm:px-6">
                    <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <span className="text-lg sm:text-xl">Formulaire de transformation</span>
                      <Badge variant="outline" className="self-start sm:self-auto">
                        Étape {state.currentStep}/4
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-center text-sm sm:text-base">
                      Complétez les étapes suivantes pour devenir propriétaire certifié
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 px-4 sm:px-6">
                    {/* Barre de progression */}
                    <div className="mb-4 sm:mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Progression</span>
                        <span className="text-sm text-gray-500">{state.currentStep}/4 étapes</span>
                      </div>
                      <Progress value={getStepProgress()} className="h-2" />
                      <div className="mt-6">
                        <div className="flex justify-between overflow-x-auto">
                          {steps.map((step, index) => (
                            <div
                              key={step.id}
                              className={`flex flex-col items-center gap-2 min-w-fit ${
                                index + 1 < state.currentStep ? 'text-blue-600' :
                                index + 1 === state.currentStep ? 'text-blue-700' : 'text-gray-400'
                              }`}
                            >
                              <div
                                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                                  index + 1 < state.currentStep
                                    ? 'bg-blue-600 text-white'
                                    : index + 1 === state.currentStep
                                    ? 'bg-blue-100 text-blue-600 border-2 border-blue-600'
                                    : 'bg-gray-200 text-gray-600'
                                }`}
                              >
                                {index + 1 < state.currentStep ? <Check className="h-4 w-4 sm:h-5 sm:w-5" /> : step.id}
                              </div>
                              <div className="text-xs font-medium text-center max-w-20 sm:max-w-24 px-1">
                                <span className="hidden sm:inline">
                                  {step.id === '1' ? 'Informations' :
                                   step.id === '2' ? 'Type propriétaire' :
                                   step.id === '3' ? 'Documents' :
                                   step.id === '4' ? 'Validation' : step.title}
                                </span>
                                <span className="sm:hidden">
                                  {step.id === '1' ? 'Infos' :
                                   step.id === '2' ? 'Type' :
                                   step.id === '3' ? 'Docs' :
                                   step.id === '4' ? 'Validation' : step.title}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Lignes de connexion entre les étapes */}
                        <div className="relative">
                          <div className="absolute top-4 left-0 right-0 h-0.5 -z-10">
                            <div className="relative h-full bg-gray-300">
                              <div
                                className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-300"
                                style={{ width: `${((state.currentStep - 1) / (steps.length - 1)) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Exigences */}
                    <Alert className="border-amber-200 bg-amber-50">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertDescription>
                        <strong>Documents requis :</strong>
                        <ul className="mt-2 space-y-1 text-sm">
                          {requirements.map((req, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>

                    {/* Contenu du formulaire selon l'étape */}
                    <div className="w-full">

                      {/* Étape 1: Informations personnelles */}
                      {state.currentStep === 1 && (
                        <div className="space-y-4 mt-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Nom complet
                            </label>
                            <input
                              type="text"
                              value={state.formData.fullName}
                              onChange={(e) => actions.updateFormData({ fullName: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Votre nom complet"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Téléphone
                            </label>
                            <input
                              type="tel"
                              value={state.formData.phone}
                              onChange={(e) => actions.updateFormData({ phone: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="+225 XX XX XX XX XX"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Adresse complète
                            </label>
                            <input
                              type="text"
                              value={state.formData.address}
                              onChange={(e) => actions.updateFormData({ address: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Rue, numéro, quartier..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Ville
                            </label>
                            <input
                              type="text"
                              value={state.formData.city}
                              onChange={(e) => actions.updateFormData({ city: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Abidjan, Cocody..."
                            />
                          </div>
                        </div>
                        </div>
                      )}

                      {/* Étape 2: Type de propriétaire */}
                      {state.currentStep === 2 && (
                        <div className="space-y-4 mt-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-4">
                              Type de propriétaire
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                              {[
                                { value: 'particulier', label: 'Particulier', icon: User },
                                { value: 'agence', label: 'Agence immobilière', icon: Building2 },
                                { value: 'professionnel', label: 'Professionnel', icon: Award }
                              ].map((type) => (
                                <label
                                  key={type.value}
                                  className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                                    state.formData.ownerType === type.value
                                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                              >
                                <input
                                  type="radio"
                                  name="ownerType"
                                  value={type.value}
                                  checked={state.formData.ownerType === type.value}
                                  onChange={(e) => actions.updateFormData({ ownerType: e.target.value as any })}
                                  className="sr-only"
                                />
                                <type.icon className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium text-sm sm:text-base">{type.label}</div>
                                  <div className="text-xs sm:text-sm text-gray-500">
                                    {type.value === 'particulier' && 'Propriétaire individuel'}
                                    {type.value === 'agence' && 'Société immobilière'}
                                    {type.value === 'professionnel' && 'Profession libéral'}
                                  </div>
                                </div>
                              </label>
                              ))}
                            </div>
                          </div>

                          {state.formData.ownerType === 'agence' && (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Nom de l'agence
                                </label>
                                <input
                                  type="text"
                                  value={state.formData.agencyName}
                                  onChange={(e) => actions.updateFormData({ agencyName: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Nom officiel de l'agence"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Numéro de licence
                                </label>
                                <input
                                  type="text"
                                  value={state.formData.agencyLicense}
                                  onChange={(e) => actions.updateFormData({ agencyLicense: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Numéro d'enregistrement commercial"
                                />
                              </div>
                            </>
                          )}
                        </div>
                        </div>
                      )}

                      {/* Étape 3: Documents */}
                      {state.currentStep === 3 && (
                        <div className="space-y-4 mt-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Pièce d'identité (CNI, passeport...)
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-4">
                              <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => handleFileUpload(e, 'idDocument')}
                                className="hidden"
                                id="idDocument"
                              />
                              <label
                                htmlFor="idDocument"
                                className="flex flex-col items-center gap-2 cursor-pointer py-2"
                              >
                                <Camera className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                                <span className="text-xs sm:text-sm text-gray-600 text-center px-2">
                                  {state.formData.idDocument ? state.formData.idDocument.name : 'Cliquez pour télécharger'}
                                </span>
                              </label>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Justificatif de domicile
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-4">
                              <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => handleFileUpload(e, 'proofOfAddress')}
                                className="hidden"
                                id="proofOfAddress"
                              />
                              <label
                                htmlFor="proofOfAddress"
                                className="flex flex-col items-center gap-2 cursor-pointer py-2"
                              >
                                <FileCheck className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                                <span className="text-xs sm:text-sm text-gray-600 text-center px-2">
                                  {state.formData.proofOfAddress ? state.formData.proofOfAddress.name : 'Cliquez pour télécharger'}
                                </span>
                              </label>
                            </div>
                          </div>

                          {state.formData.ownerType === 'professionnel' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Carte professionnelle (optionnel)
                              </label>
                              <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-4">
                                <input
                                  type="file"
                                  accept="image/*,.pdf"
                                  onChange={(e) => handleFileUpload(e, 'professionalCard')}
                                  className="hidden"
                                  id="professionalCard"
                                />
                                <label
                                  htmlFor="professionalCard"
                                  className="flex flex-col items-center gap-2 cursor-pointer py-2"
                                >
                                  <Award className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                                  <span className="text-xs sm:text-sm text-gray-600 text-center px-2">
                                    {state.formData.professionalCard ? state.formData.professionalCard.name : 'Cliquez pour télécharger'}
                                  </span>
                                </label>
                              </div>
                            </div>
                          )}
                        </div>
                        </div>
                      )}

                      {/* Étape 4: Vérification et validation finale */}
                      {state.currentStep === 4 && (
                        <div className="space-y-4 mt-6">
                        <div className="space-y-6">
                          {/* Section KYC */}
                          <div className="space-y-4">
                            <Alert className="border-blue-200 bg-blue-50">
                              <ShieldCheck className="h-4 w-4 text-blue-600" />
                              <AlertDescription>
                                <strong>Vérification sécurisée ANSUT</strong>
                                <p className="mt-2 text-sm">
                                  Vos informations sont cryptées et protégées conformément aux standards
                                  de sécurité les plus stricts. La vérification KYC (Know Your Customer)
                                  est obligatoire pour devenir propriétaire certifié.
                                </p>
                              </AlertDescription>
                            </Alert>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Numéro de pièce d'identité
                              </label>
                              <input
                                type="text"
                                value={state.formData.idNumber}
                                onChange={(e) => actions.updateFormData({ idNumber: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Numéro CNI/passeport"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                RIB (Relevé d'Identité Bancaire)
                              </label>
                              <input
                                type="text"
                                value={state.formData.bankAccount}
                                onChange={(e) => actions.updateFormData({ bankAccount: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="XX XXXX XXXX XXXX XXXX XXXX XXX"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="acceptTerms"
                                checked={state.formData.acceptTerms}
                                onChange={(e) => actions.updateFormData({ acceptTerms: e.target.checked })}
                                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <label htmlFor="acceptTerms" className="text-sm text-gray-700">
                                J'accepte les conditions générales et la politique de confidentialité
                              </label>
                            </div>
                          </div>

                          {/* Section Résumé et Finalisation */}
                          <div className="border-t pt-6">
                            <div className="text-center space-y-4 sm:space-y-6">
                              <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
                              </div>
                              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                                Prêt à finaliser votre transformation
                              </h3>
                              <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base px-4">
                                Vérifiez que toutes les informations sont correctes avant de soumettre votre demande.
                              </p>

                              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                                <div className="flex items-center gap-2 text-xs sm:text-sm">
                                  <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                  <span className="truncate">{state.formData.fullName}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs sm:text-sm">
                                  <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                  <span className="truncate">{state.formData.phone}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs sm:text-sm">
                                  <Mail className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                  <span className="truncate">{user?.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs sm:text-sm">
                                  <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                  <span className="truncate">{state.formData.address}, {state.formData.city}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs sm:text-sm">
                                  <Building2 className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                  <span className="capitalize truncate">{state.formData.ownerType}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        </div>
                      )}
                    </div>

                    {/* Boutons de navigation */}
                    <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 mt-6 sm:mt-8">
                      <Button
                        variant="outline"
                        onClick={handlePreviousStep}
                        disabled={state.currentStep === 1}
                        className="flex items-center justify-center gap-2 w-full sm:w-auto order-2 sm:order-1"
                      >
                        <ArrowRight className="h-4 w-4 rotate-180" />
                        Précédent
                      </Button>

                      {state.currentStep === 4 ? (
                        <Button
                          onClick={handleSubmit}
                          disabled={state.isSubmitting || state.verificationStatus === 'processing'}
                          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 w-full sm:w-auto order-1 sm:order-2"
                        >
                          {state.verificationStatus === 'processing' ? (
                            <>
                              <div className="h-4 w-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                              Envoi en cours...
                            </>
                          ) : state.verificationStatus === 'success' ? (
                            <>
                              <Check className="h-4 w-4" />
                              Demande envoyée
                            </>
                          ) : (
                            <>
                              <ChevronRight className="h-4 w-4" />
                              Soumettre la demande
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          onClick={handleNextStep}
                          disabled={!validateCurrentStep()}
                          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 w-full sm:w-auto order-1 sm:order-2"
                        >
                          Suivant
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </MainLayout>
    </PageTransition>
  );
};

export default BecomeProprietaire;