import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

serve(async (req) => {
  console.log(`Moyasar webhook received: ${req.method} ${req.url}`);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Verify webhook secret if configured
    const webhookSecret = Deno.env.get('MOYASAR_WEBHOOK_SECRET');
    if (webhookSecret) {
      const receivedSecret = req.headers.get('x-moyasar-signature') || 
                            req.headers.get('authorization') ||
                            req.headers.get('x-webhook-signature');
      
      console.log('Checking webhook secret...');
      if (!receivedSecret || !receivedSecret.includes(webhookSecret)) {
        console.error('Invalid or missing webhook secret');
        return new Response('Unauthorized', { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      console.log('Webhook secret verified');
    }

    const payload = await req.json();
    console.log("Moyasar webhook payload:", JSON.stringify(payload, null, 2));

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing Supabase configuration");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Handle different webhook event types
    if (payload.type) {
      // New webhook format with event types
      const { type, data: paymentData } = payload;
      
      console.log(`Processing webhook event: ${type}`);
      
      if (type === 'payment.paid' || type === 'PAYMENT_PAID') {
        await handlePaymentEvent(supabase, paymentData, 'paid');
      } else if (type === 'payment.failed' || type === 'PAYMENT_FAILED') {
        await handlePaymentEvent(supabase, paymentData, 'failed');
      } else {
        console.log(`Unhandled webhook event type: ${type}`);
      }
    } else {
      // Legacy webhook format - direct payment object
      const paymentId = payload.id;
      const status = payload.status;
      
      if (!paymentId || !status) {
        console.error("Missing payment ID or status in webhook");
        return new Response(
          JSON.stringify({ error: "Invalid webhook payload" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      console.log(`Processing legacy webhook for payment ${paymentId} with status ${status}`);
      await handlePaymentEvent(supabase, payload, status);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Webhook processed successfully"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error processing Moyasar webhook:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        message: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper function to handle payment events
async function handlePaymentEvent(supabase: any, paymentData: any, eventStatus: string) {
  const paymentId = paymentData.id;
  const status = paymentData.status || eventStatus;
  const metadata = paymentData.metadata || {};
  const userId = metadata.user_id;
  const originalAmount = metadata.original_amount;

  if (!paymentId) {
    console.error("Missing payment ID in webhook data");
    return;
  }

  console.log(`Processing payment ${paymentId} with status ${status}`);

  // Find the transaction
  const { data: transaction, error: findError } = await supabase
    .from("transactions_rows")
    .select("*")
    .eq("payment_id", paymentId)
    .single();

  if (findError || !transaction) {
    console.error("Transaction not found for payment ID:", paymentId);
    
    // If transaction not found but payment is successful, try to create it
    if (status === 'paid' && userId && paymentData.amount) {
      console.log("Creating new transaction from webhook data");
      const amount = originalAmount || Math.round(paymentData.amount / 100); // Convert from halalas to SAR
      
      const { data: newTransaction, error: createError } = await supabase
        .from("transactions_rows")
        .insert({
          user_id: userId,
          amount: amount,
          payment_id: paymentId,
          status: 'paid',
          payment_method: 'moyasar',
          research_topic: 'شحن رصيد - webhook',
          currency: 'SAR',
          paid_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error("Failed to create transaction from webhook:", createError);
        return;
      }

      // Process the newly created transaction
      await processSuccessfulPayment(supabase, newTransaction, paymentData);
      return;
    }
    
    throw new Error(`Transaction not found for payment ID: ${paymentId}`);
  }

  // Map Moyasar status to our internal status
  let mappedStatus = "pending";
  switch (status.toLowerCase()) {
    case "paid":
    case "captured":
      mappedStatus = "paid";
      break;
    case "failed":
    case "canceled":
    case "cancelled":
      mappedStatus = "failed";
      break;
    default:
      mappedStatus = "pending";
  }

  // Only update if status has changed
  if (transaction.status !== mappedStatus) {
    console.log(`Updating transaction ${transaction.id} status from ${transaction.status} to ${mappedStatus}`);
    
    const updateData: any = { 
      status: mappedStatus,
      updated_at: new Date().toISOString()
    };
    
    if (mappedStatus === 'paid') {
      updateData.paid_at = new Date().toISOString();
    }
    
    const { error: updateError } = await supabase
      .from("transactions_rows")
      .update(updateData)
      .eq("payment_id", paymentId);

    if (updateError) {
      console.error("Failed to update transaction:", updateError);
      throw new Error(`Failed to update transaction: ${updateError.message}`);
    }
  } else {
    console.log(`Transaction ${transaction.id} already has status ${mappedStatus}, skipping update`);
  }

  // Process successful payments only if not already processed
  if (mappedStatus === "paid" && transaction.status !== "paid") {
    console.log(`Payment successful, processing credits for user ${transaction.user_id}`);
    
    try {
      await processSuccessfulPayment(supabase, transaction, paymentData);
    } catch (creditError) {
      console.error("Error processing credits:", creditError);
      // Don't fail the webhook - transaction was updated successfully
    }
  }
}

// Helper function to process successful payments
async function processSuccessfulPayment(supabase: any, transaction: any, paymentData?: any) {
  const amount = transaction.amount;
  const userId = transaction.user_id;
  
  console.log(`Processing successful payment for user ${userId}, amount: ${amount} SAR`);
  
  // Calculate credits based on pricing plans
  let creditsToAdd: number;
  if (amount === 10) {
    creditsToAdd = 10; // Copper plan
  } else if (amount === 30) {
    creditsToAdd = 40; // Silver plan
  } else if (amount === 50) {
    creditsToAdd = 70; // Gold plan
  } else {
    creditsToAdd = amount; // Default: 1 SAR = 1 credit
  }

  console.log(`Adding ${creditsToAdd} credits for payment of ${amount} SAR to user ${userId}`);

  // Get current balance directly from table
  const { data: currentCreditsData, error: creditFetchError } = await supabase
    .from('user_credits')
    .select('balance')
    .eq('user_id', userId)
    .single();

  if (creditFetchError) {
    console.error("Error fetching current credits:", creditFetchError);
  }

  const currentCredits = currentCreditsData?.balance || 0;
  const newBalance = currentCredits + creditsToAdd;
  
  console.log(`Updating credits from ${currentCredits} to ${newBalance}`);

  // Update user credits directly
  const { error: updateCreditsError } = await supabase
    .from("user_credits")
    .upsert({
      user_id: userId,
      balance: newBalance,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    });

  if (updateCreditsError) {
    console.error("Failed to update user credits:", updateCreditsError);
    throw new Error(`Failed to update user credits: ${updateCreditsError.message}`);
  }

  // Record the credit transaction
  const { error: creditTransactionError } = await supabase
    .from("credit_transactions")
    .insert({
      from_user_id: null,
      to_user_id: userId,
      amount: creditsToAdd,
      type: "payment_credit",
      created_at: new Date().toISOString()
    });

  if (creditTransactionError) {
    console.error("Failed to record credit transaction:", creditTransactionError);
    // Don't throw error - credits were updated successfully
  }

  console.log(`Successfully added ${creditsToAdd} credits to user ${userId}. New balance: ${newBalance}`);
  
  // Return success info for logging
  return {
    creditsAdded: creditsToAdd,
    newBalance: newBalance,
    userId: userId
  };
}