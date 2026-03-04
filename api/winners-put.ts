import { put } from "@vercel/blob";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const BLOB_NAME = "rosslotten-winners";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);

    await put(BLOB_NAME, body, {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("winners-put error:", err);
    res.status(500).json({ error: "Failed to save" });
  }
}
