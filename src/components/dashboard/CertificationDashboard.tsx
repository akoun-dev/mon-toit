import { useOwnerLeaseCertification } from '@/hooks/useOwnerLeaseCertification';
import { LeaseCertificationStats } from './LeaseCertificationStats';
import { LeaseCertificationTable } from './LeaseCertificationTable';
import { CertificationTrendChart } from './CertificationTrendChart';
import { CertificationActionsCard } from './CertificationActionsCard';

export const CertificationDashboard = () => {
  const { 
    leases, 
    stats: certificationStats, 
    monthlyTrends, 
    loading: certificationLoading 
  } = useOwnerLeaseCertification();

  return (
    <div className="space-y-4">
      {/* Lease Certification Dashboard */}
      <LeaseCertificationStats stats={certificationStats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CertificationTrendChart data={monthlyTrends} />
        <CertificationActionsCard leases={leases} />
      </div>

      <LeaseCertificationTable leases={leases} loading={certificationLoading} />
    </div>
  );
};
