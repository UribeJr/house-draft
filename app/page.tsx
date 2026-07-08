import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/BrandLogo";
import { ReceiptIcon, CrownIcon, SwapArrowsIcon, TrophyIcon } from "@/components/icons";

const FEATURES = [
  {
    Icon: ReceiptIcon,
    title: "Snake Draft the Cast",
    copy: "Live draft room with a real snake order. When you're on the clock, everyone knows it.",
  },
  {
    Icon: CrownIcon,
    title: "Score Every Twist",
    copy: "HOH wins, veto saves, the Nomination Chair, blindside evictions — every move earns (or loses) points.",
  },
  {
    Icon: SwapArrowsIcon,
    title: "Backdoor Trades",
    copy: "Propose 1-for-1 swaps, campaign for votes, and let the commissioner bless the backdoor.",
  },
  {
    Icon: TrophyIcon,
    title: "Finale Night Glory",
    copy: "Prediction bonuses, finale scoring, and one league champion crowned with the receipts to prove it.",
  },
];

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col">
      <header className="border-b-2 border-black bg-white shadow-[0_3px_0_rgba(0,0,0,0.15)]">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <BrandLogo priority />
          <nav className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary">
              Log in
            </Link>
            <Link href="/signup" className="btn-primary">
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-5xl flex-col items-center px-6 py-16 text-center">
        <BrandLogo variant="hero" priority className="mb-4" />
        <Badge className="bg-[#fef200] text-black">
          Fantasy leagues for reality TV
        </Badge>
        <h1 className="type-instruction-heading-large mt-6 max-w-3xl">
          Draft the house.
          <br />
          <span className="text-[#f7941d]">Win eviction night.</span>
        </h1>
        <p className="type-instruction-body-large mt-6 max-w-xl text-zinc-700">
          HouseDraft turns every Big Brother-style season into a season-long
          fantasy league. Draft houseguests with your friends, rack up points on
          every twist, and settle who really knows the game.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/signup" className="btn-primary !px-6 !py-3 !text-base">
            Start a league
          </Link>
          <Link href="/login" className="btn-secondary !px-6 !py-3 !text-base">
            I have an invite code
          </Link>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 px-6 pb-24 sm:grid-cols-2">
        {FEATURES.map((f, i) => {
          const bands = ["card-band-orange", "card-band-blue", "card-band-pink", "card-band-green"];
          return (
            <div key={f.title} className="card overflow-hidden p-0">
              <div className={`card-band ${bands[i % bands.length]}`}>{f.title}</div>
              <div className="p-5">
                <f.Icon className="h-8 w-8" />
                <p className="mt-2 text-sm leading-relaxed text-zinc-700">{f.copy}</p>
                <p className="mono-footer mt-4">House Draft</p>
              </div>
            </div>
          );
        })}
      </section>

      <footer className="border-t-2 border-black bg-white py-6 text-center text-xs font-semibold text-zinc-600">
        HouseDraft — Diary Room receipts included. Not affiliated with any TV network.
      </footer>
    </main>
  );
}
