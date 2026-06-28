import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  inverse?: boolean;
};

export function SectionHeading({ eyebrow, title, description, align = "left", className, inverse = false }: SectionHeadingProps) {
  return (
    <div className={cn(align === "center" ? "text-center" : "", className)}>
      {eyebrow ? <p className={cn("inline-flex border-l-4 px-3 py-1 text-xs font-black uppercase tracking-[0.12em]", inverse ? "border-brand-coral bg-white/10 text-white" : "border-brand-coral bg-brand-coral/5 text-brand-blue")}>{eyebrow}</p> : null}
      <h2 className={cn("mt-3 text-3xl font-black leading-tight md:text-4xl", inverse ? "text-white" : "text-slate-900")}>{title}</h2>
      {description ? <p className={cn("mt-3 max-w-3xl text-base md:text-lg", inverse ? "text-white/65" : "text-muted-foreground")}>{description}</p> : null}
    </div>
  );
}
