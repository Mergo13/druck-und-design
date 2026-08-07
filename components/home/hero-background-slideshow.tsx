"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const defaultHeroImages = [
  "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=2200&q=80",
  "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?auto=format&fit=crop&w=2200&q=80",
  "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=2200&q=80"
];

export function HeroBackgroundSlideshow({ images = defaultHeroImages }: { images?: string[] }) {
  const heroImages = images.length ? images : defaultHeroImages;
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % heroImages.length);
    }, 6200);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0">
      <AnimatePresence mode="wait">
        <motion.img
          key={heroImages[active]}
          src={heroImages[active]}
          alt="Druckerei und Designstudio"
          className="absolute inset-0 h-full w-full object-cover"
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(3,10,20,.85),rgba(3,10,20,.45)_48%,rgba(3,10,20,.9))]" />
    </div>
  );
}
