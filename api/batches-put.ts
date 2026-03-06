import { createClient } from "redis";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const REDIS_KEY = "rosslotten-batches";

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
    const batches = req.body;

    // Validate it's an array of Batch objects
    if (!Array.isArray(batches) || !batches.every((b) => typeof b.letter === "string" && typeof b.unsoldRaw === "string")) {
      res.status(400).json({ error: "Invalid data format" });
      return;
    }

    await client.set(REDIS_KEY, JSON.stringify(batches));

    res.status(200).json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("batches-put error:", message);
    res.status(500).json({ error: message });
  } finally {
    await client.quit();
  }
}
