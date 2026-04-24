import Stripe from "https://esm.sh/stripe@14?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
});

const PRICE_CHECK_ONE = "price_1TPZ1R5qsBg0AcZixMsKmFHj";
const PRICE_UNLIMITED = "price_1TPZ0v5qsBg0AcZidQXejKgY";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { plan, quantity, userId, userEmail, successUrl, cancelUrl } = await req.json();

    if (plan === "check_one") {
      // One-time payment — quantity drives how many contracts they're buying
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price: PRICE_CHECK_ONE,
            quantity: quantity ?? 1,
          },
        ],
        metadata: {
          user_id: userId,
          plan: "check_one",
          quantity: String(quantity ?? 1),
        },
        customer_email: userEmail,
        success_url: successUrl ?? `${req.headers.get("origin")}/upload?payment=success`,
        cancel_url: cancelUrl ?? `${req.headers.get("origin")}/pricing`,
      });

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (plan === "unlimited") {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: PRICE_UNLIMITED,
            quantity: 1,
          },
        ],
        metadata: {
          user_id: userId,
          plan: "unlimited",
        },
        customer_email: userEmail,
        success_url: successUrl ?? `${req.headers.get("origin")}/upload?payment=success`,
        cancel_url: cancelUrl ?? `${req.headers.get("origin")}/pricing`,
      });

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid plan" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
