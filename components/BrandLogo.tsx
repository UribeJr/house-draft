import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
  variant?: "nav" | "auth" | "hero";
};

const LOGO_ASPECT = "aspect-[1024/682]";

const VARIANT_CLASS: Record<NonNullable<BrandLogoProps["variant"]>, string> = {
  nav: `${LOGO_ASPECT} h-12 sm:h-14`,
  auth: `${LOGO_ASPECT} h-24 sm:h-28`,
  hero: `${LOGO_ASPECT} h-36 w-full max-w-[min(480px,92vw)] sm:h-48`,
};

const IMAGE_SIZES: Record<NonNullable<BrandLogoProps["variant"]>, string> = {
  nav: "(max-width: 640px) 72px, 84px",
  auth: "(max-width: 640px) 144px, 168px",
  hero: "(max-width: 640px) 92vw, 480px",
};

export function BrandLogo({
  className,
  priority = false,
  variant = "nav",
}: BrandLogoProps) {
  return (
    <span
      className={cn(
        "relative block shrink-0 overflow-hidden",
        VARIANT_CLASS[variant],
        className
      )}
      aria-label="Big Brother House Draft"
    >
      <Image
        src="/house-draft-logo.png"
        alt="Big Brother House Draft"
        fill
        priority={priority}
        sizes={IMAGE_SIZES[variant]}
        className="object-contain"
      />
    </span>
  );
}
