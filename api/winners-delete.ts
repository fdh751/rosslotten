import { redis } from "@vercel/redis";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const REDIS_KEY = "rosslotten-winners";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== "DELETE") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    await redis.del(REDIS_KEY);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("winners-delete error:", err);
    res.status(500).json({ error: "Failed to delete" });
  }
}
