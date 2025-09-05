// pages/api/payments/create.ts or app/api/payments/create/route.ts

import { NextApiRequest, NextApiResponse } from 'next';
// Import your existing functions - adjust the import path as needed
import { createMoyasarPayment, sarToHalalas, recordMoyasarTransaction, MOYASAR_CONFIG } from '@/lib/moyasar';

interface PaymentRequestBody {
  amount: number;
  userId: string;
  planTitle: string;
  paymentMethod: 'creditcard' | 'stcpay';
  cardData?: {
    name: string;
    number: string;
    cvc: string;
    month: string;
    year: string;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { amount, userId, planTitle, paymentMethod, cardData }: PaymentRequestBody = req.body;

    // Validate required fields
    if (!amount || !userId || !planTitle || !paymentMethod) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate card data for credit card payments
    if (paymentMethod === 'creditcard') {
      if (!cardData || !cardData.name || !cardData.number || !cardData.cvc || !cardData.month || !cardData.year) {
        return res.status(400).json({ message: 'Missing credit card information' });
      }
    }

    // Record transaction as pending first
    const transaction = await recordMoyasarTransaction(userId, amount, '', 'pending');
    
    // Prepare payment data
    const paymentData = {
      amount: sarToHalalas(amount), // Convert to halalas
      currency: MOYASAR_CONFIG.currency,
      description: `شحن رصيد سرشيفاي - ${planTitle}`,
      callback_url: `${req.headers.origin || process.env.NEXTAUTH_URL}/payment/success`,
      source: paymentMethod === 'creditcard' && cardData ? {
        type: 'creditcard' as const,
        name: cardData.name,
        number: cardData.number.replace(/\s/g, ''),
        cvc: cardData.cvc,
        month: cardData.month,
        year: cardData.year
      } : {
        type: 'stcpay' as const
      },
      metadata: {
        user_id: userId,
        plan_type: planTitle,
        transaction_id: transaction.id
      }
    };

    // Create payment with Moyasar
    const paymentResult = await createMoyasarPayment(paymentData);
    
    // Return the payment result
    res.status(200).json(paymentResult);
    
  } catch (error: any) {
    console.error('Payment creation error:', error);
    
    // Handle specific Moyasar errors
    if (error.response?.data) {
      const moyasarError = error.response.data;
      return res.status(400).json({
        message: moyasarError.message || 'Payment failed',
        errors: moyasarError.errors
      });
    }
    
    // Handle general errors
    res.status(500).json({ 
      message: error.message || 'Internal server error' 
    });
  }
}

// If using App Router (Next.js 13+), use this format instead:
/*
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body: PaymentRequestBody = await request.json();
    const { amount, userId, planTitle, paymentMethod, cardData } = body;

    // ... rest of the logic remains the same

    return NextResponse.json(paymentResult);
  } catch (error: any) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
*/