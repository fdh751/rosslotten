import { list } from "@vercel/blob";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const BLOB_NAME = "rosslotten-winners";

export default async function handler(
  _req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  try {
    const { blobs } = await list({ prefix: BLOB_NAME });
    const blob = blobs.find((b) => b.pathname === BLOB_NAME);

    if (!blob) {
      res.status(404).json({ data: null });
      return;
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const response = await fetch(blob.url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Blob fetch failed: ${response.status} ${text}`);
    }

    const data = await response.json();
    res.status(200).json({ data });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("winners-get error:", message);
    res.status(500).json({ data: null });
  }
}
