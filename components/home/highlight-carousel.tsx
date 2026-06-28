"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const slides = [
  {
    title: "Premium Flyer",
    text: "Schnelle Produktion, starke Farben und verlässliche Lieferzeiten.",
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1400&q=80"
  },
  {
    title: "Werbetechnik",
    text: "Roll-ups, Schilder und Banner für sofortige Sichtbarkeit.",
    image: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?auto=format&fit=crop&w=1400&q=80"
  },
  {
    title: "Marken Design",
    text: "Konsistente Gestaltung für mehr Vertrauen und mehr Kunden.",
    image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1400&q=80"
  }
];

export function HighlightCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 5200);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-lg border bg-white shadow-premium">
      <div className="relative min-h-[320px] md:min-h-[360px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={slides[active].title}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.75 }}
          >
            <img src={slides[active].image} alt={slides[active].title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(7,10,18,.82),rgba(7,10,18,.36),rgba(7,10,18,.75))]" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white md:p-8">
              <h3 className="text-2xl font-black md:text-3xl">{slides[active].title}</h3>
              <p className="mt-2 max-w-xl text-sm text-white/88 md:text-base">{slides[active].text}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="absolute bottom-4 right-4 flex gap-1.5 rounded-full border border-white/30 bg-black/35 px-2 py-1.5 backdrop-blur">
        {slides.map((slide, index) => (
          <button
            key={slide.title}
            aria-label={slide.title}
            className={index === active ? "h-2 w-6 rounded-full bg-white" : "h-2 w-2 rounded-full bg-white/55"}
            onClick={() => setActive(index)}
          />
        ))}
      </div>
    </div>
  );
}
