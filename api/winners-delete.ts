import { list, del } from "@vercel/blob";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const BLOB_NAME = "rosslotten-winners";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== "DELETE") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { blobs } = await list({ prefix: BLOB_NAME });
    const blob = blobs.find((b) => b.pathname === BLOB_NAME);

    if (blob) {
      await del(blob.url);
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("winners-delete error:", err);
    res.status(500).json({ error: "Failed to delete" });
  }
}
