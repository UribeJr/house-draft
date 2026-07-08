import * as React from "react"

import { cn } from "@/lib/utils"

const BAND_CLASS: Record<string, string> = {
  orange: "card-band-orange",
  blue: "card-band-blue",
  pink: "card-band-pink",
  green: "card-band-green",
  yellow: "card-band-yellow",
  red: "card-band-red",
  brown: "card-band-brown",
  "blue-dark": "card-band-blue-dark",
}

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn("card overflow-hidden p-0", className)}
      {...props}
    />
  )
}

function CardHeader({
  className,
  band,
  ...props
}: React.ComponentProps<"div"> & { band?: keyof typeof BAND_CLASS }) {
  return (
    <div
      data-slot="card-header"
      className={cn("card-band", band && BAND_CLASS[band], className)}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("type-board-large", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("type-instruction-body text-[color:var(--kit-muted)]", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="card-content" className={cn("p-5", className)} {...props} />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center gap-2 border-t-2 border-black p-4", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
