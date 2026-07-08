"use client";

import { useMemo, useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { HgAvatar } from "@/components/HgAvatar";
import type { HouseguestStatus } from "@/lib/labels";
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/labels";

const STATUS_BADGE_VARIANT = STATUS_STYLES;

export type EntityComboboxItem = {
  id: string;
  name: string;
  imageUrl?: string | null;
  status?: HouseguestStatus | null;
  secondary?: string | null;
};

export function EntityCombobox({
  name,
  items,
  defaultValue = "",
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyLabel = "Nothing found.",
  noPickLabel,
  required,
  disabled,
  className,
}: {
  name: string;
  items: EntityComboboxItem[];
  defaultValue?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  /** When set, renders a "no pick" row at the top that submits an empty value. */
  noPickLabel?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);

  const selected = useMemo(() => items.find((i) => i.id === value) ?? null, [items, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* Native `required` on a hidden input can't show browser validation UI (unfocusable),
          so presence is enforced server-side; this attribute is kept for semantics/tests only. */}
      <input type="hidden" name={name} value={value} data-required={required || undefined} />
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={`w-full min-w-0 justify-between text-sm font-normal normal-case ${className ?? ""}`}
        >
          {selected ? (
            <span className="flex min-w-0 items-center gap-2">
              <HgAvatar name={selected.name} imageUrl={selected.imageUrl} size="xs" />
              <span className="truncate">{selected.name}</span>
              {selected.status && (
                <Badge
                  variant={STATUS_BADGE_VARIANT[selected.status]}
                  className="hidden sm:inline-flex"
                >
                  {STATUS_LABELS[selected.status]}
                </Badge>
              )}
            </span>
          ) : (
            <span className="truncate text-[#888]">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            <CommandGroup>
              {noPickLabel && (
                <CommandItem
                  value="__no_pick__"
                  keywords={[noPickLabel]}
                  data-checked={value === "" ? "true" : undefined}
                  onSelect={() => {
                    setValue("");
                    setOpen(false);
                  }}
                >
                  <span className="flex size-6 items-center justify-center text-[#888]">—</span>
                  <span className="text-[#666] italic">{noPickLabel}</span>
                </CommandItem>
              )}
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.id}
                  keywords={[item.name, item.secondary ?? ""]}
                  data-checked={value === item.id ? "true" : undefined}
                  onSelect={() => {
                    setValue(item.id);
                    setOpen(false);
                  }}
                >
                  <HgAvatar name={item.name} imageUrl={item.imageUrl} size="xs" />
                  <span className="min-w-0 flex-1 truncate">
                    {item.name}
                    {item.secondary && (
                      <span className="ml-1 text-xs text-[color:var(--kit-muted)]">
                        ({item.secondary})
                      </span>
                    )}
                  </span>
                  {item.status && (
                    <Badge variant={STATUS_BADGE_VARIANT[item.status]}>
                      {STATUS_LABELS[item.status]}
                    </Badge>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
