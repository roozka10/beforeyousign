import { supabase } from "./supabase";

export type Plan = "check_one" | "unlimited";

export async function createCheckoutSession(plan: Plan, quantity = 1) {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  const userEmail = session?.user?.email;
  const origin = window.location.origin;

  const { data, error } = await supabase.functions.invoke("create-checkout-session", {
    body: {
      plan,
      quantity,
      userId,
      userEmail,
      successUrl: `${origin}/upload?payment=success`,
      cancelUrl: `${origin}/pricing?payment=cancelled`,
    },
  });

  if (error) throw new Error(error.message);
  const checkoutUrl: string | undefined =
    data?.url ?? data?.checkoutUrl ?? data?.checkout_url;

  if (!checkoutUrl) throw new Error("No checkout URL returned");

  // Safety check: never redirect users to local app routes from checkout creation.
  if (!checkoutUrl.includes("checkout.stripe.com")) {
    throw new Error("Invalid checkout URL returned");
  }

  // Redirect to Stripe Checkout
  window.location.assign(checkoutUrl);
}

export async function getUserCredits() {
  const { data, error } = await supabase
    .from("user_credits")
    .select("credits, plan, plan_started_at")
    .single();

  if (error) {
    return { credits: 0, plan: "pay_per_use" as const, plan_started_at: null as string | null };
  }

  return data as {
    credits: number;
    plan: "pay_per_use" | "unlimited";
    plan_started_at: string | null;
  };
}

export async function deductCredit(userId: string) {
  await supabase.rpc("deduct_credit", { p_user_id: userId });
}
