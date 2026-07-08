import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logOut } from "@/lib/actions/auth";
import { BrandLogo } from "@/components/BrandLogo";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b-2 border-black bg-white shadow-[0_3px_0_rgba(0,0,0,0.2)]">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/dashboard"
            className="block"
            aria-label="House Draft dashboard"
          >
            <BrandLogo priority />
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-semibold text-zinc-600 sm:inline">
              @{profile?.username ?? "houseguest"}
            </span>
            <form action={logOut}>
              <button type="submit" className="btn-secondary type-board-small !px-3 !py-1.5">
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
