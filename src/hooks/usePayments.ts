import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface Payment {
  id: string;
  payer_id: string;
  receiver_id: string;
  lease_id?: string;
  property_id?: string;
  amount: number;
  payment_type: 'rent' | 'deposit' | 'fees' | 'charges' | 'maintenance' | 'penalty';
  payment_method: 'orange_money' | 'mtn_money' | 'moov_money' | 'wave' | 'cash' | 'bank_transfer' | 'mobile_wallet';
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  transaction_id?: string;
  external_transaction_id?: string;
  due_date: string;
  paid_at?: string;
  completed_at?: string;
  processing_fee: number;
  platform_fee: number;
  total_amount: number;
  description?: string;
  notes?: string;
  payment_receipt_url?: string;
  failure_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentStats {
  totalPaid: number;
  totalDue: number;
  upcomingPayments: number;
  overduePayments: number;
  thisMonthPaid: number;
  thisMonthDue: number;
}

export interface PaymentFormData {
  lease_id?: string;
  property_id?: string;
  amount: number;
  payment_type: Payment['payment_type'];
  payment_method: Payment['payment_method'];
  description?: string;
}

interface InitiatePaymentResponse {
  payment: Payment;
  payment_url?: string;
  instructions?: string;
}

/**
 * Hook pour la gestion des paiements
 */
export const usePayments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Récupérer tous les paiements de l'utilisateur
  const {
    data: payments,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['payments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          lease:leases(
            id,
            property:properties(id, title, address)
          ),
          payer:profiles!payments_payer_id_fkey(full_name, email),
          receiver:profiles!payments_receiver_id_fkey(full_name, email)
        `)
        .or(`payer_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Payment[];
    },
    enabled: !!user?.id
  });

  // Récupérer les statistiques de paiements
  const {
    data: stats,
    isLoading: isLoadingStats
  } = useQuery({
    queryKey: ['payment-stats', user?.id],
    queryFn: async (): Promise<PaymentStats> => {
      if (!user?.id) {
        return {
          totalPaid: 0,
          totalDue: 0,
          upcomingPayments: 0,
          overduePayments: 0,
          thisMonthPaid: 0,
          thisMonthDue: 0
        };
      }

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('payer_id', user.id);

      if (error) throw error;

      const allPayments = data as Payment[];

      const totalPaid = allPayments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.total_amount, 0);

      const totalDue = allPayments
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + p.total_amount, 0);

      const upcomingPayments = allPayments
        .filter(p => p.status === 'pending' && new Date(p.due_date) > now)
        .length;

      const overduePayments = allPayments
        .filter(p => p.status === 'pending' && new Date(p.due_date) < now)
        .length;

      const thisMonthPayments = allPayments.filter(p => {
        const paymentDate = new Date(p.created_at);
        return paymentDate >= startOfMonth && paymentDate <= endOfMonth;
      });

      const thisMonthPaid = thisMonthPayments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.total_amount, 0);

      const thisMonthDue = thisMonthPayments
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + p.total_amount, 0);

      return {
        totalPaid,
        totalDue,
        upcomingPayments,
        overduePayments,
        thisMonthPaid,
        thisMonthDue
      };
    },
    enabled: !!user?.id
  });

  // Initialiser un paiement
  const initiatePayment = useMutation({
    mutationFn: async (formData: PaymentFormData): Promise<InitiatePaymentResponse> => {
      if (!user?.id) throw new Error('Utilisateur non authentifié');

      const paymentData = {
        ...formData,
        payer_id: user.id,
        status: 'pending',
        currency: 'XOF',
        processing_fee: 0,
        platform_fee: 0,
        due_date: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('payments')
        .insert(paymentData)
        .select()
        .single();

      if (error) throw error;

      // Simuler l'initialisation du paiement mobile money
      // En production, cela appellerait l'API du fournisseur de paiement
      const response: InitiatePaymentResponse = {
        payment: data as Payment,
        payment_url: `https://payment.example.com/pay/${data.id}`,
        instructions: `Veuillez composer le code USSD pour ${formData.payment_method} et suivre les instructions. Montant: ${formData.amount} XOF`
      };

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['payment-stats', user?.id] });
    }
  });

  // Confirmer un paiement (après paiement mobile money réussi)
  const confirmPayment = useMutation({
    mutationFn: async ({ paymentId, transactionId }: { paymentId: string; transactionId: string }) => {
      const { data, error } = await supabase
        .from('payments')
        .update({
          status: 'completed',
          transaction_id: transactionId,
          paid_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (error) throw error;
      return data as Payment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['payment-stats', user?.id] });
    }
  });

  // Annuler un paiement
  const cancelPayment = useMutation({
    mutationFn: async (paymentId: string) => {
      const { data, error } = await supabase
        .from('payments')
        .update({
          status: 'cancelled',
          notes: 'Paiement annulé par l\'utilisateur'
        })
        .eq('id', paymentId)
        .eq('payer_id', user?.id)
        .select()
        .single();

      if (error) throw error;
      return data as Payment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['payment-stats', user?.id] });
    }
  });

  // Télécharger un reçu de paiement
  const downloadReceipt = useMutation({
    mutationFn: async (paymentId: string) => {
      if (!user?.id) throw new Error('Utilisateur non authentifié');

      const { data: payment, error } = await supabase
        .from('payments')
        .select(`
          *,
          lease:leases(
            id,
            property:properties(id, title, address)
          ),
          payer:profiles!payments_payer_id_fkey(full_name, email, phone),
          receiver:profiles!payments_receiver_id_fkey(full_name, email, phone)
        `)
        .eq('id', paymentId)
        .eq('payer_id', user.id)
        .single();

      if (error) throw error;
      if (!payment.payment_receipt_url) throw new Error('Reçu non disponible');

      // Télécharger le reçu
      const { data: receiptBlob, error: downloadError } = await supabase.storage
        .from('payment-receipts')
        .download(payment.payment_receipt_url);

      if (downloadError) throw downloadError;

      // Créer un URL temporaire pour le téléchargement
      const url = URL.createObjectURL(receiptBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recu-paiement-${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return true;
    }
  });

  return {
    payments,
    isLoading,
    error,
    stats,
    isLoadingStats,
    refetch,
    initiatePayment,
    confirmPayment,
    cancelPayment,
    downloadReceipt
  };
};