"use client"

import { Check, Minus } from "lucide-react"
import {
  Checkbox as AriaCheckbox,
  CheckboxGroup as AriaCheckboxGroup,
  composeRenderProps,
} from "react-aria-components"

import { cn } from "@/lib/utils"
import { labelVariants } from "@/components/ui/field"

export const CheckboxGroup = AriaCheckboxGroup

export const Checkbox = ({ className, children, ...props }) => (
  <AriaCheckbox
    className={composeRenderProps(className, (className) =>
      cn(
        "group/checkbox flex items-center gap-x-2",
        "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-70",
        labelVariants(),
        className
      )
    )}
    {...props}
  >
    {composeRenderProps(children, (children, renderProps) => (
      <>
        <div
          className={cn(
            "flex size-4 shrink-0 items-center justify-center rounded-sm border border-teal-600 dark:border-teal-500 text-current ring-offset-white dark:ring-offset-[#0B0F19]",
            /* Focus visible */
            "group-data-[focus-visible]/checkbox:outline-none group-data-[focus-visible]/checkbox:ring-2 group-data-[focus-visible]/checkbox:ring-teal-500 group-data-[focus-visible]/checkbox:ring-offset-2",
            /* Selected */
            "group-data-[selected]/checkbox:bg-teal-600 dark:group-data-[selected]/checkbox:bg-teal-500 group-data-[selected]/checkbox:border-teal-600 dark:group-data-[selected]/checkbox:border-teal-500 group-data-[selected]/checkbox:text-white",
            /* Indeterminate */
            "group-data-[indeterminate]/checkbox:bg-teal-600 dark:group-data-[indeterminate]/checkbox:bg-teal-500 group-data-[indeterminate]/checkbox:text-white",
            /* Disabled */
            "group-data-[disabled]/checkbox:cursor-not-allowed group-data-[disabled]/checkbox:opacity-50",
            "focus:outline-none"
          )}
        >
          {renderProps.isIndeterminate ? (
            <Minus className="size-3" />
          ) : renderProps.isSelected ? (
            <Check className="size-3" strokeWidth={3} />
          ) : null}
        </div>
        {children}
      </>
    ))}
  </AriaCheckbox>
)
