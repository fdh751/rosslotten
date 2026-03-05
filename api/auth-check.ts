import { createClient } from "redis";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const REDIS_KEY = "rosslotten-auth";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const client = createClient({
    url: process.env.REDIS_URL,
  });

  try {
    await client.connect();
    const authData = await client.get(REDIS_KEY);
    res.status(200).json({ requiresAuth: !!authData });
  } catch (error) {
    res.status(500).json({ error: "Failed to check auth status" });
  } finally {
    await client.quit();
  }
}
