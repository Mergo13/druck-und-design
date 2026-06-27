"use client";

import { useEffect, useState } from "react";

export function MovingGridBackground() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const x = event.clientX - window.innerWidth / 2;
      const y = event.clientY - window.innerHeight / 2;
      setMousePosition({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      aria-hidden
      className="absolute inset-0 overflow-hidden"
      style={{
        backgroundImage:
          "linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        animation: "moveGrid 20s linear infinite",
        transform: `translate(${mousePosition.x / 30}px, ${mousePosition.y / 30}px)`,
      }}
    >
      <div className="absolute left-1/2 top-1/2 h-[55vmin] w-[55vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/20 blur-[150px]" />
      <style>{`
        @keyframes moveGrid {
          0% { background-position: 0 0; }
          100% { background-position: 80px 80px; }
        }
      `}</style>
    </div>
  );
}
