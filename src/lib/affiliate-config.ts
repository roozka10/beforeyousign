export type AffiliateNetwork = {
  id: string;
  name: string;
  signupUrl: string;
  dashboardUrl: string;
  payoutMethods: string;
  notes: string;
};

export type AffiliateProgram = {
  id: string;
  name: string;
  description: string;
  cta: string;
  tag: string;
  defaultUrl: string;
  envUrlKey?: string;
  commission: string;
  networkId: string;
  signupUrl: string;
  dashboardUrl: string;
};

export type RevenueSource = {
  id: string;
  name: string;
  type: "ads" | "affiliate" | "auto";
  signupUrl: string;
  dashboardUrl: string;
  payoutMethods: string;
  howMuch: string;
  status: "live" | "signup-required";
};

export const affiliateNetworks: AffiliateNetwork[] = [
  {
    id: "adsense",
    name: "Google AdSense",
    signupUrl: "https://www.google.com/adsense/start/",
    dashboardUrl: "https://adsense.google.com/",
    payoutMethods: "Direct deposit, wire, check (threshold ~$100)",
    notes: "Already installed on beforeyousign. Enable Auto ads in the AdSense dashboard.",
  },
  {
    id: "sovrn",
    name: "Sovrn Commerce",
    signupUrl: "https://www.sovrn.com/publishers/commerce/",
    dashboardUrl: "https://publishers.sovrn.com/",
    payoutMethods: "PayPal, direct deposit (~$25 minimum)",
    notes: "One signup auto-monetizes LegalZoom, Rocket Lawyer, Amazon, and 50,000+ stores.",
  },
  {
    id: "cj",
    name: "CJ Affiliate (Commission Junction)",
    signupUrl: "https://signup.cj.com/member/signup/publisher/",
    dashboardUrl: "https://members.cj.com/",
    payoutMethods: "Direct deposit, check (~$50 minimum)",
    notes: "Apply to LegalZoom after your CJ publisher account is approved.",
  },
  {
    id: "shareasale",
    name: "ShareASale (Awin)",
    signupUrl: "https://account.shareasale.com/a/signUp.asp",
    dashboardUrl: "https://account.shareasale.com/a/login.cfm",
    payoutMethods: "Direct deposit, check (~$50 minimum)",
    notes: "Search merchant ID 47174 for Rocket Lawyer after approval.",
  },
  {
    id: "impact",
    name: "Impact",
    signupUrl: "https://app.impact.com/signup/none/create-new-mediapartner-account-flow.ihtml",
    dashboardUrl: "https://app.impact.com/",
    payoutMethods: "Direct deposit, PayPal",
    notes: "LegalZoom also runs campaigns here (~15% per sale).",
  },
  {
    id: "amazon",
    name: "Amazon Associates",
    signupUrl: "https://affiliate-program.amazon.com/",
    dashboardUrl: "https://affiliate-program.amazon.com/home",
    payoutMethods: "Direct deposit, Amazon gift card (~$10 minimum)",
    notes: "Add your store ID to VITE_AMAZON_ASSOCIATE_TAG in Vercel env vars.",
  },
];

export const affiliatePrograms: AffiliateProgram[] = [
  {
    id: "legalzoom",
    name: "LegalZoom",
    description: "Get a real attorney to review high-stakes contracts before you sign.",
    cta: "Talk to a lawyer",
    tag: "Legal help",
    defaultUrl: "https://www.legalzoom.com/",
    envUrlKey: "VITE_AFFILIATE_LEGALZOOM_URL",
    commission: "$20–$35 per sale or 15%",
    networkId: "cj",
    signupUrl: "https://www.legalzoom.com/partner-programs",
    dashboardUrl: "https://members.cj.com/",
  },
  {
    id: "rocketlawyer",
    name: "Rocket Lawyer",
    description: "Affordable legal documents and on-call attorneys for everyday contracts.",
    cta: "Get legal docs",
    tag: "Documents",
    defaultUrl: "https://www.rocketlawyer.com/",
    envUrlKey: "VITE_AFFILIATE_ROCKETLAWYER_URL",
    commission: "Up to 30% recurring",
    networkId: "shareasale",
    signupUrl: "https://www.rocketlawyer.com/partner-with-us",
    dashboardUrl: "https://account.shareasale.com/a/login.cfm",
  },
  {
    id: "docusign",
    name: "DocuSign",
    description: "Sign and send contracts securely once you're ready to commit.",
    cta: "Sign securely",
    tag: "E-sign",
    defaultUrl: "https://www.docusign.com/",
    envUrlKey: "VITE_AFFILIATE_DOCUSIGN_URL",
    commission: "Up to 15% on paid upgrades",
    networkId: "sovrn",
    signupUrl: "https://www.docusign.com/partners",
    dashboardUrl: "https://publishers.sovrn.com/",
  },
  {
    id: "privacy",
    name: "Privacy.com",
    description: "Use virtual cards so auto-renewals and hidden fees can't surprise you.",
    cta: "Block surprise charges",
    tag: "Protect payments",
    defaultUrl: "https://privacy.com/",
    envUrlKey: "VITE_AFFILIATE_PRIVACY_URL",
    commission: "Varies via Sovrn/Skimlinks",
    networkId: "sovrn",
    signupUrl: "https://www.sovrn.com/publishers/commerce/",
    dashboardUrl: "https://publishers.sovrn.com/",
  },
  {
    id: "amazon-contract-book",
    name: "Contract Reading Guide (Amazon)",
    description: "A practical book on understanding contracts before you sign anything.",
    cta: "Read on Amazon",
    tag: "Learn more",
    defaultUrl: "https://www.amazon.com/dp/0314289024",
    envUrlKey: "VITE_AFFILIATE_AMAZON_BOOK_URL",
    commission: "1–4% per purchase",
    networkId: "amazon",
    signupUrl: "https://affiliate-program.amazon.com/",
    dashboardUrl: "https://affiliate-program.amazon.com/home",
  },
];

export const revenueSources: RevenueSource[] = [
  {
    id: "adsense",
    name: "Google AdSense (display ads)",
    type: "ads",
    signupUrl: "https://www.google.com/adsense/start/",
    dashboardUrl: "https://adsense.google.com/",
    payoutMethods: "Bank transfer / check",
    howMuch: "Varies by traffic — typically $1–$8 RPM",
    status: "live",
  },
  {
    id: "sovrn-auto",
    name: "Sovrn Commerce (auto-affiliate links)",
    type: "auto",
    signupUrl: "https://www.sovrn.com/publishers/commerce/",
    dashboardUrl: "https://publishers.sovrn.com/",
    payoutMethods: "PayPal / direct deposit",
    howMuch: "Converts existing partner links automatically",
    status: "signup-required",
  },
  {
    id: "legalzoom",
    name: "LegalZoom referrals",
    type: "affiliate",
    signupUrl: "https://signup.cj.com/member/signup/publisher/",
    dashboardUrl: "https://members.cj.com/",
    payoutMethods: "CJ Affiliate payouts",
    howMuch: "$20–$35 per sale",
    status: "signup-required",
  },
  {
    id: "rocketlawyer",
    name: "Rocket Lawyer referrals",
    type: "affiliate",
    signupUrl: "https://account.shareasale.com/a/signUp.asp",
    dashboardUrl: "https://account.shareasale.com/a/login.cfm",
    payoutMethods: "ShareASale payouts",
    howMuch: "Up to 30% recurring",
    status: "signup-required",
  },
  {
    id: "amazon",
    name: "Amazon Associates",
    type: "affiliate",
    signupUrl: "https://affiliate-program.amazon.com/",
    dashboardUrl: "https://affiliate-program.amazon.com/home",
    payoutMethods: "Direct deposit / gift card",
    howMuch: "1–4% on qualifying purchases",
    status: "signup-required",
  },
];

const utm = "utm_source=beforeyousign&utm_medium=affiliate";

export function getAffiliateUrl(program: AffiliateProgram): string {
  if (program.envUrlKey) {
    const customUrl = import.meta.env[program.envUrlKey as keyof ImportMetaEnv];
    if (typeof customUrl === "string" && customUrl.trim()) {
      return customUrl.trim();
    }
  }

  if (program.id === "amazon-contract-book") {
    const tag = import.meta.env.VITE_AMAZON_ASSOCIATE_TAG;
    const base = program.defaultUrl;
    if (typeof tag === "string" && tag.trim()) {
      return `${base}?tag=${encodeURIComponent(tag.trim())}`;
    }
  }

  const separator = program.defaultUrl.includes("?") ? "&" : "?";
  return `${program.defaultUrl}${separator}${utm}`;
}

export const affiliateDisclosure =
  "Some links are partner referrals. We may earn a commission at no extra cost to you.";
