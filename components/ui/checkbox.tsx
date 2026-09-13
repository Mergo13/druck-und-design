"use client";

import { Check } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "checked" | "onChange"> & {
  checked?: boolean | "indeterminate";
  onCheckedChange?: (checked: boolean) => void;
};

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(({ className, checked, onCheckedChange, ...props }, ref) => {
  const innerRef = React.useRef<HTMLInputElement | null>(null);

  React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);

  React.useEffect(() => {
    if (innerRef.current) innerRef.current.indeterminate = checked === "indeterminate";
  }, [checked]);

  return (
    <span className="relative inline-flex h-4 w-4 shrink-0">
      <input
        ref={innerRef}
        type="checkbox"
        checked={checked === "indeterminate" ? false : Boolean(checked)}
        onChange={(event) => onCheckedChange?.(event.target.checked)}
        className={cn("peer h-4 w-4 appearance-none rounded-sm border border-slate-300 bg-white outline-none ring-offset-white checked:border-primary checked:bg-primary focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50", className)}
        {...props}
      />
      <Check className="pointer-events-none absolute inset-0 m-auto hidden h-3.5 w-3.5 text-white peer-checked:block" />
      {checked === "indeterminate" ? <span className="pointer-events-none absolute left-1 right-1 top-1/2 h-0.5 -translate-y-1/2 rounded bg-slate-950" /> : null}
    </span>
  );
});
Checkbox.displayName = "Checkbox";

export { Checkbox };
