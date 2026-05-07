"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, FileCheck, Sparkles, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const slides = [
  {
    title: "Premium Flyer",
    subtitle: "Softtouch, Naturpapier und Same-Day-Produktion",
    accent: "bg-brand-blue",
    metric: "24h",
    icon: Truck
  },
  {
    title: "Textildruck",
    subtitle: "Workwear, Teams und Merch mit Live-Mockup",
    accent: "bg-brand-cyan",
    metric: "4.9",
    icon: Sparkles
  },
  {
    title: "Druckdatencheck",
    subtitle: "Automatische Prüfung vor dem Produktionsstart",
    accent: "bg-brand-ink",
    metric: "PDF/X",
    icon: FileCheck
  }
];

export function HeroSlideshow() {
  const [active, setActive] = useState(0);
  const slide = slides[active];
  const Icon = slide.icon;

  useEffect(() => {
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 4200);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-[560px]">
      <div className="absolute -inset-5 rounded-[2rem] bg-[radial-gradient(circle_at_30%_20%,rgba(35,92,153,.32),transparent_38%),radial-gradient(circle_at_75%_70%,rgba(30,178,196,.22),transparent_34%)] blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl border border-white/12 bg-[#05070a]/88 p-4 shadow-[0_30px_100px_rgba(0,0,0,.45)]">
        <div className="flex items-center justify-between border-b border-white/10 px-2 pb-4 text-white">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">Druck & Design Studio</p>
            <p className="mt-1 font-black">Live Produktionssuite</p>
          </div>
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
        </div>

        <div className="relative min-h-[430px] overflow-hidden rounded-xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.title}
              initial={{ opacity: 0, x: 60, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -60, scale: 0.98 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="absolute inset-0 grid content-between bg-[linear-gradient(135deg,#0b0d11,#111827_58%,#07111f)] p-6 text-white"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-bold text-white/70">
                    <Icon className="h-3.5 w-3.5 text-brand-cyan" /> Express ready
                  </span>
                  <h2 className="mt-5 text-4xl font-black tracking-tight">{slide.title}</h2>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-white/58">{slide.subtitle}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/8 p-4 text-right">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/45">Signal</p>
                  <p className="text-2xl font-black text-brand-cyan">{slide.metric}</p>
                </div>
              </div>

              <div className="relative mx-auto h-56 w-72">
                <motion.div animate={{ y: [0, -12, 0], rotate: [-4, -1, -4] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }} className="absolute left-0 top-8 h-40 w-52 rounded-lg border border-white/10 bg-white p-5 shadow-2xl">
                  <div className="h-3 w-28 rounded-full bg-[#101217]" />
                  <div className="mt-8 h-3 rounded-full bg-brand-blue" />
                  <div className="mt-3 h-3 w-2/3 rounded-full bg-slate-300" />
                  <div className="mt-3 h-3 w-1/2 rounded-full bg-brand-cyan" />
                </motion.div>
                <motion.div animate={{ y: [0, 10, 0], rotate: [5, 2, 5] }} transition={{ repeat: Infinity, duration: 4.4, ease: "easeInOut" }} className="absolute bottom-0 right-0 h-44 w-40 rounded-lg border border-white/10 bg-[#0d1117] p-4 shadow-2xl">
                  <div className={`h-24 rounded-md ${slide.accent}`} />
                  <div className="mt-4 h-2 rounded-full bg-white/70" />
                  <div className="mt-2 h-2 w-2/3 rounded-full bg-white/30" />
                </motion.div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {["Upload", "Check", "Print"].map((item, index) => (
                  <div className="rounded-lg border border-white/10 bg-white/8 p-3" key={item}>
                    <p className="text-xs text-white/45">0{index + 1}</p>
                    <p className="mt-1 text-sm font-bold">{item}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex gap-2">
            {slides.map((item, index) => (
              <button key={item.title} aria-label={item.title} onClick={() => setActive(index)} className={index === active ? "h-2 w-8 rounded-full bg-brand-blue" : "h-2 w-2 rounded-full bg-white/20"} />
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white" onClick={() => setActive((active + slides.length - 1) % slides.length)}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white" onClick={() => setActive((active + 1) % slides.length)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
    </div>
  );
}
