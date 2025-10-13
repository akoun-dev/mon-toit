import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, Clock, Users, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCreateVisitRequest } from '@/hooks/useVisitRequests';

const visitRequestSchema = z.object({
  request_type: z.enum(['flexible', 'specific']),
  visitor_count: z.number().min(1).max(10),
  motivation: z.string().optional(),
  availability_notes: z.string().optional(),
  preferred_dates: z.array(z.string()).optional(),
});

type VisitRequestFormData = z.infer<typeof visitRequestSchema>;

interface VisitRequestFormProps {
  propertyId: string;
  propertyTitle: string;
  onSuccess?: () => void;
}

export const VisitRequestForm = ({ propertyId, propertyTitle, onSuccess }: VisitRequestFormProps) => {
  const [preferredDates, setPreferredDates] = useState<string[]>([]);
  const createRequest = useCreateVisitRequest();

  const form = useForm<VisitRequestFormData>({
    resolver: zodResolver(visitRequestSchema),
    defaultValues: {
      request_type: 'flexible',
      visitor_count: 1,
      motivation: '',
      availability_notes: '',
    },
  });

  const requestType = form.watch('request_type');

  const onSubmit = async (data: VisitRequestFormData) => {
    await createRequest.mutateAsync({
      property_id: propertyId,
      request_type: data.request_type,
      visitor_count: data.visitor_count,
      motivation: data.motivation,
      availability_notes: data.availability_notes,
      preferred_dates: preferredDates.length > 0 ? preferredDates : undefined,
    });

    if (onSuccess) {
      onSuccess();
    }
  };

  const addPreferredDate = () => {
    const newDate = new Date().toISOString().split('T')[0];
    setPreferredDates([...preferredDates, newDate]);
  };

  const removePreferredDate = (index: number) => {
    setPreferredDates(preferredDates.filter((_, i) => i !== index));
  };

  const updatePreferredDate = (index: number, value: string) => {
    const newDates = [...preferredDates];
    newDates[index] = value;
    setPreferredDates(newDates);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Demander une visite</CardTitle>
        <CardDescription>
          Demandez à visiter {propertyTitle}. Votre demande sera traitée sous 48 heures.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="request_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de demande</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-2 gap-4"
                    >
                      <div>
                        <RadioGroupItem
                          value="flexible"
                          id="flexible"
                          className="peer sr-only"
                        />
                        <label
                          htmlFor="flexible"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                          <Calendar className="mb-3 h-6 w-6" />
                          <div className="text-center">
                            <div className="font-semibold">Flexible</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Je suis disponible plusieurs jours
                            </div>
                          </div>
                        </label>
                      </div>
                      <div>
                        <RadioGroupItem
                          value="specific"
                          id="specific"
                          className="peer sr-only"
                        />
                        <label
                          htmlFor="specific"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                          <Clock className="mb-3 h-6 w-6" />
                          <div className="text-center">
                            <div className="font-semibold">Créneau spécifique</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Je veux un créneau précis
                            </div>
                          </div>
                        </label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {requestType === 'flexible' && (
              <div className="space-y-3">
                <FormLabel>Dates préférées (optionnel)</FormLabel>
                <FormDescription>
                  Indiquez plusieurs dates où vous êtes disponible
                </FormDescription>
                {preferredDates.map((date, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => updatePreferredDate(index, e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removePreferredDate(index)}
                    >
                      Retirer
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addPreferredDate}
                  className="w-full"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Ajouter une date
                </Button>
              </div>
            )}

            <FormField
              control={form.control}
              name="availability_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes de disponibilité</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Disponible samedi et dimanche après-midi"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Précisez vos disponibilités pour faciliter la planification
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="visitor_count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de visiteurs</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-4">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Combien de personnes visiteront le bien ?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="motivation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivation (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Pourquoi ce bien vous intéresse-t-il ?"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Expliquez pourquoi vous souhaitez visiter ce bien
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={createRequest.isPending}
                className="flex-1"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                {createRequest.isPending ? 'Envoi en cours...' : 'Envoyer la demande'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
