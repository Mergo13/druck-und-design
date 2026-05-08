# Infrastruktur Setup (Open Source)

Dieses Projekt nutzt eine Open-Source Basis fuer Kommunikation und Logik:

- Redis 7 (Queue/State)
- NATS 2 (Event-Kommunikation)
- BullMQ (Workflow-Queue auf Redis)
- Pino (strukturiertes Logging)

## Starten

1. Umgebungsvariablen anlegen:

```bash
cp .env.example .env.local
```

2. Services starten:

```bash
docker compose up -d
```

3. App starten:

```bash
npm run dev -- --port 3001
```

## Verifikation

Health:

```bash
curl http://localhost:3001/api/system/health
```

Workflow triggern:

```bash
curl -X POST http://localhost:3001/api/workflows \
  -H "Content-Type: application/json" \
  -d '{"projectId":"projekt-test-1"}'
```

Wenn Redis/NATS laufen, zeigt die Antwort `queueEnabled: true` und `eventPublished: true`.
