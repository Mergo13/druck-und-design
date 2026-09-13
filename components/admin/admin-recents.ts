"use client";

export type AdminRecentItem = {
  id: string;
  type: string;
  label: string;
  href: string;
  subtitle?: string;
  openedAt: string;
};

const storageKey = "dud-admin-recents";
const maxRecentItems = 10;

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function readAdminRecents(): AdminRecentItem[] {
  if (!canUseStorage()) return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]") as AdminRecentItem[];
    return Array.isArray(parsed) ? parsed.filter((item) => item?.id && item.href && item.label).slice(0, maxRecentItems) : [];
  } catch {
    return [];
  }
}

export function addAdminRecent(item: Omit<AdminRecentItem, "openedAt">) {
  if (!canUseStorage()) return;
  const openedAt = new Date().toISOString();
  const next = [
    { ...item, openedAt },
    ...readAdminRecents().filter((entry) => entry.href !== item.href)
  ].slice(0, maxRecentItems);
  window.localStorage.setItem(storageKey, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("admin-recents-changed"));
}

