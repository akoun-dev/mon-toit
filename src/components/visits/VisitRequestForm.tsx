import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Clock, Users, MessageSquare, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useCreateVisitRequest } from "@/hooks/useVisitRequests";

const visitRequestSchema = z.object({
  request_type: z.enum(['flexible', 'specific'], {
    errorMap: () => ({ message: "Veuillez sélectionner un type de demande" })
  }),
  visitor_count: z.number({
    required_error: "Le nombre de visiteurs est requis",
    invalid_type_error: "Le nombre doit être un chiffre valide"
  })
    .min(1, "Au moins 1 visiteur est requis")
    .max(10, "Maximum 10 visiteurs autorisés"),
  motivation: z.string()
    .max(500, "La motivation ne peut pas dépasser 500 caractères")
    .optional(),
  preferred_dates: z.array(z.date()).optional(),
  availability_notes: z.string()
    .max(1000, "Les notes de disponibilité ne peuvent pas dépasser 1000 caractères")
    .optional(),
  specific_slot_id: z.string().uuid("ID de créneau invalide").optional(),
}).refine(
  (data) => {
    if (data.request_type === 'flexible') {
      return (data.preferred_dates && data.preferred_dates.length > 0) || data.availability_notes;
    }
    if (data.request_type === 'specific') {
      return !!data.specific_slot_id;
    }
    return true;
  },
  {
    message: "Pour une demande flexible, veuillez fournir au moins une date préférée ou des notes de disponibilité. Pour une demande spécifique, veuillez sélectionner un créneau.",
    path: ['availability_notes'],
  }
);

type VisitRequestFormValues = z.infer<typeof visitRequestSchema>;

interface VisitRequestFormProps {
  propertyId: string;
  propertyTitle: string;
  availableSlots?: Array<{
    id: string;
    start_time: string;
    end_time: string;
    available_spots: number;
  }>;
  onSuccess?: () => void;
}

export function VisitRequestForm({
  propertyId,
  propertyTitle,
  availableSlots = [],
  onSuccess
}: VisitRequestFormProps) {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const createRequest = useCreateVisitRequest();

  const form = useForm<VisitRequestFormValues>({
    resolver: zodResolver(visitRequestSchema),
    defaultValues: {
      request_type: 'flexible',
      visitor_count: 1,
      motivation: '',
      preferred_dates: [],
      availability_notes: '',
      specific_slot_id: undefined,
    },
  });

  const requestType = form.watch('request_type');

  const onSubmit = async (values: VisitRequestFormValues) => {
    const requestData = {
      property_id: propertyId,
      request_type: values.request_type,
      visitor_count: values.visitor_count,
      motivation: values.motivation || null,
      preferred_dates: values.preferred_dates?.map(d => d.toISOString()) || null,
      availability_notes: values.availability_notes || null,
      specific_slot_id: values.specific_slot_id || null,
    };

    await createRequest.mutateAsync(requestData);

    if (onSuccess) {
      onSuccess();
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    const dateIndex = selectedDates.findIndex(
      d => d.toDateString() === date.toDateString()
    );

    let newDates: Date[];
    if (dateIndex > -1) {
      newDates = selectedDates.filter((_, i) => i !== dateIndex);
    } else {
      if (selectedDates.length >= 5) {
        return;
      }
      newDates = [...selectedDates, date];
    }

    setSelectedDates(newDates);
    form.setValue('preferred_dates', newDates);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Demande de visite</CardTitle>
        <CardDescription>
          Demandez une visite pour {propertyTitle}
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
                      className="flex flex-col space-y-3"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="flexible" />
                        </FormControl>
                        <div className="space-y-1">
                          <FormLabel className="font-medium">
                            Dates flexibles
                          </FormLabel>
                          <FormDescription>
                            Proposez vos disponibilités et l'agent vous proposera un créneau
                          </FormDescription>
                        </div>
                      </FormItem>
                      {availableSlots.length > 0 && (
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="specific" />
                          </FormControl>
                          <div className="space-y-1">
                            <FormLabel className="font-medium">
                              Créneau spécifique
                            </FormLabel>
                            <FormDescription>
                              Choisissez parmi les créneaux disponibles
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {requestType === 'flexible' && (
              <>
                <FormField
                  control={form.control}
                  name="preferred_dates"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Dates préférées (max 5)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !selectedDates.length && "text-muted-foreground"
                              )}
                            >
                              {selectedDates.length > 0 ? (
                                <span>
                                  {selectedDates.length} date{selectedDates.length > 1 ? 's' : ''} sélectionnée{selectedDates.length > 1 ? 's' : ''}
                                </span>
                              ) : (
                                <span>Sélectionnez vos dates préférées</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedDates[0]}
                            onSelect={handleDateSelect}
                            disabled={(date) =>
                              date < new Date() || date < new Date("1900-01-01")
                            }
                            locale={fr}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {selectedDates.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedDates.map((date, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-md text-sm"
                            >
                              <CheckCircle className="h-3 w-3" />
                              {format(date, 'PPP', { locale: fr })}
                            </div>
                          ))}
                        </div>
                      )}
                      <FormDescription>
                        Sélectionnez jusqu'à 5 dates où vous êtes disponible
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="availability_notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes de disponibilité</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ex: Disponible en semaine après 18h, ou le samedi matin..."
                          className="resize-none"
                          rows={3}
                          maxLength={1000}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value?.length || 0} / 1000 caractères
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {requestType === 'specific' && availableSlots.length > 0 && (
              <FormField
                control={form.control}
                name="specific_slot_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Créneaux disponibles</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex flex-col space-y-2"
                      >
                        {availableSlots.map((slot) => (
                          <FormItem
                            key={slot.id}
                            className="flex items-center space-x-3 space-y-0"
                          >
                            <FormControl>
                              <RadioGroupItem value={slot.id} />
                            </FormControl>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <FormLabel className="font-normal">
                                {format(new Date(slot.start_time), 'PPP', { locale: fr })} - {' '}
                                {format(new Date(slot.start_time), 'HH:mm')} à{' '}
                                {format(new Date(slot.end_time), 'HH:mm')}
                                <span className="text-muted-foreground ml-2">
                                  ({slot.available_spots} place{slot.available_spots > 1 ? 's' : ''})
                                </span>
                              </FormLabel>
                            </div>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="visitor_count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de visiteurs</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Entre 1 et 10 personnes (vous inclus)
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
                      placeholder="Expliquez pourquoi ce bien vous intéresse..."
                      className="resize-none"
                      rows={4}
                      maxLength={500}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    <MessageSquare className="h-4 w-4 inline mr-1" />
                    {field.value?.length || 0} / 500 caractères - Une motivation claire améliore vos chances
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={createRequest.isPending}
            >
              {createRequest.isPending ? "Envoi en cours..." : "Envoyer la demande"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
