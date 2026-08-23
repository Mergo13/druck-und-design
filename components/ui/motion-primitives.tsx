"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn, formatEuro } from "@/lib/utils";

export function MotionSection({ children, className }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={cn(className)}
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export function MotionCard({ children, className, selected = false }: { children: ReactNode; className?: string; selected?: boolean }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      layout={!reduceMotion}
      className={cn(className)}
      whileHover={reduceMotion ? undefined : { y: -1 }}
      whileTap={reduceMotion ? undefined : { scale: 0.99 }}
      data-selected={selected ? "true" : "false"}
      transition={{ duration: 0.18 }}
    >
      {children}
    </motion.div>
  );
}

export function MotionSelection({ selected, children }: { selected: boolean; children?: ReactNode }) {
  const reduceMotion = useReducedMotion();
  return (
    <AnimatePresence initial={false}>
      {selected ? (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-md border-2 border-brand-blue"
          layoutId={reduceMotion ? undefined : "dud-selection"}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {children}
        </motion.span>
      ) : null}
    </AnimatePresence>
  );
}

export function AnimatedPrice({ value, className }: { value: number; className?: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={formatEuro(value)}
        className={cn("inline-block tabular-nums", className)}
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
        transition={{ duration: 0.18 }}
      >
        {formatEuro(value)}
      </motion.span>
    </AnimatePresence>
  );
}
