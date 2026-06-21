import {
  affiliateDisclosure,
  affiliatePrograms,
  getAffiliateUrl,
  type AffiliateProgram,
} from "./affiliate-config";

export type AffiliatePartner = AffiliateProgram & {
  href: string;
};

export const affiliatePartners: AffiliatePartner[] = affiliatePrograms.map((program) => ({
  ...program,
  href: getAffiliateUrl(program),
}));

export { affiliateDisclosure, getAffiliateUrl };
