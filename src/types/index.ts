// Centralized type definitions for Mon Toit

// Database enums
export type UserType = 'locataire' | 'proprietaire' | 'agence' | 'admin_ansut';
export type PropertyStatus = 'disponible' | 'loué' | 'en_attente' | 'retiré';
export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';
export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'not_attempted';

// Core entities
export interface Property {
  id: string;
  title: string;
  description: string | null;
  property_type: string;
  city: string;
  neighborhood: string | null;
  address: string;
  monthly_rent: number;
  deposit_amount: number | null;
  charges_amount: number | null;
  surface_area: number | null;
  bedrooms: number;
  bathrooms: number;
  floor_number: number | null;
  is_furnished: boolean;
  has_ac: boolean;
  has_parking: boolean;
  has_garden: boolean;
  main_image: string | null;
  images: string[] | null;
  video_url?: string | null;
  virtual_tour_url?: string | null;
  panoramic_images?: any;
  floor_plans?: any;
  media_metadata?: any;
  status: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  owner_id: string;
  latitude?: number | null;
  longitude?: number | null;
  work_status?: string | null;
  work_description?: string | null;
  work_images?: any;
  work_estimated_cost?: number | null;
  work_estimated_duration?: string | null;
  work_start_date?: string | null;
  title_deed_url?: string | null;
}

export interface Profile {
  id: string;
  full_name: string;
  user_type: UserType;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  is_verified: boolean;
  oneci_verified: boolean;
  cnam_verified: boolean;
  face_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  property_id: string;
  applicant_id: string;
  status: ApplicationStatus;
  cover_letter: string | null;
  documents: any[];
  application_score: number | null;
  created_at: string;
  reviewed_at: string | null;
  updated_at: string;
}

export interface ApplicationWithDetails extends Application {
  properties: {
    title: string;
    monthly_rent: number;
    city: string;
  };
  profiles: {
    full_name: string;
    phone: string | null;
    oneci_verified: boolean;
    cnam_verified: boolean;
  };
  user_verifications?: UserVerification[];
}

export interface UserVerification {
  id: string;
  user_id: string;
  oneci_status: VerificationStatus;
  cnam_status: VerificationStatus;
  face_verification_status: VerificationStatus;
  tenant_score: number | null;
  oneci_cni_number: string | null;
  oneci_data: any | null;
  cnam_data: any | null;
  cnam_social_security_number: string | null;
  cnam_employer: string | null;
  face_similarity_score: number | null;
  face_verification_attempts: number;
  oneci_verified_at: string | null;
  cnam_verified_at: string | null;
  face_verified_at: string | null;
  score_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lease {
  id: string;
  property_id: string;
  landlord_id: string;
  tenant_id: string;
  monthly_rent: number;
  deposit_amount: number | null;
  charges_amount: number | null;
  lease_type: string;
  start_date: string;
  end_date: string;
  status: string;
  landlord_signed_at: string | null;
  tenant_signed_at: string | null;
  certification_status: string;
  certification_requested_at: string | null;
  ansut_certified_at: string | null;
  certified_by: string | null;
  certification_notes: string | null;
  document_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  application_id: string | null;
  attachments?: unknown;
  is_read: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  category: string;
  title: string;
  message: string | null;
  link: string | null;
  action_url: string | null;
  metadata: any | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  reviewer_id: string;
  reviewee_id: string;
  lease_id: string | null;
  rating: number;
  comment: string | null;
  review_type: string;
  moderation_status: string;
  moderation_notes: string | null;
  moderated_at: string | null;
  moderated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReputationScore {
  id: string;
  user_id: string;
  overall_score: number;
  total_reviews: number;
  avg_rating: number;
  as_tenant_score: number;
  as_tenant_reviews: number;
  as_landlord_score: number;
  as_landlord_reviews: number;
  created_at: string;
  updated_at: string;
}

// Component-specific types
export interface PropertyStats {
  views: number;
  favorites: number;
  applications: number;
  conversionRate: number;
  view_count: number;
  favorites_count: number;
  applications_count: number;
}

export interface DashboardStats {
  totalProperties: number;
  totalViews: number;
  totalFavorites: number;
  totalApplications: number;
  averageRent: number;
  occupancyRate: number;
}

export interface ViewsChartData {
  date: string;
  views: number;
  favorites: number;
}

export interface ApplicationsChartData {
  property: string;
  pending: number;
  approved: number;
  rejected: number;
}

export interface MarketComparisonData {
  propertyType: string;
  myAverage: number;
  marketAverage: number;
  difference: number;
  trend: 'up' | 'down' | 'neutral';
}

export interface TopPropertyData {
  id: string;
  title: string;
  views: number;
  favorites: number;
  applications: number;
  conversionRate: number;
}

export interface SearchFilters {
  city?: string;
  propertyType?: string[];
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  minBathrooms?: number;
  minSurface?: number;
  isFurnished?: boolean;
  furnished?: boolean;
  hasParking?: boolean;
  parking?: boolean;
  hasGarden?: boolean;
  garden?: boolean;
  hasAc?: boolean;
  ac?: boolean;
  latitude?: number;
  longitude?: number;
  radius?: number;
  isAnsutCertified?: boolean;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export type VisitRequestType = 'flexible' | 'specific';
export type VisitRequestStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'converted';
export type InterestLevel = 'very_high' | 'high' | 'medium' | 'low' | 'very_low';
export type SeriousnessLevel = 'very_serious' | 'serious' | 'somewhat_serious' | 'not_serious';
export type DecisionStatus = 'awaiting' | 'wants_to_apply' | 'needs_time' | 'declined' | 'applied' | 'signed';
export type ContactMethod = 'phone' | 'email' | 'whatsapp' | 'sms';
export type FollowUpTaskType = 'urgent_follow_up' | 'standard_follow_up' | 'long_term_follow_up' | 'document_request';
export type FollowUpStatus = 'pending' | 'scheduled' | 'completed' | 'cancelled' | 'overdue';
export type LeadTemperature = 'hot' | 'warm' | 'cold';
export type MovementType = 'automatic' | 'manual';

export interface VisitRequest {
  id: string;
  property_id: string;
  requester_id: string;
  request_type: VisitRequestType;
  preferred_dates?: any;
  specific_slot_id?: string | null;
  availability_notes?: string | null;
  visitor_count: number;
  motivation?: string | null;
  status: VisitRequestStatus;
  priority_score: number;
  score_breakdown?: any;
  agent_response?: string | null;
  agent_response_at?: string | null;
  proposed_slots?: any;
  selected_slot_id?: string | null;
  expires_at: string;
  converted_to_booking_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface VisitRequestWithDetails extends VisitRequest {
  properties: {
    title: string;
    monthly_rent: number;
    city: string;
    main_image: string | null;
  };
  profiles: {
    full_name: string;
    phone: string | null;
    avatar_url: string | null;
    is_verified: boolean;
    oneci_verified: boolean;
    cnam_verified: boolean;
  };
}

export interface AgentAnnotation {
  id: string;
  booking_id: string;
  agent_id: string;
  property_id: string;
  visitor_id: string;
  interest_level?: InterestLevel | null;
  seriousness_level?: SeriousnessLevel | null;
  conversion_probability?: number | null;
  is_hot_lead: boolean;
  visit_behavior?: string | null;
  questions_asked?: string[] | null;
  concerns_expressed?: string[] | null;
  property_feedback?: string | null;
  desired_move_in_date?: string | null;
  confirmed_budget?: number | null;
  family_composition?: string | null;
  relocation_reason?: string | null;
  current_situation?: string | null;
  objections?: any;
  action_items?: string[] | null;
  follow_up_date?: string | null;
  follow_up_method?: ContactMethod | null;
  documents_to_request?: string[] | null;
  decision_status: DecisionStatus;
  decision_notes?: string | null;
  private_notes?: string | null;
  custom_tags?: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface FollowUpTask {
  id: string;
  annotation_id?: string | null;
  agent_id: string;
  visitor_id: string;
  property_id: string;
  scheduled_date: string;
  contact_method: ContactMethod;
  task_type: FollowUpTaskType;
  task_subject: string;
  task_notes?: string | null;
  status: FollowUpStatus;
  completed_at?: string | null;
  completed_notes?: string | null;
  reminder_sent: boolean;
  reminder_sent_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PipelineStage {
  id: string;
  stage_name: string;
  stage_key: string;
  stage_order: number;
  stage_color: string;
  stage_description?: string | null;
  is_active: boolean;
  auto_progress_to?: string | null;
  auto_progress_condition?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PipelineMovement {
  id: string;
  visitor_id: string;
  property_id: string;
  request_id?: string | null;
  booking_id?: string | null;
  current_stage_id: string;
  previous_stage_id?: string | null;
  moved_by?: string | null;
  movement_type: MovementType;
  movement_reason?: string | null;
  lead_temperature?: LeadTemperature | null;
  conversion_probability?: number | null;
  total_interactions: number;
  last_interaction_at?: string | null;
  created_at: string;
}

export interface PipelineProspect extends PipelineMovement {
  visitor: {
    full_name: string;
    avatar_url: string | null;
    phone: string | null;
  };
  property: {
    title: string;
    monthly_rent: number;
  };
  stage: PipelineStage;
}

