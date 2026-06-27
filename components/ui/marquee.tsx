"use client";

import { useCallback, useEffect, useRef } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MarqueeProps extends ComponentPropsWithoutRef<"div"> {
  reverse?: boolean;
  pauseOnHover?: boolean;
  speed?: number;
  vertical?: boolean;
  repeat?: number;
  children: ReactNode;
}

function useAnimationFrame(callback: (delta: number) => void) {
  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);

  const animate = useCallback(
    (time: number) => {
      if (previousTimeRef.current !== null) {
        callback(time - previousTimeRef.current);
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    },
    [callback]
  );

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [animate]);
}

export function Marquee({
  className,
  reverse = false,
  pauseOnHover = false,
  children,
  speed = 50,
  vertical = false,
  repeat = 4,
  ...props
}: MarqueeProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const blockRef = useRef<HTMLDivElement | null>(null);
  const positionRef = useRef(0);
  const pausedRef = useRef(false);

  useAnimationFrame((delta) => {
    if (!contentRef.current || !blockRef.current) return;
    if (pauseOnHover && pausedRef.current) return;

    const contentStyle = window.getComputedStyle(contentRef.current);
    const gap = parseFloat(vertical ? contentStyle.rowGap || "0" : contentStyle.columnGap || "0");
    const blockSize = vertical ? blockRef.current.offsetHeight : blockRef.current.offsetWidth;
    const loopDistance = blockSize + gap;
    const distance = (speed * delta) / 1000;
    positionRef.current += reverse ? distance : -distance;

    if (Math.abs(positionRef.current) >= loopDistance) {
      positionRef.current %= loopDistance;
    }

    contentRef.current.style.transform = vertical
      ? `translateY(${positionRef.current}px)`
      : `translateX(${positionRef.current}px)`;
  });

  return (
    <div
      {...props}
      className={cn(
        "group flex overflow-hidden p-2 [--gap:1.25rem] [gap:var(--gap)]",
        vertical ? "flex-col" : "flex-row",
        className
      )}
      onMouseEnter={() => {
        if (pauseOnHover) pausedRef.current = true;
      }}
      onMouseLeave={() => {
        if (pauseOnHover) pausedRef.current = false;
      }}
    >
      <div
        ref={contentRef}
        className={cn("flex shrink-0 justify-around [gap:var(--gap)]", vertical ? "flex-col" : "flex-row")}
      >
        {Array.from({ length: repeat }).map((_, i) => (
          <div key={i} ref={i === 0 ? blockRef : null} className="flex gap-5">
            {children}
          </div>
        ))}
      </div>
    </div>
  );
}
