"use client";

import type { EmbossingColor, EmbossingResolvedLayout } from "@/lib/embossing/types";

function previewFill(color: EmbossingColor) {
  if (color === "silber") return "#c9ced6";
  if (color === "blind") return "#1f2937";
  return "#c9982f";
}

export function EmbossingCoverPreview({ layout, color, showGuides = true }: { layout: EmbossingResolvedLayout; color: EmbossingColor; showGuides?: boolean }) {
  const fill = previewFill(color);
  const { coverGeometry } = layout;
  const safe = coverGeometry.safeArea;
  const safeWidth = coverGeometry.widthMm - safe.leftMm - safe.rightMm;
  const safeHeight = coverGeometry.heightMm - safe.topMm - safe.bottomMm;
  return (
    <svg viewBox={`0 0 ${coverGeometry.widthMm} ${coverGeometry.heightMm}`} className="h-full w-full rounded-md bg-[#151515] shadow-inner" role="img" aria-label="Prägecover Vorschau">
      <rect x="0" y="0" width={coverGeometry.widthMm} height={coverGeometry.heightMm} fill="#101010" />
      {showGuides ? (
        <>
          <rect x={safe.leftMm} y={safe.topMm} width={safeWidth} height={safeHeight} fill="none" stroke="#6ee7b7" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.7" />
          <line x1={coverGeometry.widthMm / 2} x2={coverGeometry.widthMm / 2} y1={safe.topMm} y2={safe.topMm + safeHeight} stroke="#94a3b8" strokeWidth="0.35" strokeDasharray="2 3" opacity="0.5" />
        </>
      ) : null}
      {layout.elements.map((element, index) => {
        if (element.type === "logo") {
          return <rect key={index} x={element.xMm} y={element.yMm} width={element.widthMm} height={element.heightMm} fill={fill} opacity="0.85" />;
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
            fontSize={`${element.fontSizePt}pt`}
            fontWeight={element.weight}
            fill={fill}
          >
            {line}
          </text>
        ));
      })}
    </svg>
  );
}
