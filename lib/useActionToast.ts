"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import type { ActionState } from "@/lib/actions/auth";

/** Fires a success toast whenever a useActionState result carries a `message`. */
export function useActionToast(state: ActionState) {
  useEffect(() => {
    if (state?.message) {
      toast.success(state.message);
    }
  }, [state]);
}
