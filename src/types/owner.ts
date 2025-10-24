// Types pour le système propriétaire

export interface PropertyAnalytics {
  property_id: string;
  property_title: string;
  property_image: string | null;
  monthly_rent: number;
  views_total: number;
  views_7d: number;
  views_30d: number;
  applications_count: number;
  applications_approved: number;
  applications_pending: number;
  favorites_count: number;
  conversion_rate: number;
  average_response_time_hours: number;
  status: string;
  last_view_date: string | null;
  property_score: number;
}

export interface OwnerDashboardStats {
  total_properties: number;
  available_properties: number;
  rented_properties: number;
  total_views: number;
  total_applications: number;
  pending_applications: number;
  approved_applications: number;
  total_favorites: number;
  average_response_time_hours: number;
  total_revenue: number;
  occupied_percentage: number;
  average_monthly_rent: number;
  properties_by_status: Record<string, number>;
  monthly_trends: {
    applications_this_month: number;
    views_this_month: number;
    favorites_this_month: number;
  };
  top_performing_properties: Array<{
    id: string;
    title: string;
    views: number;
    applications: number;
  }>;
  urgent_actions: any;
}

export interface PropertyView {
  id: string;
  property_id: string;
  user_id: string | null;
  viewed_at: string;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  referrer?: string;
}

export interface MaintenanceRequest {
  id: string;
  property_id: string;
  tenant_id: string | null;
  owner_id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'rejected' | 'cancelled';
  category?: 'plumbing' | 'electrical' | 'hvac' | 'appliances' | 'structural' | 'pest_control' | 'cleaning' | 'other';
  estimated_cost?: number;
  actual_cost?: number;
  images?: string[];
  documents?: string[];
  owner_notes?: string;
  tenant_notes?: string;
  scheduled_date?: string;
  completed_at?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  // Données jointes
  property?: {
    title: string;
    address: string;
    city: string;
  };
  tenant?: {
    full_name: string;
    phone: string;
    avatar_url?: string;
  };
  assigned_user?: {
    full_name: string;
    user_type: string;
  };
}

export interface MaintenanceRequestInput {
  property_id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: 'plumbing' | 'electrical' | 'hvac' | 'appliances' | 'structural' | 'pest_control' | 'cleaning' | 'other';
  estimated_cost?: number;
  images?: string[];
  documents?: string[];
  scheduled_date?: string;
}

export interface ReportHistory {
  id: string;
  owner_id: string;
  report_type: 'monthly' | 'quarterly' | 'annual' | 'custom';
  period_start: string;
  period_end: string;
  generated_at: string;
  report_data: any;
  file_url?: string;
  file_size?: number;
  created_at: string;
}

export interface NotificationData {
  id: string;
  user_id: string;
  type: 'application' | 'lease' | 'message' | 'mandate' | 'system' | 'maintenance' | 'payment' | 'review';
  title: string;
  message: string;
  data?: any;
  action_url?: string;
  is_read: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  read_at?: string;
  expires_at?: string;
}

export interface UserVerification {
  id: string;
  user_id: string;
  verification_type: 'oneci' | 'cnam' | 'face' | 'address' | 'income' | 'phone' | 'email';
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'expired';
  verification_data?: any;
  documents?: string[];
  verified_at?: string;
  verified_by?: string;
  expires_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface ExtendedProperty {
  // Champs de base existants
  id: string;
  title: string;
  description: string | null;
  property_type: string;
  address: string;
  city: string;
  bedrooms: number | null;
  bathrooms: number | null;
  surface_area: number | null;
  is_furnished: boolean | null;
  has_ac: boolean | null;
  has_parking: boolean | null;
  has_garden: boolean | null;
  monthly_rent: number;
  deposit_amount: number | null;
  owner_id: string;
  latitude: number | null;
  longitude: number | null;
  images: string[] | null;
  main_image: string | null;
  view_count: number;
  status: string;
  created_at: string;
  updated_at: string;

  // Champs ajoutés
  neighborhood?: string;
  work_status: 'none' | 'planned' | 'in_progress' | 'completed' | 'cancelled';
  work_description?: string;
  work_images?: string[];
  work_estimated_cost?: number;
  work_estimated_duration?: number;
  work_start_date?: string;
  title_deed_url?: string;
  is_new: boolean;
  moderation_status: 'pending' | 'approved' | 'rejected' | 'needs_review';
  moderation_notes?: string;
  video_url?: string;
  virtual_tour_url?: string;
  panoramic_images?: string[];
  floor_plans?: any;
  media_metadata?: any;
  amenities?: string[];
  nearby_poi?: string[];
  transport_access?: string;
  year_built?: number;
  floor_number?: number;
  total_floors?: number;
  available_from?: string;
  energy_rating?: string;
  parking_spaces?: number;
  balcony?: boolean;
  terrace?: boolean;
  basement?: boolean;
  elevator?: boolean;
  accessible?: boolean;
  furnished_description?: string;
  rental_conditions?: string;
  house_rules?: string;
  security_deposit_rules?: string;
  pet_policy?: 'allowed' | 'not_allowed' | 'upon_request' | 'small_only' | 'cats_only' | 'dogs_only';

  // Données jointes
  owner?: {
    full_name: string;
    phone: string;
    avatar_url?: string;
  };
  stats?: {
    views: number;
    favorites: number;
    applications: number;
    conversionRate: number;
  };
}

export interface ExtendedRentalApplication {
  // Champs de base existants
  id: string;
  property_id: string;
  applicant_id: string;
  status: string;
  cover_letter: string | null;
  documents: any;
  application_score: number | null;
  created_at: string;
  reviewed_at?: string;
  updated_at: string;

  // Champs ajoutés
  processing_deadline?: string;
  is_overdue: boolean;
  auto_processed: boolean;
  auto_action_type?: 'auto_approve' | 'auto_reject' | 'flag_for_review' | 'request_more_info';
  priority_score: number;
  guarantor_info?: any;
  employment_info?: any;
  income_info?: any;
  rental_history?: any;
  background_check_status: 'not_started' | 'in_progress' | 'passed' | 'failed' | 'waived';
  reference_check_status: 'not_started' | 'in_progress' | 'passed' | 'failed' | 'waived';
  credit_check_status: 'not_started' | 'in_progress' | 'passed' | 'failed' | 'waived';
  interview_scheduled_at?: string;
  interview_completed_at?: string;
  site_visit_scheduled_at?: string;
  site_visit_completed_at?: string;
  decision_notes?: string;
  internal_notes?: string;
  next_follow_up_date?: string;
  assigned_to?: string;
  documents_verified: boolean;
  verification_score: number;
  matching_score: number;
  last_activity_at: string;

  // Données jointes
  property?: {
    title: string;
    monthly_rent: number;
    city: string;
    owner_id: string;
  };
  applicant?: {
    full_name: string;
    phone: string;
    avatar_url?: string;
    oneci_verified: boolean;
    cnam_verified: boolean;
  };
  assigned_user?: {
    full_name: string;
    user_type: string;
  };
}

export interface RecommendationData {
  recommended_property_id: string;
  score: number;
  reason: string;
  matching_criteria: {
    price_difference_percent?: number;
    same_neighborhood: boolean;
    same_bedrooms: boolean;
    same_type: boolean;
    monthly_rent: number;
    view_count: number;
  };
}

export interface ConversationType {
  conversation_type: string;
  context_data: {
    property_id?: string;
    property_status?: string;
    property_owner_id?: string;
    sender_role?: string;
    receiver_role?: string;
    has_application?: boolean;
    has_mandate?: boolean;
    is_sender_owner?: boolean;
    is_receiver_owner?: boolean;
  };
  suggested_actions: string[];
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formatted_address: string;
  confidence: number;
  neighborhood?: string;
}

// Types pour les formulaires
export interface MaintenanceRequestForm {
  property_id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  estimated_cost?: string;
  scheduled_date?: string;
  images?: File[];
  documents?: File[];
  owner_notes?: string;
}

export interface ReportGenerationForm {
  report_type: 'monthly' | 'quarterly' | 'annual' | 'custom';
  period_start: string;
  period_end: string;
  include_charts: boolean;
  include_images: boolean;
  format: 'pdf' | 'excel';
  email_recipients?: string[];
}

export interface PropertyFilterForm {
  status?: string[];
  property_type?: string[];
  price_range?: [number, number];
  bedrooms?: number[];
  neighborhoods?: string[];
  amenities?: string[];
  work_status?: string[];
  moderation_status?: string[];
  date_range?: {
    start: string;
    end: string;
  };
}

// Types pour les états et chargement
export interface OwnerState {
  stats: OwnerDashboardStats | null;
  propertyAnalytics: PropertyAnalytics[];
  maintenanceRequests: MaintenanceRequest[];
  notifications: NotificationData[];
  reports: ReportHistory[];
  loading: {
    stats: boolean;
    analytics: boolean;
    maintenance: boolean;
    notifications: boolean;
    reports: boolean;
  };
  error: string | null;
}

// Types pour les actions et mutations
export interface OwnerActions {
  refreshStats: () => void;
  refreshAnalytics: (period?: string) => void;
  trackPropertyView: (propertyId: string) => void;
  createMaintenanceRequest: (data: MaintenanceRequestInput) => void;
  updateMaintenanceRequest: (id: string, updates: Partial<MaintenanceRequest>) => void;
  markNotificationAsRead: (id: string) => void;
  generateReport: (data: ReportGenerationForm) => void;
  downloadReport: (id: string) => void;
}