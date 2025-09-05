// lib/moyasar.ts
import { createClient } from '@supabase/supabase-js';

// Get environment variables safely for browser environment
const getEnvVar = (name: string, fallback = ''): string => {
  if (typeof window !== 'undefined') {
    // In browser, these should be set at build time or passed from a parent component
    return (window as any)[name] || fallback;
  }
  // On server side (if using SSR)
  return process?.env?.[name] || fallback;
};

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');

// Create supabase client only if we have the required environment variables
const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const MOYASAR_CONFIG = {
  currency: 'SAR',
  apiUrl: 'https://api.moyasar.com/v1',
};

// Convert SAR to Halalas (Moyasar uses smallest currency unit)
export const sarToHalalas = (amount: number): number => {
  return Math.round(amount * 100);
};

// Convert Halalas to SAR
export const halalasToSar = (amount: number): number => {
  return amount / 100;
};

// Calculate credits from payment amount (1 SAR = 1 Credit)
export const calculateCreditsFromAmount = (amount: number): number => {
  return Math.round(amount); // 1 SAR = 1 Credit, adjust this logic as needed
};

// Record transaction in your existing transactions_rows table
export async function recordMoyasarTransaction(
  userId: string,
  amount: number,
  paymentId: string = '',
  status: 'pending' | 'paid' | 'failed' = 'pending',
  paymentMethod: 'creditcard' | 'stcpay' = 'creditcard',
  description?: string,
  planTitle?: string
) {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Check environment variables.');
  }

  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        amount: amount,
        payment_id: paymentId,
        status: status,
        payment_method: paymentMethod,
        research_topic: description || planTitle || 'شحن رصيد'
      })
      .select()
      .single();

    if (error) {
      console.error('Error recording transaction:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in recordMoyasarTransaction:', error);
    throw error;
  }
}

// Update transaction status
export async function updateTransactionStatus(
  transactionId: string,
  status: 'pending' | 'paid' | 'failed',
  paymentId?: string
) {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Check environment variables.');
  }

  try {
    const { data, error } = await supabase
      .from('transactions')
      .update({ 
        status: status,
        payment_id: paymentId,
        updated_at: new Date().toISOString()
      })
      .eq('id', transactionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating transaction status:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateTransactionStatus:', error);
    throw error;
  }
}

// Create payment with Moyasar API (server-side only)
export async function createMoyasarPayment(paymentData: any) {
  try {
    // This function should only be called from server-side code (API routes)
    if (typeof window !== 'undefined') {
      throw new Error('This function should not be called from the browser. Use the API route instead.');
    }

    const moyasarSecretKey = process.env.MOYASAR_SECRET_KEY;
    if (!moyasarSecretKey) {
      throw new Error('MOYASAR_SECRET_KEY environment variable is not set');
    }

    // Create base64 encoded authorization header
    const authString = Buffer.from(moyasarSecretKey + ':').toString('base64');

    const response = await fetch(`${MOYASAR_CONFIG.apiUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`,
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Payment creation failed');
    }

    const paymentResult = await response.json();
    return paymentResult;
  } catch (error) {
    console.error('Error creating Moyasar payment:', error);
    throw error;
  }
}

// Client-side function to create payment through API route
export async function createPaymentThroughAPI(paymentData: {
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
}) {
  try {
    const response = await fetch('/api/payments/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Payment creation failed');
    }

    const paymentResult = await response.json();
    return paymentResult;
  } catch (error) {
    console.error('Error creating payment through API:', error);
    throw error;
  }
}

// Get transaction by ID
export async function getTransaction(transactionId: string) {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Check environment variables.');
  }

  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting transaction:', error);
    throw error;
  }
}

// Get user's transaction history
export async function getUserTransactions(userId: string, limit: number = 10) {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Check environment variables.');
  }

  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting user transactions:', error);
    throw error;
  }
}

// Get user credits/balance
export async function getUserCredits(userId: string) {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Check environment variables.');
  }

  try {
    const { data, error } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw error;
    }

    return data || { balance: 0, total_spent: 0, total_credited: 0 };
  } catch (error) {
    console.error('Error getting user credits:', error);
    throw error;
  }
}

// Webhook handler for Moyasar callbacks
export async function handlePaymentWebhook(webhookData: any) {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Check environment variables.');
  }

  try {
    const { type, data: paymentData } = webhookData;
    
    if (type === 'payment_paid') {
      // Find transaction by payment_id
      const { data: transaction, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('payment_id', paymentData.id)
        .single();

      if (error || !transaction) {
        console.error('Transaction not found for payment ID:', paymentData.id);
        return false;
      }

      // Update transaction status
      await updateTransactionStatus(transaction.id, 'paid', paymentData.id);
      return true;
    }

    if (type === 'payment_failed') {
      const { data: transaction, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('payment_id', paymentData.id)
        .single();

      if (error || !transaction) {
        console.error('Transaction not found for payment ID:', paymentData.id);
        return false;
      }

      await updateTransactionStatus(transaction.id, 'failed', paymentData.id);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error handling payment webhook:', error);
    throw error;
  }
}