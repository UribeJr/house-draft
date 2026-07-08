"use client";

import { useActionState, useState } from "react";
import { saveHouseguest, deleteHouseguest } from "@/lib/actions/seasons";
import { FormNotice } from "@/components/FormNotice";
import { SubmitButton } from "@/components/SubmitButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HgAvatar } from "@/components/HgAvatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/labels";
import type { Tables } from "@/lib/types/database";
import { TrophyIcon } from "@/components/icons";
import { Mascot } from "@/components/Mascot";
import { useActionToast } from "@/lib/useActionToast";

type Houseguest = Tables<"houseguests">;
type Season = { id: string; name: string; created_by: string | null };

const STATUS_OPTIONS = ["active", "evicted", "jury", "finalist", "winner"] as const;

function HouseguestForm({
  season,
  houseguest,
}: {
  season: Season;
  houseguest: Houseguest | null;
}) {
  const [state, action] = useActionState(saveHouseguest, null);
  useActionToast(state);

  return (
    <form action={action} className="space-y-4 p-5">
      <input type="hidden" name="season_id" value={season.id} />
      <input type="hidden" name="houseguest_id" value={houseguest?.id ?? ""} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Name *</label>
          <input name="name" required defaultValue={houseguest?.name ?? ""} className="input" placeholder="Janelle P." />
        </div>
        <div>
          <label className="label">Age</label>
          <input name="age" type="number" min={18} max={99} defaultValue={houseguest?.age ?? ""} className="input" placeholder="27" />
        </div>
        <div>
          <label className="label">Hometown</label>
          <input name="hometown" defaultValue={houseguest?.hometown ?? ""} className="input" placeholder="Miami, FL" />
        </div>
        <div>
          <label className="label">Occupation</label>
          <input name="occupation" defaultValue={houseguest?.occupation ?? ""} className="input" placeholder="Bartender" />
        </div>
        <div>
          <label className="label">Status</label>
          <Select name="status" defaultValue={houseguest?.status ?? "active"}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="label">Placement (1 = winner)</label>
          <input name="placement" type="number" min={1} defaultValue={houseguest?.placement ?? ""} className="input" placeholder="—" />
        </div>
        <div>
          <label className="label">Image URL</label>
          <input name="image_url" type="url" defaultValue={houseguest?.image_url ?? ""} className="input" placeholder="https://…" />
        </div>
        <div>
          <label className="label">…or upload a photo</label>
          <input
            name="image_file"
            type="file"
            accept="image/*"
            className="input !py-2 file:mr-3 file:rounded-lg file:border-0 file:bg-[#f7941d] file:px-3 file:py-1 file:text-xs file:font-bold file:text-zinc-950"
          />
        </div>
      </div>
      <FormNotice state={state} />
      <SubmitButton pendingLabel="Saving…">
        {houseguest ? "Save changes" : "Move them in"}
      </SubmitButton>
    </form>
  );
}

export function CastManager({
  season,
  houseguests,
  isOwner,
}: {
  season: Season;
  houseguests: Houseguest[];
  isOwner: boolean;
}) {
  const [editing, setEditing] = useState<Houseguest | null>(null);
  const [adding, setAdding] = useState(false);

  const open = adding || editing !== null;
  const closeDialog = () => {
    setAdding(false);
    setEditing(null);
  };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="type-instruction-heading-medium">{season.name}</h1>
          <p className="mt-1 text-sm text-zinc-600">
            {houseguests.length} houseguest{houseguests.length === 1 ? "" : "s"} in the cast
            {!isOwner && " · view only"}
          </p>
        </div>
        {isOwner && (
          <Button type="button" onClick={() => setAdding(true)}>
            + Add houseguest
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={(next) => !next && closeDialog()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader band="orange">
            <DialogTitle>{editing ? `Edit ${editing.name}` : "Add a houseguest"}</DialogTitle>
          </DialogHeader>
          <HouseguestForm season={season} houseguest={editing} />
        </DialogContent>
      </Dialog>

      {houseguests.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center px-6 py-16 text-center">
            <Mascot size="md" />
            <h2 className="mt-4 text-lg font-bold">No cast yet</h2>
            <p className="mt-1 max-w-sm text-sm text-zinc-600">
              {isOwner
                ? "Add the houseguests your leagues will draft. Aim for at least roster size × teams."
                : "The season owner hasn't added houseguests yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {houseguests.map((hg) => (
            <div key={hg.id} className="card flex items-center gap-4 p-4">
              <HgAvatar name={hg.name} imageUrl={hg.image_url} size="lg" dimmed={hg.status === "evicted"} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-bold">{hg.name}</h3>
                  {hg.placement === 1 && (
                    <span title="Winner">
                      <TrophyIcon className="h-4 w-4" />
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-zinc-600">
                  {[hg.age, hg.hometown, hg.occupation].filter(Boolean).join(" · ") || "—"}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <Badge variant={STATUS_STYLES[hg.status]}>{STATUS_LABELS[hg.status]}</Badge>
                  {hg.placement && <span className="text-xs text-zinc-500">#{hg.placement}</span>}
                </div>
              </div>
              {isOwner && (
                <div className="flex flex-col gap-1.5">
                  <Button
                    type="button"
                    variant="secondary"
                    className="!px-2.5 !py-1 text-xs"
                    onClick={() => {
                      setEditing(hg);
                      setAdding(false);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    Edit
                  </Button>
                  <form id={`delete-hg-${hg.id}`} action={deleteHouseguest}>
                    <input type="hidden" name="houseguest_id" value={hg.id} />
                    <input type="hidden" name="season_id" value={season.id} />
                  </form>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="danger" className="!px-2.5 !py-1 text-xs">
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Evict {hg.name}?</AlertDialogTitle>
                      </AlertDialogHeader>
                      <AlertDialogDescription>
                        This removes {hg.name} from the cast entirely. This can&apos;t be undone.
                      </AlertDialogDescription>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction form={`delete-hg-${hg.id}`} type="submit">
                          Evict them
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
