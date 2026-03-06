import { createClient } from "redis";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(
  _req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  const client = createClient({
    url: process.env.REDIS_URL,
  });

  try {
    await client.connect();
    
    // Delete all lottery data keys
    const keys = [
      "rosslotten-prizes",
      "rosslotten-batches",
      "rosslotten-drawn",
      "rosslotten-winners",
    ];
    
    for (const key of keys) {
      await client.del(key);
    }
    
    res.status(200).json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("clear-all error:", message);
    res.status(500).json({ error: message });
  } finally {
    await client.quit();
  }
}
