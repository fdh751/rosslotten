import { createClient } from "redis";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import bcrypt from "bcryptjs";

const REDIS_KEY = "rosslotten-auth";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }

  const client = createClient({
    url: process.env.REDIS_URL,
  });

  try {
    await client.connect();
    const authData = await client.get(REDIS_KEY);

    if (!authData) {
      res.status(401).json({ error: "No credentials configured" });
      return;
    }

    const { username: storedUsername, passwordHash } = JSON.parse(authData);

    if (username !== storedUsername) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const isValid = await bcrypt.compare(password, passwordHash);

    if (!isValid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // Generate a simple session token (in production, use proper JWT or sessions)
    const sessionToken = Buffer.from(`${username}:${Date.now()}`).toString(
      "base64"
    );

    res.status(200).json({ success: true, sessionToken });
  } catch (error) {
    res.status(500).json({ error: "Authentication failed" });
  } finally {
    await client.quit();
  }
}
