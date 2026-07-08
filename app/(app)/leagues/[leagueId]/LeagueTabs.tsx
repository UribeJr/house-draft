"use client";

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

  return (
    <Tabs
      value={pathname}
      onValueChange={(href) => router.push(href)}
      className="mt-5"
    >
      <TabsList className="max-w-full justify-start overflow-x-auto">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.href} value={tab.href} asChild>
            <Link href={tab.href}>
              {tab.icon && <GaugeIcon className="h-3.5 w-3.5" />}
              {tab.label}
            </Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
