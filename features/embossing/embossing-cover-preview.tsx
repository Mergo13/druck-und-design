"use client";

import type { EmbossingColor, EmbossingResolvedLayout } from "@/lib/embossing/types";
import { fontSizeMm } from "@/lib/embossing/typography";

function previewFill(color: EmbossingColor) {
  if (color === "silber") return "#c9ced6";
  if (color === "blind") return "#1f2937";
  return "#c9982f";
}

function canPreviewLogo(url: string) {
  return /\.(svg|png|jpe?g|webp|gif)(?:[?#].*)?$/i.test(url);
}

export function EmbossingCoverPreview({ layout, color, showGuides = true }: { layout: EmbossingResolvedLayout; color: EmbossingColor; showGuides?: boolean }) {
  const fill = previewFill(color);
  const { coverGeometry } = layout;
  const safe = coverGeometry.safeArea;
  const safeWidth = coverGeometry.widthMm - safe.leftMm - safe.rightMm;
  const safeHeight = coverGeometry.heightMm - safe.topMm - safe.bottomMm;
  return (
    <svg viewBox={`0 0 ${coverGeometry.widthMm} ${coverGeometry.heightMm}`} preserveAspectRatio="xMidYMid meet" className="h-full w-full rounded-md bg-[#151515] shadow-inner" role="img" aria-label="Prägecover Vorschau">
      <rect x="0" y="0" width={coverGeometry.widthMm} height={coverGeometry.heightMm} fill="#101010" />
      {showGuides ? (
        <>
          <rect x={safe.leftMm} y={safe.topMm} width={safeWidth} height={safeHeight} fill="none" stroke="#6ee7b7" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.7" />
          <line x1={coverGeometry.widthMm / 2} x2={coverGeometry.widthMm / 2} y1={safe.topMm} y2={safe.topMm + safeHeight} stroke="#94a3b8" strokeWidth="0.35" strokeDasharray="2 3" opacity="0.5" />
        </>
      ) : null}
      {layout.elements.map((element, index) => {
        if (element.type === "logo") {
          return (
            <g key={index}>
              {canPreviewLogo(element.url) ? (
                <image
                  href={element.url}
                  x={element.xMm}
                  y={element.yMm}
                  width={element.widthMm}
                  height={element.heightMm}
                  preserveAspectRatio="xMidYMid meet"
                  opacity="0.95"
                />
              ) : (
                <>
                  <rect x={element.xMm} y={element.yMm} width={element.widthMm} height={element.heightMm} fill="none" stroke={fill} strokeWidth="0.5" opacity="0.85" />
                  <text x={element.xMm + element.widthMm / 2} y={element.yMm + element.heightMm / 2} textAnchor="middle" dominantBaseline="middle" fontFamily="Helvetica, Arial, sans-serif" fontSize="3.6" fontWeight="700" fill={fill}>Logo-Datei</text>
                </>
              )}
            </g>
          );
        }
        const textAnchor = element.alignment === "left" ? "start" : element.alignment === "right" ? "end" : "middle";
        const x = element.alignment === "left" ? element.xMm : element.alignment === "right" ? element.xMm + element.widthMm : element.xMm + element.widthMm / 2;
        return element.lines.map((line, lineIndex) => (
          <text
            key={`${index}-${lineIndex}`}
            x={x}
            y={element.yMm + (lineIndex + 0.82) * element.lineHeightMm}
            textAnchor={textAnchor}
            fontFamily={element.fontStyle === "classic" ? "Times New Roman, Times, serif" : "Helvetica, Arial, sans-serif"}
            fontSize={fontSizeMm(element.fontSizePt)}
            fontWeight={element.weight}
            letterSpacing={`${element.letterSpacingMm}mm`}
            fill={fill}
          >
            {line}
          </text>
        ));
      })}
    </svg>
  );
}
