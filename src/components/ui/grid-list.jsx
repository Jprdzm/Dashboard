"use client"

import { GripHorizontal } from "lucide-react"
import {
  Button as AriaButton,
  GridList as AriaGridList,
  GridListItem as AriaGridListItem,
  composeRenderProps,
} from "react-aria-components"

import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"

export function GridList({ children, ...props }) {
  return (
    <AriaGridList
      {...props}
      className={composeRenderProps(props.className, (className) =>
        cn(
          "flex flex-col gap-0.5 overflow-auto rounded-xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#0B0F19]/40 p-1.5 outline-none",
          "data-[empty]:p-6 data-[empty]:text-center data-[empty]:text-sm data-[empty]:text-slate-500 dark:data-[empty]:text-slate-400",
          className
        )
      )}
    >
      {children}
    </AriaGridList>
  )
}

export function GridListItem({ children, className, ...props }) {
  const textValue = typeof children === "string" ? children : undefined
  return (
    <AriaGridListItem
      textValue={textValue}
      className={composeRenderProps(className, (className) =>
        cn(
          "relative flex w-full cursor-default select-none items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none transition-colors duration-150",
          /* Disabled */
          "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
          /* Focus visible */
          "data-[focus-visible]:outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-teal-500 data-[focus-visible]:ring-offset-2 data-[focus-visible]:ring-offset-white dark:data-[focus-visible]:ring-offset-[#0B0F19]",
          /* Hovered */
          "data-[hovered]:bg-slate-50 dark:data-[hovered]:bg-white/[0.04]",
          /* Selected */
          "data-[selected]:bg-teal-50 dark:data-[selected]:bg-teal-900/20 data-[selected]:text-teal-700 dark:data-[selected]:text-teal-300",
          /* Dragging */
          "data-[dragging]:opacity-60",
          className
        )
      )}
      {...props}
    >
      {composeRenderProps(children, (children, renderProps) => (
        <>
          {renderProps.allowsDragging && (
            <AriaButton slot="drag">
              <GripHorizontal className="size-4" />
            </AriaButton>
          )}
          {renderProps.selectionMode === "multiple" &&
            renderProps.selectionBehavior === "toggle" && (
              <Checkbox slot="selection" />
            )}
          {children}
        </>
      ))}
    </AriaGridListItem>
  )
}
