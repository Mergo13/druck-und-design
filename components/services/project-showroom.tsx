"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";

export interface ShowroomProject {
  title: string;
  category: string;
  description: string;
  image: string;
}

export function ProjectShowroom({ projects }: { projects: ShowroomProject[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const project = projects[active];

  useEffect(() => {
    if (paused || projects.length < 2) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % projects.length);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [paused, projects.length]);

  const selectPrevious = () => setActive((current) => (current - 1 + projects.length) % projects.length);
  const selectNext = () => setActive((current) => (current + 1) % projects.length);

  return (
    <section
      className="overflow-hidden bg-[#071426] text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="container-page py-16 md:py-24">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-4 text-xs font-black uppercase tracking-[0.18em] text-[#67ddff]">
              <span className="h-0.5 w-12 bg-brand-coral" />
              Aus unserem Studio
            </div>
            <h2 className="mt-4 max-w-3xl text-4xl font-black leading-tight md:text-6xl">
              Projekte, die im Gedächtnis bleiben.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-7 text-white/60 md:text-right">
            Einblicke in Beschriftung, Außenwerbung und visuelle Markenräume. Ihre eigenen Referenzen lassen sich jederzeit ergänzen.
          </p>
        </div>

        <div className="relative min-h-[520px] overflow-hidden border border-white/15 bg-slate-900 md:min-h-[660px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={project.image}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.035 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            >
              <Image src={project.image} alt={project.title} fill sizes="100vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#071426] via-[#071426]/10 to-black/10" />
            </motion.div>
          </AnimatePresence>

          <div className="absolute inset-x-0 bottom-0 z-10 p-6 md:p-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={project.title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.45 }}
                className="max-w-2xl"
              >
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#67ddff]">{project.category}</p>
                <h3 className="mt-2 text-3xl font-black md:text-5xl">{project.title}</h3>
                <p className="mt-3 max-w-xl text-sm leading-7 text-white/75 md:text-base">{project.description}</p>
              </motion.div>
            </AnimatePresence>

            <div className="mt-7 flex items-center justify-between gap-4">
              <div className="flex gap-2" aria-label="Projekt auswählen">
                {projects.map((item, index) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => setActive(index)}
                    className={`h-1.5 transition-all duration-300 ${index === active ? "w-12 bg-[#67ddff]" : "w-6 bg-white/35 hover:bg-white/70"}`}
                    aria-label={`${item.title} anzeigen`}
                    aria-current={index === active}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={selectPrevious} className="grid h-12 w-12 place-items-center border border-white/25 bg-black/25 text-white backdrop-blur transition hover:border-[#67ddff] hover:bg-[#1155cc]" aria-label="Vorheriges Projekt">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <button type="button" onClick={selectNext} className="grid h-12 w-12 place-items-center border border-white/25 bg-black/25 text-white backdrop-blur transition hover:border-[#67ddff] hover:bg-[#1155cc]" aria-label="Nächstes Projekt">
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
