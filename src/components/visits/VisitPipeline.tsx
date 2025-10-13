import { usePipelineStages, usePipelineProspects } from '@/hooks/useVisitPipeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Flame, TrendingUp } from 'lucide-react';

interface VisitPipelineProps {
  propertyId?: string;
}

export const VisitPipeline = ({ propertyId }: VisitPipelineProps) => {
  const { data: stages, isLoading: stagesLoading } = usePipelineStages();
  const { data: prospects, isLoading: prospectsLoading } = usePipelineProspects({ propertyId });

  if (stagesLoading || prospectsLoading) {
    return <div>Chargement du pipeline...</div>;
  }

  const getProspectsByStage = (stageId: string) => {
    return prospects?.filter((p) => p.current_stage_id === stageId) || [];
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Pipeline CRM</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stages?.map((stage) => {
          const stageProspects = getProspectsByStage(stage.id);
          return (
            <Card key={stage.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span style={{ color: stage.stage_color }}>{stage.stage_name}</span>
                  <Badge variant="secondary">{stageProspects.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stageProspects.length > 0 ? (
                  stageProspects.map((prospect) => (
                    <Card key={prospect.id} className="p-3">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={prospect.visitor?.avatar_url || undefined} />
                          <AvatarFallback>
                            {prospect.visitor?.full_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">
                              {prospect.visitor?.full_name}
                            </p>
                            {prospect.lead_temperature === 'hot' && (
                              <Flame className="h-3 w-3 text-red-500" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {prospect.property?.title}
                          </p>
                          {prospect.conversion_probability && (
                            <div className="flex items-center gap-1 mt-1">
                              <TrendingUp className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {prospect.conversion_probability}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Aucun prospect
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
