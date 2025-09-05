import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, HomeIcon, RefreshCw } from 'lucide-react';

const PaymentFailure = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get error details from URL if available
  const errorMessage = searchParams.get('error') || searchParams.get('message');
  const paymentId = searchParams.get('id') || searchParams.get('payment_id');
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-red-600">
              فشلت عملية الدفع
            </CardTitle>
            <CardDescription>
              لم نتمكن من معالجة عملية الدفع الخاصة بك
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex flex-col items-center space-y-6 pt-6">
            <XCircle className="h-16 w-16 text-red-500" />
            
            <div className="text-center space-y-2">
              <p className="text-red-600 font-medium">
                عذراً، لم نتمكن من إكمال عملية الدفع الخاصة بك.
              </p>
              {errorMessage && (
                <p className="text-sm text-red-500 bg-red-50 p-2 rounded">
                  {errorMessage}
                </p>
              )}
              {paymentId && (
                <p className="text-sm text-gray-500 mt-2">
                  رقم المعاملة: <span className="font-mono">{paymentId}</span>
                </p>
              )}
              <p>قد يكون هناك مشكلة في بطاقتك أو في معلومات الدفع. يرجى المحاولة مرة أخرى.</p>
            </div>
            
            <div className="flex space-x-2 rtl:space-x-reverse pt-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/profile')}
              >
                <RefreshCw className="mr-1 h-4 w-4" />
                محاولة مرة أخرى
              </Button>
              
              <Button 
                onClick={() => navigate('/')}
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

export default PaymentFailure;