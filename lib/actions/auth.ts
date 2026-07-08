"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string; message?: string } | null;

export async function signUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const username = String(formData.get("username") ?? "").trim();

  if (!email || !password || !username) return { error: "Fill in every field to move into the house." };
  if (password.length < 8) return { error: "Password needs at least 8 characters." };
  if (username.length < 3) return { error: "Username needs at least 3 characters." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });

  if (error) return { error: error.message };
  if (!data.session) {
    return {
      message:
        "Check your email to confirm your account, then log in. (Tip: disable “Confirm email” in Supabase Auth settings for instant signups.)",
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Wrong email or password. You've been evicted from this form — try again." };

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
