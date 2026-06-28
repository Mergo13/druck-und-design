"use client";

import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";

type PricingPlan = {
  name: string;
  price: string;
  description: string;
  features: string[];
  popular?: boolean;
};

const plans: PricingPlan[] = [
  {
    name: "Starter",
    price: "€990",
    description: "Fuer einen schnellen professionellen Webauftritt mit solider Basis.",
    features: [
      "One-Page-Website",
      "Mobil optimiert",
      "Kontaktformular",
      "Basis-SEO"
    ]
  },
  {
    name: "Business",
    price: "€2490",
    description: "Ideal fuer Unternehmen mit mehr Inhalten, Reichweite und Wachstum.",
    popular: true,
    features: [
      "Bis zu 10 Seiten",
      "CMS-Integration",
      "SEO-Einrichtung",
      "Google Analytics",
      "Blog-System"
    ]
  },
  {
    name: "Premium",
    price: "€4990+",
    description: "Massgeschneiderte Softwareloesungen und digitale Prozessautomatisierung.",
    features: [
      "Individuelle Software",
      "CRM-Integration",
      "Kundenportal",
      "Buchungssystem",
      "API-Integrationen"
    ]
  }
];

const serviceTags = [
  "Homepage-Entwicklung",
  "Unternehmenswebsites",
  "Individuelle Webanwendungen",
  "CRM-Systeme",
  "Buchungssysteme",
  "SEO-Optimierung"
];

export function WerbeagenturPricingSection() {
  return (
    <section className="bg-slate-950 py-20 text-white">
      <div className="container-page">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-200">
            <Sparkles className="h-3.5 w-3.5" />
            Webentwicklung Preise
          </p>
          <h2 className="mt-4 text-3xl font-black md:text-5xl">Premium Pakete fuer Webprojekte</h2>
          <p className="mt-4 text-sm text-slate-300 md:text-base">Sera-inspirierte Preisstruktur mit klarem Leistungsumfang, skalierbar von Website bis individueller Software.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {serviceTags.map((tag) => (
              <span key={tag} className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-slate-200">{tag}</span>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.article
              key={plan.name}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              whileHover={{ y: -6, scale: 1.01 }}
              className={plan.popular
                ? "relative overflow-hidden rounded-lg border border-cyan-300/45 bg-white/15 p-6 shadow-[0_20px_60px_rgba(34,211,238,0.2)] backdrop-blur-xl"
                : "relative overflow-hidden rounded-lg border border-white/20 bg-white/10 p-6 shadow-[0_14px_40px_rgba(15,23,42,0.45)] backdrop-blur-xl"}
            >
              {plan.popular ? (
                <div className="absolute right-4 top-4 rounded-full bg-cyan-300 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-950">
                  Beliebtester Plan
                </div>
              ) : null}
              <p className="text-sm font-semibold text-cyan-200">{plan.name}</p>
              <p className="mt-2 text-4xl font-black">{plan.price}</p>
              <p className="mt-2 min-h-10 text-sm text-slate-300">{plan.description}</p>
              <ul className="mt-5 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-slate-100">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400/20 text-cyan-200">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className={plan.popular
                  ? "mt-6 h-10 w-full rounded-md bg-cyan-300 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
                  : "mt-6 h-10 w-full rounded-md border border-white/30 bg-white/10 text-sm font-bold text-white transition hover:bg-white/20"}
              >
                Angebot anfragen
              </button>
            </motion.article>
          ))}
        </div>

        <p className="mx-auto mt-8 max-w-4xl rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-center text-sm text-slate-200">
          Fuer oesterreichische Unternehmen koennen bei Digitalisierungsprojekten wie Unternehmenswebsites, Online-Shops, CRM-Systemen, Kundenportalen, Prozessautomatisierung und individuellen Softwareloesungen unter Umstaenden Foerderungen moeglich sein.
          Die tatsaechliche Foerderfaehigkeit haengt immer vom konkreten Projekt und vom jeweiligen Unternehmen ab.
        </p>
      </div>
    </section>
  );
}
