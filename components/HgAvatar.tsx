const SIZES = {
  xs: "h-6 w-6 text-[9px]",
  sm: "h-8 w-8 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-24 w-24 text-2xl",
} as const;

export function HgAvatar({
  name,
  imageUrl,
  size = "md",
  dimmed = false,
}: {
  name: string;
  imageUrl?: string | null;
  size?: keyof typeof SIZES;
  dimmed?: boolean;
}) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const base = `${SIZES[size]} shrink-0 rounded-full border-2 border-black object-cover ${
    dimmed ? "opacity-40 grayscale" : ""
  }`;

  if (imageUrl) {
    // Plain <img>: houseguest photos can live on any host (storage or pasted URL).
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={imageUrl} alt={name} className={base} />;
  }
  return (
    <div
      className={`${base} type-card-large-bold flex items-center justify-center bg-[#f7941d] text-black`}
    >
      {initials}
    </div>
  );
}
