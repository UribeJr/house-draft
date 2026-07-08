"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Refreshes server-component data on an interval — keeps the draft room and
 *  trade board live without websockets. */
export function Poller({ intervalMs = 3000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);
  return null;
}
