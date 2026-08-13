import "dotenv/config";

const required = [
  "NEXT_PUBLIC_APP_URL",
  "AUTH_SECRET",
  "ADMIN_EMAILS",
  "DATABASE_URL",
  "DATABASE_AUTH_TOKEN",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM_EMAIL"
] as const;

const problems: string[] = [];
for (const key of required) {
  const value = process.env[key]?.trim() ?? "";
  if (!value) problems.push(`${key} fehlt.`);
  if (/replace|change-me|example/i.test(value)) problems.push(`${key} enthält noch einen Platzhalter.`);
}

const authSecret = process.env.AUTH_SECRET?.trim() ?? "";
if (authSecret && authSecret.length < 32) {
  problems.push("AUTH_SECRET muss mindestens 32 Zeichen lang sein.");
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "";
if (appUrl && !appUrl.startsWith("https://")) {
  problems.push("NEXT_PUBLIC_APP_URL muss in Produktion HTTPS verwenden.");
}

const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
if (databaseUrl.startsWith("file:")) {
  problems.push("DATABASE_URL darf in Produktion keine lokale SQLite-Datei verwenden.");
}

if (problems.length) {
  console.error("Deployment-Check fehlgeschlagen:");
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}

console.log("Deployment-Check erfolgreich: alle Pflichtvariablen sind plausibel konfiguriert.");
