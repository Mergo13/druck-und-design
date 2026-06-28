"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

export interface VisualServiceItem {
  title: string;
  label: string;
  text: string;
  image: string;
}

export function VisualServiceShowcase({ items }: { items: VisualServiceItem[] }) {
  const [active, setActive] = useState(0);
  const selected = items[active];

  return (
    <div className="grid overflow-hidden border-y border-slate-200 bg-white lg:grid-cols-[minmax(300px,.72fr)_1.28fr]">
      <div className="flex flex-col justify-center px-6 py-8 md:px-10 lg:py-14">
        {items.map((item, index) => (
          <button
            key={item.title}
            type="button"
            onClick={() => setActive(index)}
            className={`group flex min-h-24 items-center justify-between gap-5 border-b border-slate-200 py-5 text-left transition-colors last:border-0 ${
              active === index ? "text-brand-blue" : "text-slate-500 hover:text-brand-ink"
            }`}
          >
            <span>
              <span className="block text-xs font-bold uppercase tracking-[0.16em]">{item.label}</span>
              <span className="mt-1 block text-2xl font-black text-current md:text-3xl">{item.title}</span>
            </span>
            <ArrowUpRight className={`h-6 w-6 shrink-0 transition-transform ${active === index ? "rotate-45" : "group-hover:translate-x-1 group-hover:-translate-y-1"}`} />
          </button>
        ))}
      </div>

      <div className="relative min-h-[430px] overflow-hidden bg-slate-950 md:min-h-[560px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={selected.image}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image src={selected.image} alt={selected.title} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent" />
            <motion.p
              className="absolute bottom-0 max-w-xl p-7 text-lg font-semibold leading-7 text-white md:p-10 md:text-2xl md:leading-9"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
            >
              {selected.text}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
