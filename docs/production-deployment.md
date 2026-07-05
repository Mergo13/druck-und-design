# Produktions-Deployment

## Voraussetzungen

- Node.js 20 oder neuer
- Persistente libSQL/Turso-Datenbank
- Vercel Blob Store für Produktbilder und Druckdaten
- Stripe-Konto mit konfiguriertem Webhook
- SMTP-Zugang für Admin-2FA und Benachrichtigungen
- CRM Webshop Order API für Kunden- und Rechnungserstellung

## Umgebungsvariablen

Die vollständige Liste steht in `.env.example`. Für Produktion sind mindestens erforderlich:

- `NEXT_PUBLIC_APP_URL`
- `AUTH_SECRET`
- `ADMIN_EMAILS`
- `DATABASE_URL`
- `DATABASE_AUTH_TOKEN`
- `BLOB_READ_WRITE_TOKEN`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_EMAIL`
- `CRM_API_URL`, `CRM_API_TOKEN`

`AUTH_SECRET` muss ein zufälliger Wert mit mindestens 32 Zeichen sein. Geheimnisse niemals in Git speichern.

## Datenbank

Vor dem ersten Start und nach Schemaänderungen:

```bash
npm run db:deploy
```

Der bestehende Produktkatalog wird bei einer leeren Datenbank einmalig aus `data/platform-db.json` übernommen. Legacy-Kundenkonten werden in Produktion nicht importiert.

## Build und Start

```bash
npm ci
npm run deploy:check
npm run db:deploy
npm run typecheck
npm run build
npm start
```

## Stripe

Webhook-Ziel:

```text
https://IHRE-DOMAIN/api/stripe/webhook
```

Mindestens das Event `checkout.session.completed` abonnieren.

## CRM und PDF-Rechnungen

Für die vorhandene CRM-Installation:

```env
CRM_API_URL=https://dud.ussuri-rudd.ts.net/pages/api/shop_order_create.php
CRM_API_TOKEN=TOKEN-AUS-CRM-API-CONNECT
```

Der Token darf ausschließlich serverseitig in `.env` gespeichert werden. Nach erfolgreicher Stripe-Zahlung überträgt der Webhook Kunde, Positionen und Gesamtbetrag an das CRM. Die erwartete Antwort enthält mindestens `invoice_id`, `client_id` und `invoice_number`.

Falls die API-Antwort keine PDF-URL (`pdf_url`, `invoice_pdf`, `download_url` oder `file_url`) liefert, zusätzlich den dokumentierten CRM-PDF-Endpunkt konfigurieren:

```env
CRM_INVOICE_PDF_URL_TEMPLATE=https://dud.ussuri-rudd.ts.net/PDF-ENDPUNKT/{invoice_id}
```

Vor dem Livebetrieb eine Stripe-Testzahlung durchführen und anschließend CRM-Rechnung, Rechnungsnummer und PDF im Kundenkonto prüfen.

## Prüfungen vor Freigabe

1. Admin-Login und E-Mail-2FA testen.
2. Produkt im Admin anlegen, veröffentlichen und im Shop prüfen.
3. Produktbild und Druckdatei hochladen.
4. Testzahlung mit Stripe durchführen.
5. Bestellung, Rechnung und Kundenkonto prüfen.
6. Wartungsmodus und Checkout-Sperre testen.
7. `npm run security:audit` ausführen.

## Wichtiger Sicherheitshinweis

Frühere lokale Konfigurationsdateien enthielten produktionsähnliche Zugangsdaten. Stripe-, CRM-, SMTP- und sonstige Tokens vor dem Deployment rotieren. `dev.db` darf nicht in ein öffentliches Repository oder Deployment-Artefakt gelangen.
