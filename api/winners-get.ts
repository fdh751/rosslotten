import { head } from "@vercel/blob";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const BLOB_NAME = "rosslotten-winners";

export default async function handler(
  _req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  try {
    // List blobs to find the one matching our name
    const { list } = await import("@vercel/blob");
    const { blobs } = await list({ prefix: BLOB_NAME });
    const blob = blobs.find((b) => b.pathname === BLOB_NAME);

    if (!blob) {
      res.status(404).json({ data: null });
      return;
    }

    // Fetch the content from the blob URL
    const response = await fetch(blob.url);
    const data = await response.json();
    res.status(200).json({ data });
  } catch (err) {
    console.error("winners-get error:", err);
    res.status(500).json({ data: null });
  }
}
