import { supabase } from '@/lib/supabase';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  step: number;
}

export interface FieldValidationRule {
  field: string;
  required: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

class TransformationValidationService {
  /**
   * Valide les données du formulaire de transformation
   */
  validateFormData(formData: any, currentStep: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    switch (currentStep) {
      case 1:
        this.validatePersonalInfo(formData, errors, warnings);
        break;
      case 2:
        this.validateOwnerType(formData, errors, warnings);
        break;
      case 3:
        this.validateDocuments(formData, errors, warnings);
        break;
      case 4:
        this.validateKYC(formData, errors, warnings);
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      step: currentStep
    };
  }

  /**
   * Valide les informations personnelles (étape 1)
   */
  private validatePersonalInfo(formData: any, errors: string[], warnings: string[]): void {
    // Nom complet
    if (!formData.fullName?.trim()) {
      errors.push('Le nom complet est requis');
    } else if (formData.fullName.length < 3) {
      errors.push('Le nom complet doit contenir au moins 3 caractères');
    } else if (formData.fullName.length > 100) {
      errors.push('Le nom complet ne peut pas dépasser 100 caractères');
    }

    // Téléphone
    if (!formData.phone?.trim()) {
      errors.push('Le numéro de téléphone est requis');
    } else {
      const phoneRegex = /^(\+?[0-9]{1,4}[\s-]?)?[0-9]{8,}$/;
      if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
        errors.push('Le format du numéro de téléphone est invalide');
      }
    }

    // Adresse
    if (!formData.address?.trim()) {
      errors.push('L\'adresse est requise');
    } else if (formData.address.length < 10) {
      errors.push('L\'adresse semble trop courte');
    }

    // Ville
    if (!formData.city?.trim()) {
      errors.push('La ville est requise');
    } else if (!this.isValidIvorianCity(formData.city)) {
      warnings.push('La ville spécifiée n\'est pas dans notre liste des villes ivoiriennes principales');
    }
  }

  /**
   * Valide le type de propriétaire (étape 2)
   */
  private validateOwnerType(formData: any, errors: string[], warnings: string[]): void {
    if (!formData.ownerType) {
      errors.push('Le type de propriétaire est requis');
      return;
    }

    const validTypes = ['particulier', 'agence', 'professionnel'];
    if (!validTypes.includes(formData.ownerType)) {
      errors.push('Le type de propriétaire sélectionné est invalide');
    }

    // Validation spécifique pour les agences
    if (formData.ownerType === 'agence') {
      if (!formData.agencyName?.trim()) {
        errors.push('Le nom de l\'agence est requis pour ce type de propriétaire');
      } else if (formData.agencyName.length < 3) {
        errors.push('Le nom de l\'agence doit contenir au moins 3 caractères');
      }

      if (!formData.agencyLicense?.trim()) {
        errors.push('Le numéro de licence est requis pour les agences');
      } else if (formData.agencyLicense.length < 5) {
        errors.push('Le numéro de licence semble invalide');
      }
    }

    // Validation spécifique pour les professionnels
    if (formData.ownerType === 'professionnel' && !formData.professionalCard) {
      warnings.push('Il est recommandé de fournir une carte professionnelle pour les professionnels');
    }
  }

  /**
   * Valide les documents (étape 3)
   */
  private validateDocuments(formData: any, errors: string[], warnings: string[]): void {
    // Document d'identité
    if (!formData.idDocument) {
      errors.push('La pièce d\'identité est requise');
    } else {
      this.validateDocumentFile(formData.idDocument, 'Pièce d\'identité', errors, warnings);
    }

    // Justificatif de domicile
    if (!formData.proofOfAddress) {
      errors.push('Le justificatif de domicile est requis');
    } else {
      this.validateDocumentFile(formData.proofOfAddress, 'Justificatif de domicile', errors, warnings);
    }

    // Carte professionnelle (optionnelle)
    if (formData.professionalCard) {
      this.validateDocumentFile(formData.professionalCard, 'Carte professionnelle', errors, warnings);
    }
  }

  /**
   * Valide un fichier document
   */
  private validateDocumentFile(file: File, documentType: string, errors: string[], warnings: string[]): void {
    // Vérifier la taille du fichier (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      errors.push(`${documentType}: Le fichier ne doit pas dépasser 10MB`);
    }

    // Vérifier le type de fichier
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      errors.push(`${documentType}: Seuls les fichiers JPG, PNG, WebP et PDF sont acceptés`);
    }

    // Vérifier le nom du fichier
    if (file.name.length > 255) {
      errors.push(`${documentType}: Le nom du fichier est trop long`);
    }

    // Avertissement pour les fichiers de faible qualité
    if (file.type.startsWith('image/') && file.size < 100 * 1024) { // < 100KB
      warnings.push(`${documentType}: L\'image semble de faible qualité, cela pourrait retarder le traitement`);
    }
  }

  /**
   * Valide les informations KYC (étape 4)
   */
  private validateKYC(formData: any, errors: string[], warnings: string[]): void {
    // Numéro de pièce d'identité
    if (!formData.idNumber?.trim()) {
      errors.push('Le numéro de pièce d\'identité est requis');
    } else {
      const idNumberRegex = /^[A-Za-z0-9]{6,20}$/;
      if (!idNumberRegex.test(formData.idNumber.replace(/\s/g, ''))) {
        errors.push('Le format du numéro de pièce d\'identité est invalide');
      }
    }

    // RIB/Compte bancaire
    if (!formData.bankAccount?.trim()) {
      errors.push('Le RIB est requis');
    } else {
      const ribRegex = /^[A-Za-z0-9\s]{15,34}$/;
      if (!ribRegex.test(formData.bankAccount.replace(/\s/g, ''))) {
        errors.push('Le format du RIB est invalide');
      }
    }

    // Acceptation des conditions
    if (!formData.acceptTerms) {
      errors.push('Vous devez accepter les conditions générales');
    }

    // Avertissements de sécurité
    if (formData.bankAccount && formData.bankAccount.toLowerCase().includes('test')) {
      errors.push('Veuillez fournir de véritables informations bancaires');
    }
  }

  /**
   * Vérifie si une ville est une ville ivoirienne valide
   */
  private isValidIvorianCity(city: string): boolean {
    const ivorianCities = [
      'Abidjan', 'Bouaké', 'Daloa', 'Korhogo', 'Yamoussoukro',
      'San-Pedro', 'Divo', 'Gagnoa', 'Man', 'Issia',
      'Soubré', 'Agboville', 'Séguéla', 'Bondoukou', 'Bouna',
      'Odienné', 'Danane', 'Toumodi', 'Ferkessédougou', 'Boundiali',
      'Tingréla', 'Toulépleu', 'Mankono', 'Katiola', 'Vavoua',
      'Oumé', 'Sassandra', 'Lakota', 'Dabou', 'Bingerville',
      'Anyama', 'Grand-Bassam', 'Jacqueville', 'Tiassalé', 'Azaguié',
      'Sakassou', 'Bocanda', 'Dimbokro', 'Béoumi', 'Koundoukou',
      'M'Bahiakro', 'Tiébissou', 'Taabo', 'Yakassé-Attobrou', 'Alépé',
      'Adzopé', 'Akoupé', 'Afféry', 'Agboville', 'Aboisso',
      'Agnibilékrou', 'Akoupingbo', 'Alépé', 'Arrah', 'Bettié',
      'Bianouan', 'Bondoukou', 'Bongouanou', 'Bouaflé', 'Bouandougou',
      'Bouna', 'Dabakala', 'Diabo', 'Dianra', 'Divo', 'Dabou'
    ];

    return ivorianCities.some(cityName =>
      cityName.toLowerCase() === city.toLowerCase().trim()
    );
  }

  /**
   * Valide l'ensemble du formulaire avant soumission
   */
  async validateCompleteSubmission(formData: any, userId: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validation de toutes les étapes
    for (let step = 1; step <= 4; step++) {
      const stepValidation = this.validateFormData(formData, step);
      errors.push(...stepValidation.errors);
      warnings.push(...stepValidation.warnings);
    }

    // Validation additionnelle pour la soumission complète
    try {
      // Vérifier si l'utilisateur n'a pas déjà une demande en cours
      const { data: existingRequest } = await supabase
        .from('role_change_requests')
        .select('id')
        .eq('user_id', userId)
        .eq('to_role', 'propriétaire')
        .in('status', ['pending', 'under_review'])
        .single();

      if (existingRequest) {
        errors.push('Vous avez déjà une demande de transformation en cours');
      }

      // Vérifier si le profil utilisateur est complet
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_verified, active_role')
        .eq('id', userId)
        .single();

      if (!profile?.is_verified) {
        warnings.push('Votre email n\'est pas vérifié, cela pourrait retarder le traitement');
      }

      if (profile?.active_role === 'propriétaire') {
        errors.push('Vous êtes déjà propriétaire');
      }

    } catch (error) {
      warnings.push('Impossible de vérifier votre statut actuel, veuillez réessayer');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      step: 4
    };
  }

  /**
   * Formate les données avant l'envoi
   */
  formatDataForSubmission(formData: any): any {
    return {
      fullName: formData.fullName?.trim() || '',
      phone: formData.phone?.replace(/\s+/g, ' ').trim() || '',
      address: formData.address?.trim() || '',
      city: formData.city?.trim() || '',
      ownerType: formData.ownerType || 'particulier',
      agencyName: formData.agencyName?.trim() || '',
      agencyLicense: formData.agencyLicense?.replace(/\s+/g, ' ').trim() || '',
      idNumber: formData.idNumber?.replace(/\s+/g, '').trim() || '',
      bankAccount: formData.bankAccount?.replace(/\s+/g, ' ').trim() || '',
      acceptTerms: Boolean(formData.acceptTerms)
    };
  }

  /**
   * Génère un résumé des données pour confirmation
   */
  generateSummary(formData: any): string[] {
    const summary: string[] = [];

    if (formData.fullName) {
      summary.push(`Nom: ${formData.fullName}`);
    }

    if (formData.phone) {
      summary.push(`Téléphone: ${formData.phone}`);
    }

    if (formData.address && formData.city) {
      summary.push(`Adresse: ${formData.address}, ${formData.city}`);
    }

    summary.push(`Type: ${this.getOwnerTypeLabel(formData.ownerType)}`);

    if (formData.ownerType === 'agence' && formData.agencyName) {
      summary.push(`Agence: ${formData.agencyName}`);
    }

    if (formData.idDocument) {
      summary.push(`Pièce d'identité: ${formData.idDocument.name}`);
    }

    if (formData.proofOfAddress) {
      summary.push(`Justificatif de domicile: ${formData.proofOfAddress.name}`);
    }

    if (formData.professionalCard) {
      summary.push(`Carte professionnelle: ${formData.professionalCard.name}`);
    }

    return summary;
  }

  /**
   * Obtient le libellé du type de propriétaire
   */
  private getOwnerTypeLabel(type: string): string {
    const labels = {
      'particulier': 'Particulier',
      'agence': 'Agence immobilière',
      'professionnel': 'Professionnel'
    };

    return labels[type as keyof typeof labels] || type;
  }
}

export const transformationValidationService = new TransformationValidationService();
export default transformationValidationService;