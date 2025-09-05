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
    
    // Try RPC function first
    const { data: rpcBalance, error: rpcError } = await supabase
      .rpc('get_user_credits', { user_id_param: userId });
    
    if (!rpcError && rpcBalance !== null) {
      const balance = Number(rpcBalance);
      console.log(`Got current balance from RPC: ${balance}`);
      return balance;
    }
    
    console.log(`RPC failed: ${JSON.stringify(rpcError)}, trying direct query...`);
    
    // Fallback to direct query
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
    
    // Update user credits using upsert
    const creditUpdateData = { 
      user_id: userId, 
      balance: newBalance,
      updated_at: new Date().toISOString()
    };
    
    console.log(`Credit update data: ${JSON.stringify(creditUpdateData)}`);
    
    const { data: updateResult, error: updateCreditError } = await supabase
      .from('user_credits')
      .upsert(creditUpdateData, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })
      .select();
    
    if (updateCreditError) {
      console.error("Failed to update user credits:", updateCreditError);
      return {
        success: false,
        creditsAdded: 0,
        newBalance: currentBalance,
        error: `Credit update failed: ${updateCreditError.message}`
      };
    }
    
    console.log(`Credit update successful: ${JSON.stringify(updateResult)}`);
    
    // Verify the update worked by querying the balance again
    const verifiedBalance = await getCurrentUserCredits(userId);
    console.log(`Verified new balance: ${verifiedBalance}`);
    
    if (verifiedBalance !== newBalance) {
      console.warn(`Expected balance ${newBalance} but got ${verifiedBalance}`);
    }
    
    // Record the credit transaction for audit trail
    const creditTransactionData = {
      from_user_id: null, // null for payment credits
      to_user_id: userId,
      amount: creditsToAdd,
      type: 'payment_credit',
      created_at: new Date().toISOString()
    };
    
    console.log(`Recording credit transaction: ${JSON.stringify(creditTransactionData)}`);
    
    const { error: creditTransactionError } = await supabase
      .from('credit_transactions')
      .insert(creditTransactionData);
    
    if (creditTransactionError) {
      console.warn("Failed to record credit transaction:", creditTransactionError);
      // Don't fail the whole process for audit trail issues
    } else {
      console.log("Credit transaction recorded successfully");
    }
    
    // Create or update payment transaction record if paymentId is provided
    if (paymentId) {
      const transactionData = {
        user_id: userId,
        payment_id: paymentId,
        amount: amount,
        status: 'paid',
        payment_method: 'moyasar',
        research_topic: 'شحن رصيد',
        currency: 'SAR',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        paid_at: new Date().toISOString()
      };
      
      console.log(`Recording payment transaction: ${JSON.stringify(transactionData)}`);
      
      const { error: transactionError } = await supabase
        .from('transactions_rows')
        .upsert(transactionData, {
          onConflict: 'payment_id',
          ignoreDuplicates: false
        });
      
      if (transactionError) {
        console.warn("Failed to record payment transaction:", transactionError);
      } else {
        console.log("Payment transaction recorded successfully");
      }
    }
    
    // Dispatch events to update UI components
    try {
      const eventDetail = { newBalance: verifiedBalance, creditsAdded: creditsToAdd };
      window.dispatchEvent(new CustomEvent('creditsUpdated', { detail: eventDetail }));
      document.dispatchEvent(new CustomEvent('creditsUpdated'));
      console.log("UI update events dispatched successfully");
    } catch (eventError) {
      console.warn("Failed to dispatch events:", eventError);
    }
    
    console.log(`Credit addition completed successfully. Added: ${creditsToAdd}, New balance: ${verifiedBalance}`);
    return { 
      success: true, 
      creditsAdded: creditsToAdd, 
      newBalance: verifiedBalance 
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
    
    // Check if we already processed this payment
    const { data: existingTransaction, error: fetchError } = await supabase
      .from('transactions_rows')
      .select('*')
      .eq('payment_id', paymentId)
      .eq('status', 'paid')
      .single();
    
    if (!fetchError && existingTransaction) {
      console.log('Payment already processed:', existingTransaction);
      
      // Check if credits were already added by looking at current balance
      const currentBalance = await getCurrentUserCredits(userId);
      return {
        success: true,
        creditsAdded: 0, // Already processed
        newBalance: currentBalance,
        error: 'Payment already processed'
      };
    }
    
    // Determine amount (default to 10 if not provided)
    const paymentAmount = amount || 10;
    
    // Add credits
    const result = await addCreditsToUser(userId, paymentAmount, paymentId);
    
    return result;
    
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