import { ExternalLink } from "lucide-react";
import { affiliateDisclosure, affiliatePartners, type AffiliatePartner } from "@/lib/affiliates";
import { cn } from "@/lib/utils";

type AffiliatePartnersProps = {
  title?: string;
  subtitle?: string;
  partners?: AffiliatePartner[];
  className?: string;
  compact?: boolean;
};

export const AffiliatePartners = ({
  title = "Tools that help after the scan",
  subtitle = "Useful next steps if you want extra protection before signing.",
  partners = affiliatePartners,
  className,
  compact = false,
}: AffiliatePartnersProps) => {
  return (
    <section className={cn("w-full", className)}>
      <div className="mb-5 md:mb-6">
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div
        className={cn(
          "grid gap-4",
          compact ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        )}
      >
        {partners.map((partner) => (
          <a
            key={partner.name}
            href={partner.href}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="group flex flex-col rounded-2xl border border-border bg-card p-5 hover:border-primary/40 hover:bg-card/80 transition-smooth"
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="text-[10px] uppercase tracking-widest text-primary font-medium">
                {partner.tag}
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <h3 className="text-base font-semibold mb-2">{partner.name}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-4">
              {partner.description}
            </p>
            <span className="text-sm font-medium text-primary group-hover:underline">
              {partner.cta} →
            </span>
          </a>
        ))}
      </div>

      <p className="text-xs text-muted-foreground/80 mt-4 leading-relaxed">{affiliateDisclosure}</p>
    </section>
  );
};
