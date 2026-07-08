import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary: "btn-primary",
        default: "btn-primary",
        secondary: "btn-secondary",
        danger: "btn-danger",
        destructive: "btn-danger",
        outline:
          "type-board-medium gap-2 rounded-[5px] border-2 border-black bg-white px-4 py-2.5 text-black shadow-[0_2px_0_rgba(0,0,0,0.2)] hover:bg-black/5 focus-visible:border-[var(--kit-orange)] focus-visible:ring-2 focus-visible:ring-[rgba(247,148,29,0.35)]",
        ghost:
          "type-board-medium gap-2 rounded-[5px] text-black hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-[rgba(247,148,29,0.35)]",
        link: "type-instruction-body gap-1 text-[var(--kit-orange)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-auto gap-2 px-4 py-2.5",
        xs: "type-board-small h-6 gap-1 rounded-[4px] px-2",
        sm: "type-board-small h-8 gap-1.5 rounded-[4px] px-2.5",
        lg: "h-auto gap-2 px-6 py-3",
        icon: "size-8 p-0",
        "icon-xs": "size-6 rounded-[4px] p-0",
        "icon-sm": "size-7 rounded-[4px] p-0",
        "icon-lg": "size-9 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "primary",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
