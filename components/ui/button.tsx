import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 motion-elevate",
  {
    variants: {
      variant: {
        default: "border border-[#46cfff]/70 bg-[linear-gradient(112deg,#071426_0%,#0b2f70_46%,#1155cc_72%,#19bde8_145%)] text-white shadow-[0_10px_28px_rgba(17,85,204,.32),0_0_0_1px_rgba(70,207,255,.08),inset_0_1px_0_rgba(255,255,255,.24)] hover:border-[#72e3ff] hover:bg-[linear-gradient(112deg,#0a1930_0%,#104393_45%,#1670e8_76%,#35d4ef_145%)] hover:shadow-[0_15px_36px_rgba(17,85,204,.38),0_0_22px_rgba(70,207,255,.18),inset_0_1px_0_rgba(255,255,255,.28)]",
        secondary: "border border-slate-200 bg-slate-100 text-brand-ink shadow-[inset_0_1px_0_rgba(255,255,255,.8)] hover:border-slate-300 hover:bg-slate-200",
        outline: "border border-slate-300 bg-white text-brand-ink shadow-[0_2px_5px_rgba(15,23,42,.05)] hover:border-brand-blue hover:bg-brand-mist hover:text-brand-blue",
        ghost: "text-slate-700 hover:bg-brand-mist hover:text-brand-blue",
        accent: "border border-[#e94c30] bg-brand-coral text-white shadow-[0_10px_24px_rgba(255,90,60,.25),inset_0_1px_0_rgba(255,255,255,.2)] hover:bg-[#e94c30] hover:shadow-[0_14px_30px_rgba(255,90,60,.32)]"
      },
      size: {
        default: "h-11 px-5",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-7",
        icon: "h-11 w-11"
      }
    },
    defaultVariants: { variant: "default", size: "default" }
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = "Button";

export { Button, buttonVariants };
