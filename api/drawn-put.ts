import { createClient } from "redis";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const REDIS_KEY = "rosslotten-drawn";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== "PUT") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const client = createClient({
    url: process.env.REDIS_URL,
  });

  try {
    await client.connect();
    const data = JSON.stringify(req.body);
    await client.set(REDIS_KEY, data);
    res.status(200).json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("drawn-put error:", message);
    res.status(500).json({ error: message });
  } finally {
    await client.quit();
  }
}
