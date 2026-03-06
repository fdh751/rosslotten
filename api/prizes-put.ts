import { createClient } from "redis";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const REDIS_KEY = "rosslotten-prizes";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const client = createClient({
    url: process.env.REDIS_URL,
  });

  try {
    await client.connect();
    const prizes = req.body;

    // Validate it's an array of Prize objects
    if (!Array.isArray(prizes) || !prizes.every((p) => typeof p.label === "string")) {
      res.status(400).json({ error: "Invalid data format" });
      return;
    }

    await client.set(REDIS_KEY, JSON.stringify(prizes));

    res.status(200).json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("prizes-put error:", message);
    res.status(500).json({ error: message });
  } finally {
    await client.quit();
  }
}
