import { connect, type NatsConnection } from "nats";

let natsConnection: NatsConnection | null = null;

export async function getNatsConnection() {
  if (natsConnection) return natsConnection;
  const servers = process.env.NATS_URL;
  if (!servers) return null;
  natsConnection = await connect({ servers });
  return natsConnection;
}

export async function publishWorkflowEvent(subject: string, payload: Record<string, string | number | boolean>) {
  const nats = await getNatsConnection();
  if (!nats) return false;
  nats.publish(subject, new TextEncoder().encode(JSON.stringify(payload)));
  return true;
}
