import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input suppressHydrationWarning ref={ref} className={cn("h-10 w-full rounded-lg border border-slate-200 bg-white/90 px-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/15", className)} {...props} />
));
Input.displayName = "Input";
