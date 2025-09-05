import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, HomeIcon, Loader2 } from 'lucide-react';
import { AuthContext } from '@/App';
import { useToast } from '@/hooks/use-toast';
import { validatePaymentAndAddCredits } from '@/lib/creditSystem';

const PaymentSuccess = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'failure'>('loading');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [creditsAdded, setCreditsAdded] = useState<number>(0);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  // Debug logging function
  const addDebugLog = (message: string) => {
    console.log(message);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };
  
  useEffect(() => {
    const processPayment = async () => {
      addDebugLog("🚀 Starting payment processing...");
      
      // Get payment details from URL
      const paymentId = searchParams.get('id') || searchParams.get('payment_id');
      const urlAmount = searchParams.get('amount');
      
      addDebugLog(`📄 Payment ID: ${paymentId}`);
      addDebugLog(`💰 URL Amount: ${urlAmount}`);
      
      // Validation checks
      if (!paymentId) {
        addDebugLog("❌ ERROR: No payment_id found in URL");
        setStatus('failure');
        toast({
          title: "خطأ في التحقق من حالة الدفع",
          description: "لم يتم العثور على معلومات الدفع",
          variant: "destructive",
        });
        return;
      }

      if (!user?.id) {
        addDebugLog("❌ ERROR: User not authenticated or missing user.id");
        setStatus('failure');
        toast({
          title: "خطأ في المصادقة",
          description: "المستخدم غير مصرح له",
          variant: "destructive",
        });
        return;
      }
      
      addDebugLog(`👤 User ID: ${user.id}`);
      
      try {
        // Use the centralized credit system
        const amount = parseInt(urlAmount || '10');
        addDebugLog(`🔄 Processing payment with amount: ${amount} SAR`);
        
        const result = await validatePaymentAndAddCredits(user.id, paymentId, amount);
        
        addDebugLog(`📊 Credit processing result: ${JSON.stringify(result)}`);
        
        if (result.success) {
          addDebugLog(`✅ SUCCESS: Credits processed successfully`);
          addDebugLog(`💳 Credits added: ${result.creditsAdded}`);
          addDebugLog(`💰 New balance: ${result.newBalance}`);
          
          setCreditsAdded(result.creditsAdded);
          setTransactionId(paymentId); // Use payment ID as transaction reference
          setStatus('success');
          
          // Show success toast only if credits were actually added
          if (result.creditsAdded > 0) {
            toast({
              title: "تم إضافة الرصيد بنجاح! 🎉",
              description: `تم إضافة ${result.creditsAdded} رصيد لحسابك. الرصيد الحالي: ${result.newBalance}`,
            });
          } else if (result.error === 'Payment already processed') {
            toast({
              title: "تم معالجة الدفع مسبقاً",
              description: `الرصيد الحالي: ${result.newBalance}`,
            });
          }
          
        } else {
          addDebugLog(`❌ FAILURE: ${result.error}`);
          throw new Error(result.error || "Failed to process payment");
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        addDebugLog(`💥 Payment processing error: ${errorMessage}`);
        console.error('Error processing payment:', error);
        setStatus('failure');
        toast({
          title: "فشل في معالجة الدفع",
          description: errorMessage,
          variant: "destructive",
        });
      }
    };
    
    if (user?.id) {
      processPayment();
    } else {
      addDebugLog("⏳ User not ready, waiting...");
    }
  }, [toast, searchParams, user]);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {status === 'loading' ? 'جاري التحقق من الدفع...' : 
               status === 'success' ? 'تمت عملية الدفع بنجاح!' : 
               'فشلت عملية الدفع'}
            </CardTitle>
            <CardDescription>
              {status === 'loading' ? 'يرجى الانتظار بينما نتحقق من حالة معاملتك' : 
               status === 'success' ? (creditsAdded > 0 ? `تم إضافة ${creditsAdded} رصيد إلى حسابك` : 'تم التحقق من حالة الدفع') : 
               'لم نتمكن من تأكيد عملية الدفع الخاصة بك'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex flex-col items-center space-y-6 pt-6">
            {status === 'loading' ? (
              <Loader2 className="h-16 w-16 text-bahthali-500 animate-spin" />
            ) : status === 'success' ? (
              <CheckCircle className="h-16 w-16 text-green-500" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500" />
            )}
            
            <div className="text-center space-y-2">
              {status === 'loading' ? (
                <p>يرجى عدم إغلاق هذه الصفحة أثناء التحقق من المعاملة...</p>
              ) : status === 'success' ? (
                <>
                  <p className="text-green-600 font-medium">شكرًا لك! تمت معالجة الدفع بنجاح.</p>
                  {creditsAdded > 0 && (
                    <p className="text-lg font-bold text-bahthali-600">
                      تم إضافة {creditsAdded} رصيد لحسابك!
                    </p>
                  )}
                  <p>يمكنك الآن العودة إلى حسابك واستخدام رصيدك لإجراء الأبحاث.</p>
                  {transactionId && (
                    <p className="text-sm text-gray-500 mt-2">
                      رقم المعاملة: <span className="font-mono">{transactionId}</span>
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-red-600 font-medium">عذراً، لم نتمكن من تأكيد عملية الدفع الخاصة بك.</p>
                  <p>يرجى التحقق من معلومات بطاقتك والمحاولة مرة أخرى أو الاتصال بالدعم إذا استمرت المشكلة.</p>
                </>
              )}
            </div>
            
            {/* Debug info section - remove in production */}
            {process.env.NODE_ENV === 'development' && debugInfo.length > 0 && (
              <details className="w-full mt-4">
                <summary className="text-sm text-gray-500 cursor-pointer">معلومات التشخيص (للمطورين)</summary>
                <div className="mt-2 p-2 bg-gray-100 rounded text-xs max-h-40 overflow-y-auto">
                  {debugInfo.map((info, index) => (
                    <div key={index} className="mb-1 font-mono">{info}</div>
                  ))}
                </div>
              </details>
            )}
            
            <div className="flex space-x-2 rtl:space-x-reverse pt-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/profile')}
                disabled={status === 'loading'}
              >
                الذهاب إلى الملف الشخصي
              </Button>
              
              <Button 
                onClick={() => navigate('/')}
                disabled={status === 'loading'}
                className="bg-bahthali-500 hover:bg-bahthali-600"
              >
                <HomeIcon className="mr-1 h-4 w-4" />
                العودة للرئيسية
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default PaymentSuccess;