import type { CoverGeometry, EmbossingLayoutElement } from "./types";

export function safeRect(geometry: CoverGeometry) {
  const x = geometry.safeArea.leftMm;
  const y = geometry.safeArea.topMm;
  const width = Math.max(1, geometry.widthMm - geometry.safeArea.leftMm - geometry.safeArea.rightMm);
  const height = Math.max(1, geometry.heightMm - geometry.safeArea.topMm - geometry.safeArea.bottomMm);
  return { x, y, width, height, right: x + width, bottom: y + height };
}

export function coverZones(geometry: CoverGeometry) {
  const safe = safeRect(geometry);
  return {
    top: {
      x: safe.x,
      y: safe.y,
      width: safe.width,
      height: safe.height * 0.25
    },
    middle: {
      x: safe.x,
      y: safe.y + safe.height * 0.25,
      width: safe.width,
      height: safe.height * 0.45
    },
    bottom: {
      x: safe.x,
      y: safe.y + safe.height * 0.7,
      width: safe.width,
      height: safe.height * 0.3
    }
  } as const;
}

export function elementBounds(element: EmbossingLayoutElement) {
  return {
    left: element.xMm,
    top: element.yMm,
    right: element.xMm + element.widthMm,
    bottom: element.yMm + element.heightMm,
    width: element.widthMm,
    height: element.heightMm
  };
}

export function clampElementToRect<T extends EmbossingLayoutElement>(element: T, rect: { x: number; y: number; width: number; height: number }): T {
  const maxX = rect.x + rect.width - element.widthMm;
  const maxY = rect.y + rect.height - element.heightMm;
  return {
    ...element,
    xMm: Math.min(Math.max(element.xMm, rect.x), Math.max(rect.x, maxX)),
    yMm: Math.min(Math.max(element.yMm, rect.y), Math.max(rect.y, maxY))
  };
}

export function elementsOverlap(a: EmbossingLayoutElement, b: EmbossingLayoutElement, minGapMm = 0) {
  const ab = elementBounds(a);
  const bb = elementBounds(b);
  return !(
    ab.right + minGapMm <= bb.left ||
    bb.right + minGapMm <= ab.left ||
    ab.bottom + minGapMm <= bb.top ||
    bb.bottom + minGapMm <= ab.top
  );
}
