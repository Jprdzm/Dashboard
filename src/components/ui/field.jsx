"use client"

import { cva } from "class-variance-authority"
import {
  FieldError as AriaFieldError,
  Group as AriaGroup,
  Label as AriaLabel,
  Text as AriaText,
  composeRenderProps,
} from "react-aria-components"

import { cn } from "@/lib/utils"

export const labelVariants = cva([
  "text-sm font-medium leading-none",
  "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-70",
  "group-data-[invalid]:text-red-600 dark:group-data-[invalid]:text-red-400",
])

export const Label = ({ className, ...props }) => (
  <AriaLabel className={cn(labelVariants(), className)} {...props} />
)

export function FormDescription({ className, ...props }) {
  return (
    <AriaText
      className={cn("text-sm text-slate-500 dark:text-slate-400", className)}
      {...props}
      slot="description"
    />
  )
}

export function FieldError({ className, ...props }) {
  return (
    <AriaFieldError
      className={cn("text-sm font-medium text-red-600 dark:text-red-400", className)}
      {...props}
    />
  )
}

const fieldGroupVariants = cva("", {
  variants: {
    variant: {
      default: [
        "relative flex h-10 w-full items-center overflow-hidden rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B0F19] px-3 py-2 text-sm",
        "data-[focus-within]:outline-none data-[focus-within]:ring-2 data-[focus-within]:ring-teal-500 data-[focus-within]:ring-offset-2",
        "data-[disabled]:opacity-50",
      ],
      ghost: "",
    },
  },
  defaultVariants: { variant: "default" },
})

export function FieldGroup({ className, variant, ...props }) {
  return (
    <AriaGroup
      className={composeRenderProps(className, (className) =>
        cn(fieldGroupVariants({ variant }), className)
      )}
      {...props}
    />
  )
}
