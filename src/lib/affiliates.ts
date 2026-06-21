export type AffiliatePartner = {
  name: string;
  description: string;
  href: string;
  cta: string;
  tag?: string;
};

const utm = "utm_source=beforeyousign&utm_medium=referral";

export const affiliatePartners: AffiliatePartner[] = [
  {
    name: "LegalZoom",
    description: "Get a real attorney to review high-stakes contracts before you sign.",
    href: `https://www.legalzoom.com/?${utm}`,
    cta: "Talk to a lawyer",
    tag: "Legal help",
  },
  {
    name: "Rocket Lawyer",
    description: "Affordable legal documents and on-call attorneys for everyday contracts.",
    href: `https://www.rocketlawyer.com/?${utm}`,
    cta: "Get legal docs",
    tag: "Documents",
  },
  {
    name: "DocuSign",
    description: "Sign and send contracts securely once you're ready to commit.",
    href: `https://www.docusign.com/?${utm}`,
    cta: "Sign securely",
    tag: "E-sign",
  },
  {
    name: "Privacy.com",
    description: "Use virtual cards so auto-renewals and hidden fees can't surprise you.",
    href: `https://privacy.com/?${utm}`,
    cta: "Block surprise charges",
    tag: "Protect payments",
  },
];

export const affiliateDisclosure =
  "Some links on this page are partner referrals. We may earn a commission at no extra cost to you.";
