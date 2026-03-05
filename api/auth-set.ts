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

  const { username, password, currentPassword } = req.body;

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

    // If credentials already exist, require current password to change them
    if (authData) {
      const { password: storedPasswordHash } = JSON.parse(authData);
      if (!currentPassword) {
        res.status(400).json({ error: "Current password required to update" });
        return;
      }

      const isValid = await bcrypt.compare(currentPassword, storedPasswordHash);
      if (!isValid) {
        res.status(401).json({ error: "Current password is incorrect" });
        return;
      }
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(password, 10);

    const newAuthData = {
      username,
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    await client.set(REDIS_KEY, JSON.stringify(newAuthData));

    res.status(200).json({ success: true, message: "Credentials updated" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update credentials" });
  } finally {
    await client.quit();
  }
}
