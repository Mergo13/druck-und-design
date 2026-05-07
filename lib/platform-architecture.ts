export const platformArchitecture = {
  services: {
    preflight: "Dateipruefung und Druckdatenvalidierung",
    personalizationEditor: "Konva-basierter Editor mit Layern und Export",
    rendering: "Print-Rendering Pipeline (PDF/X, Vektor, Textil)",
    workflow: "Auftrags- und Produktionsworkflow inkl. Automation-Jobs"
  },
  integrations: {
    nextcloud: "Dateiablage und Produktionsordner",
    erp: "Auftrags- und Rechnungsdaten",
    queue: "Asynchrone Jobs fuer Preflight/Rendering/Sync",
    aiServices: "Text-, Layout- und Designvorschlaege"
  }
} as const;
