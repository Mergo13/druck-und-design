import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeading({ eyebrow, title, description, align = "left", className }: SectionHeadingProps) {
  return (
    <div className={cn(align === "center" ? "text-center" : "", className)}>
      {eyebrow ? <p className="text-sm font-bold uppercase tracking-[0.12em] text-brand-blue">{eyebrow}</p> : null}
      <h2 className="mt-2 text-3xl font-black leading-tight md:text-4xl">{title}</h2>
      {description ? <p className="mt-3 max-w-3xl text-base text-muted-foreground md:text-lg">{description}</p> : null}
    </div>
  );
}
