import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const MOYASAR_SECRET_KEY = Deno.env.get("MOYASAR_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

serve(async (req) => {
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
    const { amount, userId, planTitle, paymentMethod = 'creditcard' } = await req.json();

    console.log("Creating Moyasar payment:", { amount, userId, planTitle, paymentMethod });

    if (!amount || !userId || !planTitle) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!MOYASAR_SECRET_KEY) {
      console.error("MOYASAR_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Payment provider not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Convert SAR to halalas (Moyasar uses halalas)
    const amountInHalalas = Math.round(amount * 100);

    // Create payment with Moyasar
    const paymentData = {
      amount: amountInHalalas,
      currency: "SAR",
      description: `شحن رصيد سرشيفاي - ${planTitle}`,
      callback_url: `${new URL(req.url).origin}/payment/success`,
      metadata: {
        user_id: userId,
        plan_title: planTitle,
        original_amount: amount
      }
    };

    console.log("Sending payment data to Moyasar:", paymentData);

    const moyasarResponse = await fetch("https://api.moyasar.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(MOYASAR_SECRET_KEY + ":")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentData),
    });

    const moyasarResult = await moyasarResponse.json();
    console.log("Moyasar response:", moyasarResult);

    if (!moyasarResponse.ok) {
      console.error("Moyasar API error:", moyasarResult);
      return new Response(
        JSON.stringify({ 
          error: "Payment creation failed", 
          details: moyasarResult.message || "Unknown error"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Record transaction in database
    const { data: transaction, error: dbError } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        amount: amount,
        status: "pending",
        payment_id: moyasarResult.id,
        payment_method: "moyasar_payment",
        research_topic: "شحن رصيد",
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error("Error recording transaction:", dbError);
      // Continue anyway - payment was created successfully
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: moyasarResult.id,
        status: moyasarResult.status,
        checkout_url: moyasarResult.source?.transaction_url || null,
        transaction_id: transaction?.id || null
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error creating Moyasar payment:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        message: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});