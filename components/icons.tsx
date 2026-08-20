import type { EventType } from "@/lib/labels";

type IconProps = {
  className?: string;
};

const base = "h-4 w-4 shrink-0";

export function CrownIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M3 8l4 3 5-6 5 6 4-3-2 10H5L3 8z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="var(--kit-yellow)"
      />
      <path d="M5 18h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ShieldIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 3l7 3v5c0 4.5-2.9 7.9-7 10-4.1-2.1-7-5.5-7-10V6l7-3z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="var(--kit-blue-light)"
      />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function KeyIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="7" cy="14" r="3.5" stroke="currentColor" strokeWidth="2" fill="var(--kit-yellow)" />
      <path d="M10 11.5L19 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M15 6l2.5 2.5M18 3l2.5 2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function DoorExitIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="4" y="3" width="10" height="18" rx="1" stroke="currentColor" strokeWidth="2" fill="var(--kit-brown)" />
      <circle cx="11" cy="12" r="1" fill="currentColor" />
      <path d="M16 8l5 4-5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 12h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function GavelIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="2.5" y="14.5" width="9" height="3" rx="0.5" transform="rotate(-45 2.5 14.5)" stroke="currentColor" strokeWidth="1.6" fill="var(--kit-brown)" />
      <rect x="10.5" y="6.5" width="9" height="3.4" rx="0.6" transform="rotate(45 10.5 6.5)" stroke="currentColor" strokeWidth="1.6" fill="var(--kit-brown)" />
      <path d="M14 20h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 15l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function ChairIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 4v9M18 4v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <rect x="6" y="11" width="12" height="3" rx="0.5" stroke="currentColor" strokeWidth="2" fill="var(--kit-pink)" />
      <path d="M6 14v6M18 14v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 20h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function TrophyIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M7 4h10v5a5 5 0 01-10 0V4z" stroke="currentColor" strokeWidth="2" fill="var(--kit-yellow)" />
      <path d="M7 5H4a3 3 0 003 3M17 5h3a3 3 0 01-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 14v3" stroke="currentColor" strokeWidth="2" />
      <path d="M8 20h8M9 17h6l1 3H8l1-3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="var(--kit-yellow)" />
    </svg>
  );
}

export function HeartIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 20s-7-4.4-9.5-8.8C.8 8 2 4.5 5.5 4a4.8 4.8 0 016.5 2.2A4.8 4.8 0 0118.5 4C22 4.5 23.2 8 21.5 11.2 19 15.6 12 20 12 20z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="var(--kit-red)"
      />
    </svg>
  );
}

export function TargetIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" fill="var(--kit-blue-light)" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" fill="#fff" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function DiceIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="3" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="2" fill="#fff" />
      <circle cx="6" cy="6" r="1" fill="currentColor" />
      <circle cx="10" cy="10" r="1" fill="currentColor" />
      <rect x="11" y="11" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="2" fill="var(--kit-red)" />
      <circle cx="14" cy="14" r="1" fill="#fff" />
      <circle cx="16" cy="16" r="1" fill="#fff" />
      <circle cx="18" cy="18" r="1" fill="#fff" />
    </svg>
  );
}

export function LockIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="2" fill="var(--kit-yellow)" />
      <path d="M8 11V8a4 4 0 018 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="15.5" r="1.4" fill="currentColor" />
    </svg>
  );
}

export function TvIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="2.5" y="5" width="19" height="13" rx="1.5" stroke="currentColor" strokeWidth="2" fill="var(--kit-blue-dark)" />
      <path d="M9 21h6M12 18v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6.5 9l3 2.5-3 2.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SofaIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 12V8a2 2 0 012-2h12a2 2 0 012 2v4" stroke="currentColor" strokeWidth="2" />
      <rect x="2.5" y="12" width="19" height="6" rx="1.5" stroke="currentColor" strokeWidth="2" fill="var(--kit-pink)" />
      <path d="M4 18v2M20 18v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ClapperboardIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M3 9l1.5-4.5L20 7l-1.5 4.5L3 9z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="#fff" />
      <rect x="3" y="9" width="18" height="11" rx="1.2" stroke="currentColor" strokeWidth="2" fill="var(--kit-orange)" />
      <path d="M8 9L9.5 4.5M14 9l1.5-4.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function GaugeIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 15a8 8 0 1116 0" stroke="currentColor" strokeWidth="2" fill="var(--kit-blue-light)" />
      <path d="M12 15l4-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="15" r="1.4" fill="currentColor" />
    </svg>
  );
}

export function ReceiptIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M6 3h12v18l-2-1.3L14 21l-2-1.3L10 21l-2-1.3L6 21V3z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="#fff"
      />
      <path d="M9 8h6M9 12h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function SwapArrowsIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 8h13M13 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 16H7M11 20l-4-4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CheckTokenIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="var(--kit-green)" />
      <path d="M8 12.5l2.5 2.5L16 9" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function XTokenIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="var(--kit-red)" />
      <path d="M9 9l6 6M15 9l-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function CrystalBallIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="10" r="7" stroke="currentColor" strokeWidth="2" fill="var(--kit-pink)" />
      <ellipse cx="9.5" cy="7.5" rx="2" ry="1.2" fill="#fff" opacity="0.6" />
      <path d="M6 19h12l-1.5-2.5h-9L6 19z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="var(--kit-brown)" />
    </svg>
  );
}

export function HouseTokenIcon({ className = "h-6 w-6 shrink-0" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 11l8-7 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 10v9h12v-9" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="var(--kit-red)" />
      <rect x="10.5" y="14" width="3" height="5" fill="#fff" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function BuildingsIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="2.5" y="10" width="7" height="10" stroke="currentColor" strokeWidth="1.8" fill="var(--kit-green)" />
      <rect x="10.5" y="6" width="5" height="14" stroke="currentColor" strokeWidth="1.8" fill="var(--kit-red)" />
      <rect x="16.5" y="12" width="5" height="8" stroke="currentColor" strokeWidth="1.8" fill="var(--kit-blue-dark)" />
    </svg>
  );
}

export function QuestionTokenIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="var(--kit-yellow)" />
      <path
        d="M9.5 9.5a2.5 2.5 0 115 0c0 2-2.5 1.7-2.5 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="17" r="1.1" fill="currentColor" />
    </svg>
  );
}

export function CurrencyIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="2" y="6" width="20" height="12" rx="1.5" stroke="currentColor" strokeWidth="2" fill="var(--kit-green)" />
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.6" fill="#fff" />
    </svg>
  );
}

const EVENT_ICONS: Record<EventType, (props: IconProps) => React.JSX.Element> = {
  HOH_WIN: CrownIcon,
  VETO_WIN: ShieldIcon,
  VETO_USED: KeyIcon,
  SAVED_WITH_VETO: KeyIcon,
  DIAMOND_VETO_USED: CrystalBallIcon,
  SURVIVED_EVICTION: CheckTokenIcon,
  NOMINATED: ChairIcon,
  REPLACEMENT_NOMINEE: SwapArrowsIcon,
  EVICTED: DoorExitIcon,
  MADE_JURY: GavelIcon,
  MADE_FINAL_5: TargetIcon,
  MADE_FINAL_3: TargetIcon,
  RUNNER_UP: TrophyIcon,
  WINNER: TrophyIcon,
  AMERICA_FAVORITE: HeartIcon,
  BLOCK_BUSTER_WIN: ShieldIcon,
  TIME_CAPSULE_SELECTED: CrystalBallIcon,
  TIME_CAPSULE_POWER: KeyIcon,
  TIME_CAPSULE_PUNISHMENT: XTokenIcon,
  CORRECT_WINNER_PICK: CrystalBallIcon,
  CORRECT_FIRST_BOOT: TargetIcon,
};

export function EventIcon({ type, className }: { type: EventType; className?: string }) {
  const Icon = EVENT_ICONS[type] ?? DiceIcon;
  return <Icon className={className ?? base} />;
}
