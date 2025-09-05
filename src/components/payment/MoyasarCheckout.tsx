import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import MoyasarPaymentForm from './MoyasarPaymentForm';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { calculateCreditsFromAmount } from '@/lib/moyasar';

interface MoyasarCheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  planTitle: string;
  userId: string;
  onPaymentSuccess?: () => void;
}

const MoyasarCheckout: React.FC<MoyasarCheckoutProps> = ({
  isOpen,
  onClose,
  amount,
  planTitle,
  userId,
  onPaymentSuccess
}) => {
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handlePaymentSuccess = async (paymentId: string) => {
    if (isProcessing) return; // Prevent duplicate processing
    setIsProcessing(true);
    
    console.log('Payment successful in checkout, payment ID:', paymentId);
    console.log('User ID:', userId);
    console.log('Amount:', amount);
    
    try {
      // Calculate credits to add based on amount
      const creditsToAdd = calculateCreditsFromAmount(amount);
      console.log('Credits to add:', creditsToAdd);
      
      // Get current user credits with better error handling
      let currentCredits = 0;
      try {
        console.log('Getting current credits via RPC...');
        const { data: creditsData, error: creditsError } = await supabase
          .rpc('get_user_credits', { user_id_param: userId });
        
        if (!creditsError && creditsData !== null) {
          currentCredits = Number(creditsData);
          console.log('Current credits from RPC:', currentCredits);
        } else {
          console.log('RPC failed, trying direct query...', creditsError);
          
          const { data: directCredits, error: directError } = await supabase
            .from('user_credits')
            .select('balance')
            .eq('user_id', userId)
            .single();
          
          if (!directError && directCredits) {
            currentCredits = Number(directCredits.balance) || 0;
            console.log('Current credits from direct query:', currentCredits);
          } else {
            console.log('Direct query also failed, starting with 0:', directError);
            currentCredits = 0;
          }
        }
      } catch (error) {
        console.error('Error fetching current credits:', error);
        currentCredits = 0;
      }

      const newBalance = currentCredits + creditsToAdd;
      console.log('New balance will be:', newBalance);
      
      // Update user credits with comprehensive logging
      const creditUpdateData = {
        user_id: userId,
        balance: newBalance,
        updated_at: new Date().toISOString()
      };
      
      console.log('Updating credits with data:', creditUpdateData);
      
      const { data: updateResult, error: creditsError } = await supabase
        .from('user_credits')
        .upsert(creditUpdateData, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        })
        .select();

      if (creditsError) {
        console.error('Error updating credits:', creditsError);
        toast({
          title: "تحذير",
          description: "تم الدفع بنجاح ولكن حدث خطأ في إضافة الرصيد. يرجى التواصل مع الدعم",
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }

      console.log('Credits updated successfully:', updateResult);

      // Verify the update worked
      try {
        const { data: verifyBalance } = await supabase
          .from('user_credits')
          .select('balance')
          .eq('user_id', userId)
          .single();
          
        if (verifyBalance) {
          const actualBalance = Number(verifyBalance.balance);
          console.log('Verified balance:', actualBalance);
          
          if (actualBalance !== newBalance) {
            console.warn(`Expected ${newBalance} but got ${actualBalance}`);
          }
        }
      } catch (verifyError) {
        console.warn('Could not verify balance:', verifyError);
      }

      // Record credit transaction for audit
      const creditTransactionData = {
        from_user_id: null,
        to_user_id: userId,
        amount: creditsToAdd,
        type: 'payment_credit',
        created_at: new Date().toISOString()
      };
      
      console.log('Recording credit transaction:', creditTransactionData);
      
      const { error: auditError } = await supabase
        .from('credit_transactions')
        .insert(creditTransactionData);
        
      if (auditError) {
        console.warn('Failed to record credit transaction:', auditError);
      }

      // Create/update payment transaction record using correct table name
      const transactionData = {
        user_id: userId,
        payment_id: paymentId,
        amount: amount,
        status: 'paid',
        payment_method: 'moyasar',
        research_topic: `شحن رصيد - ${planTitle}`,
        plan_title: planTitle,
        currency: 'SAR',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        paid_at: new Date().toISOString()
      };
      
      console.log('Creating/updating transaction:', transactionData);
      
      const { error: transactionError } = await supabase
        .from('transactions_rows') // Using correct table name
        .upsert(transactionData, {
          onConflict: 'payment_id',
          ignoreDuplicates: false
        });

      if (transactionError) {
        console.warn('Failed to record transaction:', transactionError);
      }

      toast({
        title: "تم الدفع بنجاح! 🎉",
        description: `تم إضافة ${creditsToAdd} ريال إلى رصيدك. الرصيد الحالي: ${newBalance}`,
      });

      // Dispatch event to notify other components about credit update
      try {
        const eventDetail = { newBalance, creditsAdded: creditsToAdd };
        window.dispatchEvent(new CustomEvent('creditsUpdated', { detail: eventDetail }));
        document.dispatchEvent(new CustomEvent('creditsUpdated'));
        console.log('Credit update events dispatched');
      } catch (error) {
        console.warn('Failed to dispatch credit update event:', error);
      }
      
      setPaymentCompleted(true);
      onPaymentSuccess?.();
      
      // Close dialog after showing success message
      setTimeout(() => {
        onClose();
        setPaymentCompleted(false);
        setIsProcessing(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error processing payment success:', error);
      toast({
        title: "خطأ في معالجة الدفع",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء معالجة عملية الدفع",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!paymentCompleted && !isProcessing) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader className="text-right">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-bahthali-700">
              إتمام عملية الدفع
            </DialogTitle>
            {!paymentCompleted && !isProcessing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <DialogDescription className="text-right text-gray-600">
            {paymentCompleted ? "تم إتمام عملية الدفع بنجاح" : `أدخل بيانات الدفع لإتمام شراء ${planTitle}`}
          </DialogDescription>
        </DialogHeader>

        {paymentCompleted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-green-800 mb-2">تم الدفع بنجاح!</h3>
            <p className="text-green-600">تم إضافة الرصيد إلى حسابك</p>
            <p className="text-sm text-gray-500 mt-2">سيتم إغلاق هذه النافذة تلقائياً...</p>
          </div>
        ) : (
          <MoyasarPaymentForm
            amount={amount}
            userId={userId}
            planTitle={planTitle}
            onSuccess={handlePaymentSuccess}
            onCancel={handleClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MoyasarCheckout;