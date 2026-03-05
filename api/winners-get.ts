import { createClient } from "redis";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const REDIS_KEY = "rosslotten-winners";

export default async function handler(
  _req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  const client = createClient({
    url: process.env.REDIS_URL,
  });

  try {
    await client.connect();
    const data = await client.get(REDIS_KEY);

    if (!data) {
      res.status(404).json({ data: null });
      return;
    }

    res.status(200).json({ data: JSON.parse(data) });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("winners-get error:", message);
    res.status(500).json({ data: null });
  } finally {
    await client.quit();
  }
}
