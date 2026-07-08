const SIZES = {
  sm: 64,
  md: 88,
  lg: 128,
} as const;

export function Mascot({
  size = "md",
  className = "",
}: {
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const px = SIZES[size];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/mascot/diary-room-guy.png"
      alt=""
      width={px}
      height={px}
      className={`select-none ${className}`}
      draggable={false}
    />
  );
}
