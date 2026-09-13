"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

function TooltipProvider({ children }: { children: React.ReactNode; delayDuration?: number }) {
  return <>{children}</>;
}

function Tooltip({ children }: { children: React.ReactNode }) {
  return <span className="group/tooltip relative inline-flex">{children}</span>;
}

function TooltipTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  if (asChild && React.isValidElement(children)) return children;
  return <span>{children}</span>;
}

const TooltipContent = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement> & { side?: "right" | "left" | "top" | "bottom"; sideOffset?: number }>(
  ({ className, side = "top", sideOffset: _sideOffset, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "pointer-events-none absolute z-50 hidden whitespace-nowrap rounded-md bg-slate-950 px-3 py-1.5 text-xs text-white shadow-md group-hover/tooltip:block group-focus-within/tooltip:block",
        side === "right" && "left-full top-1/2 ml-2 -translate-y-1/2",
        side === "left" && "right-full top-1/2 mr-2 -translate-y-1/2",
        side === "top" && "bottom-full left-1/2 mb-2 -translate-x-1/2",
        side === "bottom" && "left-1/2 top-full mt-2 -translate-x-1/2",
        className
      )}
      {...props}
    />
  )
);
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
