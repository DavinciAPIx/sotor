import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Loader2, Shield, Lock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MoyasarPaymentFormProps {
  amount: number;
  userId: string;
  planTitle: string;
  onSuccess: (paymentId: string) => void;
  onCancel: () => void;
}

const MoyasarPaymentForm: React.FC<MoyasarPaymentFormProps> = ({
  amount,
  userId,
  planTitle,
  onSuccess,
  onCancel
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'creditcard' | 'stcpay'>('creditcard');
  const [mobileNumber, setMobileNumber] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const { toast } = useToast();

  const validateForm = useCallback(() => {
    const newErrors: {[key: string]: string} = {};
    
    if (paymentMethod === 'stcpay') {
      // Validate mobile number for STC Pay
      if (!mobileNumber.trim()) {
        newErrors.mobile = "يرجى إدخال رقم الجوال";
      } else {
        const cleanMobile = mobileNumber.replace(/\s/g, '');
        // Saudi mobile number validation (05xxxxxxxx or +9665xxxxxxxx)
        if (!/^(05\d{8}|(\+966|966)?5\d{8})$/.test(cleanMobile)) {
          newErrors.mobile = "يرجى إدخال رقم جوال صحيح (05xxxxxxxx)";
        }
      }
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      toast({
        title: "خطأ في البيانات",
        description: firstError,
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  }, [paymentMethod, mobileNumber, toast]);

  const handlePayment = useCallback(async () => {
    if (!validateForm()) return;
    
    setIsProcessing(true);
    
    try {
      console.log('Creating hosted checkout...', { 
        amount, 
        userId, 
        planTitle, 
        paymentMethod,
        timestamp: new Date().toISOString()
      });
      
      // Prepare payload
      const payload = {
        amount,
        userId,
        planTitle,
        paymentMethod,
        returnUrl: window.location.origin
      };

      // Add mobile number for STC Pay (hosted checkout will handle the form)
      if (paymentMethod === 'stcpay') {
        (payload as any).mobileNumber = mobileNumber.replace(/\s/g, '');
      }

      // Create hosted checkout using Supabase Edge Function
      console.log('Calling create-payment function for hosted checkout...');
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: payload
      });

      console.log('Hosted checkout response received:', { 
        hasData: !!data, 
        hasError: !!error,
        dataKeys: data ? Object.keys(data) : [],
        errorMessage: error?.message 
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'فشل في الاتصال بخدمة الدفع');
      }

      if (!data) {
        throw new Error('لم يتم استلام رد من خدمة الدفع');
      }

      console.log('Hosted checkout data:', {
        success: data.success,
        payment_id: data.payment_id,
        status: data.status,
        has_checkout_url: !!data.checkout_url,
        payment_method: data.payment_method
      });

      if (!data.success) {
        const errorMessage = data.error || data.details || 'فشل في إنشاء عملية الدفع';
        throw new Error(errorMessage);
      }

      // All payments now use hosted checkout, so we should always have a checkout_url
      if (data.checkout_url) {
        console.log('Redirecting to hosted checkout:', data.checkout_url);
        
        const methodText = paymentMethod === 'stcpay' ? 'STC Pay' : 'بطاقة ائتمانية';
        toast({
          title: "جاري التحويل",
          description: `سيتم تحويلك إلى صفحة الدفع عبر ${methodText}...`,
        });

        // Redirect after a short delay
        setTimeout(() => {
          window.location.href = data.checkout_url;
        }, 1000);

      } else if (data.payment_id) {
        // Fallback - if no checkout URL but payment created
        console.log('Payment created without checkout URL');
        
        toast({
          title: "تم إنشاء عملية الدفع",
          description: "جاري معالجة الدفع...",
        });

        onSuccess(data.payment_id);

      } else {
        throw new Error('استجابة غير صحيحة من خدمة الدفع');
      }
      
    } catch (error: unknown) {
      console.error('Payment error:', error);
      
      let errorMessage = 'حدث خطأ أثناء معالجة الدفع';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      // Handle specific error messages
      if (errorMessage.includes('Invalid JSON')) {
        errorMessage = 'خطأ في البيانات المرسلة';
      } else if (errorMessage.includes('Payment provider not configured')) {
        errorMessage = 'خدمة الدفع غير متوفرة حالياً. يرجى المحاولة لاحقاً';
      } else if (errorMessage.includes('Method not allowed')) {
        errorMessage = 'طريقة الطلب غير مدعومة';
      } else if (errorMessage.includes('Database configuration error')) {
        errorMessage = 'خطأ في إعدادات الخادم. يرجى المحاولة لاحقاً';
      } else if (errorMessage.includes('Missing required fields')) {
        errorMessage = 'بيانات مطلوبة مفقودة';
      } else if (errorMessage.includes('Invalid mobile number')) {
        errorMessage = 'رقم الجوال غير صحيح';
      }
      
      toast({
        title: "خطأ في الدفع",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [validateForm, amount, userId, planTitle, paymentMethod, mobileNumber, onSuccess, toast]);

  const handlePaymentMethodChange = useCallback((value: 'creditcard' | 'stcpay') => {
    setPaymentMethod(value);
    setErrors({});
    
    // Reset mobile number when switching from STC Pay
    if (value === 'creditcard') {
      setMobileNumber('');
    }
  }, []);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-xl">
          <CreditCard className="h-6 w-6 text-bahthali-600" />
          إتمام الدفع
        </CardTitle>
        <div className="text-center mt-2">
          <p className="text-sm text-gray-600">{planTitle}</p>
          <p className="text-2xl font-bold text-bahthali-700">{amount} ريال</p>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Payment Method Selection */}
        <div className="space-y-2">
          <Label>طريقة الدفع</Label>
          <Select value={paymentMethod} onValueChange={handlePaymentMethodChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="creditcard">بطاقة ائتمانية / مدى</SelectItem>
              <SelectItem value="stcpay">STC Pay</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* STC Pay Mobile Number (only if STC Pay is selected) */}
        {paymentMethod === 'stcpay' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mobileNumber">رقم الجوال</Label>
              <Input
                id="mobileNumber"
                placeholder="05xxxxxxxx"
                value={mobileNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d]/g, ''); // Only numbers
                  if (value.length <= 10) {
                    setMobileNumber(value);
                    if (errors.mobile) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.mobile;
                        return newErrors;
                      });
                    }
                  }
                }}
                maxLength={10}
                dir="ltr"
                disabled={isProcessing}
                className={errors.mobile ? "border-red-500" : ""}
              />
              {errors.mobile && (
                <div className="flex items-center gap-1 text-red-500 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {errors.mobile}
                </div>
              )}
              <p className="text-xs text-gray-500">
                أدخل رقم جوالك المسجل في STC Pay
              </p>
            </div>
          </div>
        )}

        {/* Payment Method Information */}
        {paymentMethod === 'stcpay' ? (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">STC</span>
              </div>
              <span className="font-medium">STC Pay</span>
            </div>
            <p className="text-sm text-gray-600">
              ستتم إعادة توجيهك إلى صفحة STC Pay لإتمام عملية الدفع بشكل آمن
            </p>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <span className="font-medium">بطاقة ائتمانية / مدى</span>
            </div>
            <p className="text-sm text-gray-600">
              ستتم إعادة توجيهك إلى صفحة دفع آمنة لإدخال بيانات البطاقة
            </p>
          </div>
        )}

        {/* Security Notice */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-green-700">
            <Shield className="h-4 w-4" />
            <span className="text-sm font-medium">دفع آمن ومحمي</span>
          </div>
          <p className="text-xs text-green-600 mt-1">
            جميع المعاملات محمية بتشفير SSL ومعايير الأمان العالمية من خلال منصة مويسر
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1"
          >
            إلغاء
          </Button>
          
          <Button
            onClick={handlePayment}
            disabled={isProcessing}
            className="flex-1 bg-bahthali-500 hover:bg-bahthali-600"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                جاري المعالجة...
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                {paymentMethod === 'stcpay' ? 'الدفع عبر STC Pay' : `دفع ${amount} ريال`}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MoyasarPaymentForm;