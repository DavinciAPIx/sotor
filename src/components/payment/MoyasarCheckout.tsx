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
      // Use the new RPC function to process payment
      console.log('Processing payment via RPC function...');
      const { data: processResult, error: processError } = await supabase
        .rpc('process_moyasar_payment', {
          payment_id_param: paymentId,
          user_id_param: userId,
          amount_param: amount
        });
      
      console.log('Payment processing result:', processResult);
      
      if (processError) {
        console.error('Error processing payment:', processError);
        toast({
          title: "خطأ في معالجة الدفع",
          description: "تم الدفع بنجاح ولكن حدث خطأ في إضافة الرصيد. يرجى التواصل مع الدعم",
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }
      
      if (!processResult || processResult.status !== 'success') {
        const errorMessage = processResult?.message || 'فشل في معالجة الدفع';
        console.error('Payment processing failed:', errorMessage);
        toast({
          title: "خطأ في معالجة الدفع",
          description: errorMessage,
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }
      
      const creditsAdded = processResult.credits_added || 0;
      const newBalance = processResult.new_balance || 0;

      toast({
        title: "تم الدفع بنجاح! 🎉",
        description: `تم إضافة ${creditsAdded} ريال إلى رصيدك. الرصيد الحالي: ${newBalance}`,
      });

      // Dispatch event to notify other components about credit update
      try {
        const eventDetail = { newBalance, creditsAdded };
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