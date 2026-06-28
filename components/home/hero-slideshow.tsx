"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock3, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const slides = [
  {
    title: "Druckservice für Unternehmen",
    subtitle: "Flyer, Broschüren und Geschäftsdrucksorten mit Feingefühl für Ihre Marke.",
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1600&q=80",
    tags: ["Flyer", "Broschüren", "Geschäftsdrucksorten"],
    metric: "Schnelle Produktion",
    icon: Clock3
  },
  {
    title: "Werbetechnik & Sichtbarkeit",
    subtitle: "Banner, Schilder und Roll-ups, die ruhig, klar und hochwertig wirken.",
    image: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?auto=format&fit=crop&w=1600&q=80",
    tags: ["Banner", "Schilder", "Fahrzeugbeschriftung"],
    metric: "Montage inklusive",
    icon: Sparkles
  },
  {
    title: "Werbeagentur & Design",
    subtitle: "Logo und Corporate Design mit Charakter, damit Ihr Auftritt in Erinnerung bleibt.",
    image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1600&q=80",
    tags: ["Logo", "Corporate Design", "Kampagnen"],
    metric: "Konzept bis Umsetzung",
    icon: ShieldCheck
  }
];

export function HeroSlideshow({ fullScreen = false }: { fullScreen?: boolean }) {
  const [active, setActive] = useState(0);
  const slide = slides[active];
  const Icon = slide.icon;

  useEffect(() => {
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 7600);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className={fullScreen ? "relative h-full w-full" : "relative mx-auto w-full max-w-[620px]"}>
      <div className={fullScreen ? "relative h-full overflow-hidden bg-slate-900" : "relative overflow-hidden rounded-2xl border bg-slate-900 shadow-[0_28px_90px_rgba(3,10,18,.28)]"}>
        <div className="absolute left-0 right-0 top-0 z-20 h-1 bg-white/20">
          <motion.div
            key={active}
            className="h-full bg-brand-cyan"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 7.6, ease: "linear" }}
          />
        </div>
        <div className={fullScreen ? "relative h-full min-h-screen" : "relative aspect-[4/3] min-h-[430px]"}>
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.title}
              initial={{ opacity: 0.2, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0.2, scale: 0.99 }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <Image src={slide.image} alt={slide.title} fill className="object-cover" sizes="(min-width: 1024px) 45vw, 100vw" priority />
              <div className="absolute inset-0 bg-[linear-gradient(130deg,rgba(2,8,18,.64),rgba(2,8,18,.28)_44%,rgba(2,8,18,.78)_100%)]" />
              <div className="absolute inset-0 flex flex-col justify-between p-6 text-white">
                <div className="flex items-start justify-between gap-4">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-bold">
                    <Icon className="h-3.5 w-3.5 text-brand-cyan" /> Studio Workflow
                  </span>
                  <span className="rounded-full border border-white/25 bg-black/30 px-3 py-1 text-xs font-bold">{slide.metric}</span>
                </div>
                <div>
                  <h2 className="max-w-[470px] text-3xl font-black leading-tight md:text-4xl">{slide.title}</h2>
                  <p className="mt-3 max-w-[520px] text-sm text-white/85 md:text-base">{slide.subtitle}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {slide.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-white/25 bg-black/25 px-3 py-1 text-xs font-semibold">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between gap-3">
          <div className="flex gap-2 rounded-full border border-white/25 bg-black/35 px-3 py-2 backdrop-blur-sm">
            {slides.map((item, index) => (
              <button key={item.title} aria-label={item.title} onClick={() => setActive(index)} className={index === active ? "h-2 w-8 rounded-full bg-brand-cyan" : "h-2 w-2 rounded-full bg-white/45"} />
            ))}
          </div>
          <div className="flex gap-2 rounded-full border border-white/25 bg-black/35 p-1 backdrop-blur-sm">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/15 hover:text-white" onClick={() => setActive((active + slides.length - 1) % slides.length)}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/15 hover:text-white" onClick={() => setActive((active + 1) % slides.length)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
    </div>
  );
}
