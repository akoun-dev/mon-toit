import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { TenantScoreMeter } from './TenantScoreMeter';
import { supabase } from '@/lib/supabase';

export const ProfileScoreCardCompact = () => {
  const { profile, user } = useAuth();
  const [tenantScore, setTenantScore] = useState(0);

  useEffect(() => {
    const fetchTenantScore = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('user_verifications')
        .select('tenant_score')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data?.tenant_score) {
        setTenantScore(data.tenant_score);
      }
    };

    fetchTenantScore();
  }, [user]);

  const verificationCount = [
    profile?.oneci_verified,
    profile?.face_verified,
  ].filter(Boolean).length;
  
  const isFullyVerified = verificationCount === 2;

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-background to-background border-primary/20 h-[140px] xs:h-[150px] sm:h-[160px] md:h-[180px]">
      <CardContent className="p-2 xs:p-3 sm:p-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-1 sm:mb-2">
          <div className="flex items-center gap-1 sm:gap-2">
            <Shield className="h-3 w-3 xs:h-4 xs:w-4 text-primary" />
            <span className="text-xs xs:text-sm font-semibold">Votre Profil</span>
          </div>
          {isFullyVerified ? (
            <Badge variant="default" className="bg-green-600 text-xs px-1 py-0">
              <CheckCircle2 className="h-2.5 w-2.5 xs:h-3 xs:w-3" />
            </Badge>
          ) : (
            <Badge variant="outline" className="border-yellow-600 text-yellow-600 text-xs px-1 py-0">
              <AlertCircle className="h-2.5 w-2.5 xs:h-3 xs:w-3" />
            </Badge>
          )}
        </div>

        {tenantScore > 0 && (
          <div className="flex-1 flex items-center justify-center my-0.5 sm:my-1">
            <div className="scale-50 xs:scale-60 sm:scale-75">
              <TenantScoreMeter score={tenantScore} />
            </div>
          </div>
        )}

        <div className="space-y-0.5 sm:space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Vérifications</span>
            <span className="font-semibold">{verificationCount}/2</span>
          </div>
          <div className="flex gap-1">
            <div className={`flex-1 h-1 xs:h-1.5 rounded-full ${profile?.oneci_verified ? 'bg-green-600' : 'bg-muted'}`} />
            <div className={`flex-1 h-1 xs:h-1.5 rounded-full ${profile?.face_verified ? 'bg-green-600' : 'bg-muted'}`} />
          </div>
        </div>

        {!isFullyVerified && (
          <Button asChild variant="outline" size="sm" className="w-full mt-1 sm:mt-2 h-5 xs:h-6 sm:h-7 text-xs">
            <Link to="/verification">
              <span className="hidden xs:inline">Compléter</span>
              <span className="xs:hidden">✓</span>
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
};