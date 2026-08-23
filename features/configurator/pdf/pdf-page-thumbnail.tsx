"use client";

import { useEffect, useState } from "react";

export function PdfPageThumbnail({ pageNumber, getThumbnail, label }: { pageNumber: number; getThumbnail: (pageNumber: number) => Promise<string>; label?: string }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    let active = true;
    setSrc("");
    void getThumbnail(pageNumber).then((thumbnail) => {
      if (active) setSrc(thumbnail);
    });
    return () => {
      active = false;
    };
  }, [getThumbnail, pageNumber]);

  return (
    <div className="overflow-hidden rounded-md border bg-white">
      <div className="flex aspect-[3/4] items-center justify-center bg-slate-100">
        {src ? <img src={src} alt={label ?? `PDF Seite ${pageNumber}`} className="h-full w-full object-contain" /> : <span className="text-xs font-bold text-slate-400">Seite {pageNumber}</span>}
      </div>
      <div className="border-t px-2 py-1 text-center text-[11px] font-bold text-slate-600">{label ?? pageNumber}</div>
    </div>
  );
}
