import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { logger } from '@/services/logger';

export interface LeaseCertificationData {
  lease_id: string;
  property_id: string;
  property_title: string;
  property_image: string | null;
  tenant_name: string | null;
  certification_status: 'not_requested' | 'pending' | 'certified' | 'rejected';
  certification_requested_at: string | null;
  verified_at: string | null;
  certification_notes: string | null;
  monthly_rent: number;
  start_date: string;
  end_date: string;
  lease_status: string;
}

export interface OwnerCertificationStats {
  total_leases: number;
  certified_count: number;
  pending_count: number;
  rejected_count: number;
  not_requested_count: number;
  certification_rate: number;
  avg_processing_days: number;
  this_month_certified: number;
  urgent_actions: number;
}

export interface MonthlyTrend {
  month: string;
  certified: number;
  pending: number;
  rejected: number;
  not_requested: number;
}

export const useOwnerLeaseCertification = () => {
  const { user } = useAuth();
  const [leases, setLeases] = useState<LeaseCertificationData[]>([]);
  const [stats, setStats] = useState<OwnerCertificationStats>({
    total_leases: 0,
    certified_count: 0,
    pending_count: 0,
    rejected_count: 0,
    not_requested_count: 0,
    certification_rate: 0,
    avg_processing_days: 0,
    this_month_certified: 0,
    urgent_actions: 0,
  });
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchLeaseCertificationData();
  }, [user]);

  const fetchLeaseCertificationData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch leases with related data
      const { data: leasesData, error: leasesError } = await supabase
        .from('leases')
        .select(`
          id,
          property_id,
          tenant_id,
          certification_status,
          certification_requested_at,
          verified_at,
          certification_notes,
          monthly_rent,
          start_date,
          end_date,
          status,
          properties (
            title,
            main_image
          ),
          profiles!leases_tenant_id_fkey (
            full_name
          )
        `)
        .eq('landlord_id', user.id)
        .order('certification_requested_at', { ascending: false, nullsFirst: false });

      if (leasesError) throw leasesError;

      // Transform data
      const transformedLeases: LeaseCertificationData[] = (leasesData || []).map((lease: any) => ({
        lease_id: lease.id,
        property_id: lease.property_id,
        property_title: lease.properties?.title || 'Sans titre',
        property_image: lease.properties?.main_image || null,
        tenant_name: lease.profiles?.full_name || 'Non renseigné',
        certification_status: lease.certification_status || 'not_requested',
        certification_requested_at: lease.certification_requested_at,
        verified_at: lease.verified_at,
        certification_notes: lease.certification_notes,
        monthly_rent: lease.monthly_rent,
        start_date: lease.start_date,
        end_date: lease.end_date,
        lease_status: lease.status,
      }));

      setLeases(transformedLeases);

      // Calculate statistics
      const totalLeases = transformedLeases.length;
      const certifiedCount = transformedLeases.filter(l => l.certification_status === 'certified').length;
      const pendingCount = transformedLeases.filter(l => l.certification_status === 'pending').length;
      const rejectedCount = transformedLeases.filter(l => l.certification_status === 'rejected').length;
      const notRequestedCount = transformedLeases.filter(l => l.certification_status === 'not_requested').length;

      const certificationRate = totalLeases > 0 
        ? Math.round((certifiedCount / totalLeases) * 100) 
        : 0;

      // Calculate average processing time
      const processingTimes = transformedLeases
        .filter(l => l.certification_requested_at && l.verified_at)
        .map(l => {
          const requested = new Date(l.certification_requested_at!);
          const verified = new Date(l.verified_at!);
          return (verified.getTime() - requested.getTime()) / (1000 * 60 * 60 * 24);
        });

      const avgProcessingDays = processingTimes.length > 0
        ? Math.round(processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length)
        : 0;

      // Calculate this month certified
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthCertified = transformedLeases.filter(l => {
        if (!l.verified_at) return false;
        const verifiedDate = new Date(l.verified_at);
        return verifiedDate >= startOfMonth;
      }).length;

      // Calculate urgent actions (pending > 7 days)
      const urgentActions = transformedLeases.filter(l => {
        if (l.certification_status !== 'pending' || !l.certification_requested_at) return false;
        const requested = new Date(l.certification_requested_at);
        const daysSince = (now.getTime() - requested.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince > 7;
      }).length;

      setStats({
        total_leases: totalLeases,
        certified_count: certifiedCount,
        pending_count: pendingCount,
        rejected_count: rejectedCount,
        not_requested_count: notRequestedCount,
        certification_rate: certificationRate,
        avg_processing_days: avgProcessingDays,
        this_month_certified: thisMonthCertified,
        urgent_actions: urgentActions,
      });

      // Calculate monthly trends (last 12 months)
      const trends: MonthlyTrend[] = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const monthLeases = transformedLeases.filter(l => {
          const leaseDate = new Date(l.start_date);
          return leaseDate >= monthStart && leaseDate <= monthEnd;
        });

        trends.push({
          month: date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
          certified: monthLeases.filter(l => l.certification_status === 'certified').length,
          pending: monthLeases.filter(l => l.certification_status === 'pending').length,
          rejected: monthLeases.filter(l => l.certification_status === 'rejected').length,
          not_requested: monthLeases.filter(l => l.certification_status === 'not_requested').length,
        });
      }

      setMonthlyTrends(trends);

    } catch (err: any) {
      logger.error('Failed to fetch lease certification data', { error: err.message, userId: user.id });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { 
    leases, 
    stats, 
    monthlyTrends, 
    loading, 
    error,
    refresh: fetchLeaseCertificationData 
  };
};
