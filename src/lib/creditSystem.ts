// /lib/creditSystem.ts
import { supabase } from '@/integrations/supabase/client';

export interface CreditResult {
  success: boolean;
  creditsAdded: number;
  newBalance: number;
  error?: string;
}

export const calculateCreditsFromAmount = (amount: number): number => {
  // CREDIT CALCULATION: 10 SAR = 10 credits, 30 SAR = 40 credits, 50 SAR = 70 credits
  if (amount === 10) {
    return 10; // Copper plan: 1 research
  } else if (amount === 30) {
    return 40; // Silver plan: 4 researches + 1 bonus
  } else if (amount === 50) {
    return 70; // Gold plan: 7 researches + 2 bonus
  } else {
    // Default calculation: 1 credit per 1 SAR for other amounts
    return amount;
  }
};

export const getCurrentUserCredits = async (userId: string): Promise<number> => {
  try {
    console.log(`Getting current credits for user: ${userId}`);
    
    // Use direct query to user_credits table
    const { data: directBalance, error: directError } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', userId)
      .single();
    
    if (!directError && directBalance) {
      const balance = Number(directBalance.balance) || 0;
      console.log(`Got current balance from direct query: ${balance}`);
      return balance;
    }
    
    console.log(`Direct query failed: ${JSON.stringify(directError)}, returning 0`);
    return 0;
    
  } catch (error) {
    console.error('Error fetching current credits:', error);
    return 0;
  }
};

export const addCreditsToUser = async (userId: string, amount: number, paymentId?: string): Promise<CreditResult> => {
  try {
    console.log(`Starting credit addition for user ${userId} with amount: ${amount}`);
    
    const creditsToAdd = calculateCreditsFromAmount(amount);
    console.log(`Calculated credits to add: ${creditsToAdd}`);
    
    // Get current balance
    const currentBalance = await getCurrentUserCredits(userId);
    const newBalance = currentBalance + creditsToAdd;
    
    console.log(`Updating user credits from ${currentBalance} to ${newBalance}`);
    
    // Use the new RPC function to process payment
    const { data: result, error: rpcError } = await supabase
      .rpc('process_moyasar_payment', {
        payment_id_param: paymentId || `manual_${Date.now()}`,
        user_id_param: userId,
        amount_param: amount
      });
    
    if (rpcError) {
      console.error("RPC error:", rpcError);
      return {
        success: false,
        creditsAdded: 0,
        newBalance: currentBalance,
        error: `Payment processing failed: ${rpcError.message}`
      };
    }
    
    if (!result || result.status !== 'success') {
      const errorMessage = result?.message || 'Payment processing failed';
      console.error("Payment processing failed:", errorMessage);
      return {
        success: false,
        creditsAdded: 0,
        newBalance: currentBalance,
        error: errorMessage
      };
    }
    
    // Dispatch events to update UI components
    try {
      const eventDetail = { newBalance: result.new_balance, creditsAdded: result.credits_added };
      window.dispatchEvent(new CustomEvent('creditsUpdated', { detail: eventDetail }));
      document.dispatchEvent(new CustomEvent('creditsUpdated'));
      console.log("UI update events dispatched successfully");
    } catch (eventError) {
      console.warn("Failed to dispatch events:", eventError);
    }
    
    console.log(`Credit addition completed successfully. Added: ${result.credits_added}, New balance: ${result.new_balance}`);
    return { 
      success: true, 
      creditsAdded: result.credits_added, 
      newBalance: result.new_balance 
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error adding credits:", error);
    return {
      success: false,
      creditsAdded: 0,
      newBalance: 0,
      error: errorMessage
    };
  }
};

export const validatePaymentAndAddCredits = async (
  userId: string, 
  paymentId: string, 
  amount?: number
): Promise<CreditResult> => {
  try {
    console.log(`Validating payment and adding credits for user: ${userId}, payment: ${paymentId}`);
    
    if (!userId || !paymentId) {
      throw new Error('Missing required parameters: userId or paymentId');
    }
    
    // Determine amount (default to 10 if not provided)
    const paymentAmount = amount || 10;
    
    // Use the RPC function to process payment
    const { data: result, error: rpcError } = await supabase
      .rpc('process_moyasar_payment', {
        payment_id_param: paymentId,
        user_id_param: userId,
        amount_param: paymentAmount
      });
    
    if (rpcError) {
      console.error("RPC error:", rpcError);
      return {
        success: false,
        creditsAdded: 0,
        newBalance: 0,
        error: rpcError.message
      };
    }
    
    if (!result) {
      return {
        success: false,
        creditsAdded: 0,
        newBalance: 0,
        error: 'No result from payment processing'
      };
    }
    
    // Handle different result statuses
    if (result.status === 'already_processed') {
      const currentBalance = await getCurrentUserCredits(userId);
      return {
        success: true,
        creditsAdded: 0,
        newBalance: currentBalance,
        error: 'Payment already processed'
      };
    }
    
    if (result.status !== 'success') {
      return {
        success: false,
        creditsAdded: 0,
        newBalance: 0,
        error: result.message || 'Payment processing failed'
      };
    }
    
    return {
      success: true,
      creditsAdded: result.credits_added || 0,
      newBalance: result.new_balance || 0
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error validating payment and adding credits:", error);
    return {
      success: false,
      creditsAdded: 0,
      newBalance: 0,
      error: errorMessage
    };
  }
};