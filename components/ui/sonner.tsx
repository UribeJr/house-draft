"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: "kit-toast",
          title: "kit-toast-title",
          description: "kit-toast-description",
          icon: "kit-toast-icon",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
