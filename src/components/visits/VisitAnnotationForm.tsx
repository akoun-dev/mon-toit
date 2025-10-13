import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCreateAnnotation } from '@/hooks/useAgentAnnotations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AgentAnnotation } from '@/types';

interface VisitAnnotationFormProps {
  bookingId: string;
  agentId: string;
  propertyId: string;
  visitorId: string;
  onSuccess?: () => void;
}

export const VisitAnnotationForm = ({
  bookingId,
  agentId,
  propertyId,
  visitorId,
  onSuccess,
}: VisitAnnotationFormProps) => {
  const createAnnotation = useCreateAnnotation();

  const form = useForm<Partial<AgentAnnotation>>({
    defaultValues: {
      booking_id: bookingId,
      agent_id: agentId,
      property_id: propertyId,
      visitor_id: visitorId,
      is_hot_lead: false,
      decision_status: 'awaiting',
    },
  });

  const onSubmit = async (data: Partial<AgentAnnotation>) => {
    await createAnnotation.mutateAsync(data as Omit<AgentAnnotation, 'id' | 'created_at' | 'updated_at'>);
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Annotations de visite</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="evaluation">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="evaluation">Évaluation</TabsTrigger>
                <TabsTrigger value="observations">Observations</TabsTrigger>
                <TabsTrigger value="infos">Infos</TabsTrigger>
                <TabsTrigger value="suivi">Suivi</TabsTrigger>
              </TabsList>

              <TabsContent value="evaluation" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="interest_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Niveau d'intérêt</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="very_high">Très élevé</SelectItem>
                          <SelectItem value="high">Élevé</SelectItem>
                          <SelectItem value="medium">Moyen</SelectItem>
                          <SelectItem value="low">Faible</SelectItem>
                          <SelectItem value="very_low">Très faible</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="seriousness_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sérieux du prospect</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="very_serious">Très sérieux</SelectItem>
                          <SelectItem value="serious">Sérieux</SelectItem>
                          <SelectItem value="somewhat_serious">Moyennement sérieux</SelectItem>
                          <SelectItem value="not_serious">Pas sérieux</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="conversion_probability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Probabilité de conversion (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_hot_lead"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Lead chaud</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Marquer comme prospect prioritaire
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="observations" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="visit_behavior"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comportement pendant la visite</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={4} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="property_feedback"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Retour sur le bien</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="infos" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="desired_move_in_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date d'emménagement souhaitée</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmed_budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget confirmé (FCFA)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="family_composition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Composition familiale</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Couple avec 2 enfants" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="current_situation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Situation actuelle</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="suivi" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="follow_up_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de relance</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="follow_up_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Méthode de contact</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="phone">Téléphone</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="decision_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statut de décision</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="awaiting">En attente</SelectItem>
                          <SelectItem value="wants_to_apply">Veut postuler</SelectItem>
                          <SelectItem value="needs_time">Demande du temps</SelectItem>
                          <SelectItem value="declined">A décliné</SelectItem>
                          <SelectItem value="applied">A postulé</SelectItem>
                          <SelectItem value="signed">A signé</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="private_notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes privées</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={4} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <Button type="submit" disabled={createAnnotation.isPending} className="w-full">
              {createAnnotation.isPending ? 'Enregistrement...' : 'Enregistrer les annotations'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
