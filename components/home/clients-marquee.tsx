"use client";

import { Marquee } from "@/components/ui/marquee";

type ClientsMarqueeProps = {
  logos: string[];
};

export function ClientsMarquee({ logos }: ClientsMarqueeProps) {
  const safeLogos = logos.length ? logos : ["/brand/logo-dud.png", "/demo/flyer.svg", "/demo/rollup.svg"];
  const logos1 = safeLogos;
  const logos2 = [...safeLogos].reverse();

  return (
    <section className="bg-slate-950 py-16 text-white">
      <div className="container-page">
        <p className="mx-auto mb-8 max-w-4xl text-center text-base text-slate-300">
          Eine Auswahl unserer Kunden aus den Bereichen Druck, Werbetechnik, Beschriftung und visuelle Kommunikation. Vielen Dank für die erfolgreiche Zusammenarbeit.
        </p>
        <div className="items-center overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_2rem,black_calc(100%-2rem),transparent)]">
          <div className="flex w-full max-w-6xl flex-col gap-y-4">
            <Marquee pauseOnHover speed={22} className="[--gap:20px] p-0">
              {logos1.map((src, index) => (
                <div
                  key={`${src}-${index}`}
                  className="flex h-[140px] w-[120px] shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-4"
                >
                  <img src={src} alt="Kundenlogo" className="h-auto max-h-16 w-full object-contain brightness-0 invert" />
                </div>
              ))}
            </Marquee>
            <Marquee pauseOnHover reverse speed={22} className="[--gap:20px] p-0">
              {logos2.map((src, index) => (
                <div
                  key={`${src}-rev-${index}`}
                  className="flex h-[140px] w-[120px] shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-4"
                >
                  <img src={src} alt="Kundenlogo" className="h-auto max-h-16 w-full object-contain brightness-0 invert" />
                </div>
              ))}
            </Marquee>
          </div>
        </div>
      </div>
    </section>
  );
}
