import type { ActionState } from "@/lib/actions/auth";

/**
 * Renders inline validation/error copy next to a form's submit button.
 * Success messages are shown via a toast instead (see `useActionToast`),
 * so this intentionally ignores `state.message`.
 */
export function FormNotice({ state }: { state: ActionState }) {
  if (!state?.error) return null;
  return (
    <p className="rounded-xl border border-[#f01c25]/30 bg-[#f01c25]/10 px-3.5 py-2.5 text-sm text-[#f01c25]">
      {state.error}
    </p>
  );
}
