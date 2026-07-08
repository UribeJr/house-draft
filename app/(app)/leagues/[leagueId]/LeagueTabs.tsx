"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GaugeIcon } from "@/components/icons";

export function LeagueTabs({
  leagueId,
  isCommissioner,
}: {
  leagueId: string;
  isCommissioner: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const base = `/leagues/${leagueId}`;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const tabs: { href: string; label: string; icon?: boolean }[] = [
    { href: base, label: "Home" },
    { href: `${base}/draft`, label: "Draft" },
    { href: `${base}/leaderboard`, label: "Leaderboard" },
    { href: `${base}/roster`, label: "My Team" },
    { href: `${base}/trades`, label: "Trades" },
    { href: `${base}/predictions`, label: "Predictions" },
    { href: `${base}/rules`, label: "Rules" },
    ...(isCommissioner ? [{ href: `${base}/commissioner`, label: "Commissioner", icon: true }] : []),
  ];

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const updateFades = () => {
      setShowLeftFade(el.scrollLeft > 4);
      setShowRightFade(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };

    updateFades();
    el.addEventListener("scroll", updateFades, { passive: true });
    window.addEventListener("resize", updateFades);
    return () => {
      el.removeEventListener("scroll", updateFades);
      window.removeEventListener("resize", updateFades);
    };
  }, [tabs.length]);

  return (
    <Tabs
      value={pathname}
      onValueChange={(href) => router.push(href)}
      className="mt-5"
    >
      <div className="relative">
        <TabsList
          ref={scrollRef}
          className="max-w-full justify-start overflow-x-auto"
        >
          {tabs.map((tab) => (
            <TabsTrigger key={tab.href} value={tab.href} asChild>
              <Link href={tab.href}>
                {tab.icon && <GaugeIcon className="h-3.5 w-3.5" />}
                {tab.label}
              </Link>
            </TabsTrigger>
          ))}
        </TabsList>
        {showLeftFade && (
          <div className="pointer-events-none absolute inset-y-[3px] left-[3px] w-8 rounded-l-[3px] bg-gradient-to-r from-white to-transparent" />
        )}
        {showRightFade && (
          <div className="pointer-events-none absolute inset-y-[3px] right-[3px] flex w-8 items-center justify-end rounded-r-[3px] bg-gradient-to-l from-white via-white/90 to-transparent pr-1">
            <svg
              viewBox="0 0 8 14"
              className="h-3.5 w-2 text-black/40"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1 1l6 6-6 6" />
            </svg>
          </div>
        )}
      </div>
    </Tabs>
  );
}
