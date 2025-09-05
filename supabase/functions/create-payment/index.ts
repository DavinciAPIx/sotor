import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const MOYASAR_SECRET_KEY = Deno.env.get("MOYASAR_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
  "Content-Type": "application/json",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const { amount, userId, planTitle, paymentMethod = 'creditcard', cardData, returnUrl } = requestBody;

    console.log("Creating Moyasar payment:", { 
      amount, 
      userId, 
      planTitle, 
      paymentMethod, 
      hasCardData: !!cardData,
      returnUrl 
    });

    // Validate required fields
    if (!amount || !userId || !planTitle) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required fields", 
          details: "amount, userId, and planTitle are required" 
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid amount", 
          details: "Amount must be a positive number" 
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Check environment variables
    if (!MOYASAR_SECRET_KEY) {
      console.error("MOYASAR_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Payment provider not configured" }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Supabase configuration missing");
      return new Response(
        JSON.stringify({ error: "Database configuration error" }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Convert SAR to halalas (Moyasar uses halalas - 1 SAR = 100 halalas)
    const amountInHalalas = Math.round(amount * 100);

    // Prepare payment data based on payment method
    let paymentData: any = {
      amount: amountInHalalas,
      currency: "SAR",
      description: `شحن رصيد سرشيفاي - ${planTitle}`,
      callback_url: returnUrl ? `${returnUrl}/payment/callback` : undefined,
      metadata: {
        user_id: userId,
        plan_title: planTitle,
        original_amount: amount
      }
    };

    // Add payment method specific data
    if (paymentMethod === 'creditcard' && cardData) {
      // For credit card payments, add source data
      paymentData.source = {
        type: 'creditcard',
        name: cardData.name,
        number: cardData.number.replace(/\s/g, ''), // Remove spaces
        cvc: cardData.cvc,
        month: cardData.month,
        year: cardData.year
      };
    } else if (paymentMethod === 'stcpay') {
      // For STC Pay, set the source type
      paymentData.source = {
        type: 'stcpay'
      };
    }

    console.log("Sending payment data to Moyasar:", {
      ...paymentData,
      source: paymentData.source ? { 
        ...paymentData.source, 
        number: paymentData.source.number ? '****' + paymentData.source.number.slice(-4) : undefined,
        cvc: '***'
      } : undefined
    });

    // Create payment with Moyasar
    const moyasarResponse = await fetch("https://api.moyasar.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(MOYASAR_SECRET_KEY + ":")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentData),
    });

    let moyasarResult;
    try {
      moyasarResult = await moyasarResponse.json();
    } catch (parseError) {
      console.error("Failed to parse Moyasar response:", parseError);
      return new Response(
        JSON.stringify({ 
          error: "Invalid response from payment provider",
          details: "Failed to parse payment provider response"
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    console.log("Moyasar response status:", moyasarResponse.status);
    console.log("Moyasar response:", moyasarResult);

    if (!moyasarResponse.ok) {
      console.error("Moyasar API error:", moyasarResult);
      
      // Extract error message from Moyasar response
      let errorMessage = "Payment creation failed";
      if (moyasarResult.message) {
        errorMessage = moyasarResult.message;
      } else if (moyasarResult.errors && Array.isArray(moyasarResult.errors)) {
        errorMessage = moyasarResult.errors.join(", ");
      } else if (typeof moyasarResult === 'string') {
        errorMessage = moyasarResult;
      }

      return new Response(
        JSON.stringify({ 
          error: "Payment creation failed", 
          details: errorMessage,
          moyasar_error: moyasarResult
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Record transaction in database
    let transaction = null;
    try {
      const { data: transactionData, error: dbError } = await supabase
        .from("transactions_rows")
        .insert({
          user_id: userId,
          amount: amount,
          status: moyasarResult.status || "pending",
          payment_id: moyasarResult.id,
          payment_method: "moyasar",
          research_topic: `شحن رصيد - ${planTitle}`,
          plan_title: planTitle,
          currency: "SAR",
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (dbError) {
        console.error("Error recording transaction:", dbError);
        // Continue anyway - payment was created successfully with Moyasar
      } else {
        transaction = transactionData;
        console.log("Transaction recorded:", transaction);
      }
    } catch (dbError) {
      console.error("Database error:", dbError);
      // Continue anyway - payment was created successfully with Moyasar
    }

    // Prepare response
    const response: any = {
      success: true,
      payment_id: moyasarResult.id,
      status: moyasarResult.status,
      transaction_id: transaction?.id || null
    };

    // Check if payment needs redirect (STC Pay or 3D Secure)
    if (moyasarResult.source?.transaction_url) {
      response.checkout_url = moyasarResult.source.transaction_url;
    } else if (moyasarResult.redirect_url) {
      response.checkout_url = moyasarResult.redirect_url;
    } else if (moyasarResult.source?.gateway_url) {
      response.checkout_url = moyasarResult.source.gateway_url;
    }

    // Check if payment was completed immediately
    if (moyasarResult.status === 'paid') {
      response.payment_completed = true;
      
      // Process the payment immediately if it's already paid
      try {
        const processResult = await supabase.rpc('process_moyasar_payment', {
          payment_id_param: moyasarResult.id,
          user_id_param: userId,
          amount_param: amount
        });
        
        console.log("Immediate payment processing result:", processResult);
        response.credits_processed = processResult;
      } catch (processError) {
        console.error("Error processing immediate payment:", processError);
      }
    }

    console.log("Sending response:", response);

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error("Unexpected error creating Moyasar payment:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        message: error instanceof Error ? error.message : "Unknown error",
        details: "An unexpected error occurred while processing your payment"
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});