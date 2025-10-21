import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';
import {
  Smartphone,
  CreditCard,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Receipt,
  History,
  TrendingUp
} from 'lucide-react';

interface Payment {
  id: string;
  amount: number;
  payment_type: string;
  payment_method: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  completed_at: string | null;
  transaction_id: string | null;
  due_date: string;
  lease_id: string;
}

interface Lease {
  id: string;
  monthly_rent: number;
  deposit_amount: number;
  status: string;
  start_date: string;
  end_date: string;
  properties: {
    title: string;
    address: string;
  };
}

interface RentPaymentWidgetProps {
  leaseId?: string;
  className?: string;
}

const RentPaymentWidget: React.FC<RentPaymentWidgetProps> = ({
  leaseId,
  className
}) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [lease, setLease] = useState<Lease | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('payment');

  // Form states
  const [amount, setAmount] = useState('');
  const [paymentType, setPaymentType] = useState('rent');
  const [paymentMethod, setPaymentMethod] = useState('orange_money');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Mobile money providers
  const mobileMoneyProviders = [
    { value: 'orange_money', label: 'Orange Money', icon: '🟠' },
    { value: 'mtn_money', label: 'MTN Money', icon: '🟡' },
    { value: 'moov_money', label: 'Moov Money', icon: '🟢' },
    { value: 'wave', label: 'Wave', icon: '🌊' }
  ];

  useEffect(() => {
    if (user) {
      if (leaseId) {
        fetchLeaseDetails(leaseId);
      }
      fetchPayments();
    }
  }, [user, leaseId]);

  const fetchLeaseDetails = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('leases')
        .select(`
          *,
          properties (title, address)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setLease(data);

      // Pre-fill amount with rent
      setAmount(data.monthly_rent.toString());
    } catch (error) {
      logger.error('Error fetching lease details', { error, leaseId: id });
    }
  };

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('payer_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      logger.error('Error fetching payments', { error, userId: user?.id });
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!amount || !phoneNumber) {
        toast({
          title: 'Erreur',
          description: 'Veuillez remplir tous les champs',
          variant: 'destructive'
        });
        return;
      }

      // Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          payer_id: user?.id,
          receiver_id: lease?.landlord_id || user?.id, // Fallback
          amount: parseFloat(amount),
          payment_type: paymentType,
          payment_method: paymentMethod,
          status: 'pending',
          lease_id: leaseId,
          due_date: new Date().toISOString()
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Call mobile money payment edge function
      const { data, error } = await supabase.functions.invoke('mobile-money-payment', {
        body: {
          amount: parseFloat(amount),
          phoneNumber,
          provider: paymentMethod,
          paymentId: payment.id,
          paymentType
        }
      });

      if (error) throw error;

      toast({
        title: 'Paiement initié',
        description: `Vous allez recevoir une notification ${paymentMethod.replace('_', ' ')} pour confirmer le paiement de ${amount} FCFA.`,
      });

      // Refresh payments
      fetchPayments();

      // Reset form
      setAmount('');
      setPhoneNumber('');

    } catch (error) {
      logger.error('Error processing payment', { error, userId: user?.id });
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors du paiement',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: Payment['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: Payment['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (status: Payment['status']) => {
    switch (status) {
      case 'completed':
        return 'Effectué';
      case 'failed':
        return 'Échoué';
      case 'cancelled':
        return 'Annulé';
      default:
        return 'En attente';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Paiement Mobile Money
          </CardTitle>
          <CardDescription>
            Payer votre loyer en toute sécurité via Mobile Money
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="payment" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Nouveau paiement
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Historique
              </TabsTrigger>
            </TabsList>

            <TabsContent value="payment" className="space-y-4">
              {/* Lease Information */}
              {lease && (
                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{lease.properties.title}</strong> - {lease.properties.address}
                    <br />
                    Loyer mensuel: <strong>{lease.monthly_rent.toLocaleString()} FCFA</strong>
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handlePayment} className="space-y-4">
                {/* Payment Type */}
                <div className="space-y-2">
                  <Label htmlFor="payment-type">Type de paiement</Label>
                  <Select value={paymentType} onValueChange={setPaymentType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rent">Loyer</SelectItem>
                      <SelectItem value="deposit">Caution</SelectItem>
                      <SelectItem value="charges">Charges</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <Label htmlFor="amount">Montant (FCFA)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="50000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                  <Label htmlFor="payment-method">Opérateur Mobile Money</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mobileMoneyProviders.map((provider) => (
                        <SelectItem key={provider.value} value={provider.value}>
                          <span className="flex items-center gap-2">
                            <span>{provider.icon}</span>
                            {provider.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Numéro de téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+225 07 00 00 00 00"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Format: +225 XX XX XX XX XX
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Traitement en cours...
                    </>
                  ) : (
                    <>
                      <Smartphone className="mr-2 h-4 w-4" />
                      Payer {amount ? `${parseInt(amount).toLocaleString()} FCFA` : ''}
                    </>
                  )}
                </Button>
              </form>

              {/* Security Notice */}
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Sécurité garantie:</strong> Les transactions sont cryptées et protégées.
                  Vous recevrez une notification sur votre téléphone pour confirmer le paiement.
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {payments.length > 0 ? (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <Card key={payment.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {payment.amount.toLocaleString()} FCFA
                              </span>
                              <Badge className={getStatusColor(payment.status)}>
                                <div className="flex items-center gap-1">
                                  {getStatusIcon(payment.status)}
                                  {getStatusText(payment.status)}
                                </div>
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {payment.payment_type} • {payment.payment_method.replace('_', ' ')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDate(payment.created_at)}
                              {payment.completed_at && (
                                <span> • Effectué: {formatDate(payment.completed_at)}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {payment.transaction_id && (
                              <Receipt className="h-4 w-4 text-muted-foreground" />
                            )}
                            {payment.status === 'completed' && (
                              <Button variant="outline" size="sm">
                                Reçu
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun paiement effectué</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default RentPaymentWidget;