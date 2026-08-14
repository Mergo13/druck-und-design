import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { HomepageSettings } from "@/types/print-platform";

export const defaultHomepageSettings: HomepageSettings = {
  bestsellerEnabled: true,
  bestsellerTitle: "Unsere beliebtesten Produkte",
  bestsellerSubtitle: "Bestseller",
  bestsellerSortOrder: 30,
  studentShopEnabled: true,
  studentShopTitle: "Studenten Shop & Druckservice",
  studentShopDescription: "Abschlussarbeiten, Skripten, Bindungen & Poster - schnell und direkt in Wels.",
  studentShopImage: "/uploads/drucken.jpg",
  studentShopLink: "/studenten",
  studentShopSortOrder: 50,
  googleReviewsEnabled: true,
  googleReviewsTitle: "Google Bewertungen",
  googleReviewsSubtitle: "Erfahrungen unserer Kunden",
  googleReviewsSortOrder: 70
};

function normalizeHomepageSettings(data: Partial<HomepageSettings> | null | undefined): HomepageSettings {
  return {
    ...defaultHomepageSettings,
    ...(data ?? {}),
    bestsellerEnabled: data?.bestsellerEnabled ?? defaultHomepageSettings.bestsellerEnabled,
    studentShopEnabled: data?.studentShopEnabled ?? defaultHomepageSettings.studentShopEnabled,
    googleReviewsEnabled: data?.googleReviewsEnabled ?? defaultHomepageSettings.googleReviewsEnabled
  };
}

export async function getHomepageSettings() {
  const row = await prisma.homepageSetting.findUnique({ where: { id: "homepage" } }).catch(() => null);
  return normalizeHomepageSettings(row?.data as Partial<HomepageSettings> | null | undefined);
}

export async function upsertHomepageSettings(settings: HomepageSettings) {
  const next = normalizeHomepageSettings(settings);
  const row = await prisma.homepageSetting.upsert({
    where: { id: "homepage" },
    update: { data: next as Prisma.InputJsonValue },
    create: { id: "homepage", data: next as Prisma.InputJsonValue }
  });
  return normalizeHomepageSettings(row.data as Partial<HomepageSettings>);
}
