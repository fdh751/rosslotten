import { put } from "@vercel/blob";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  api: {
    bodyParser: false,
  },
};

const BLOB_NAME = "rosslotten-winners";

function readBody(req: VercelRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk: Buffer) => { data += chunk.toString(); });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const raw = await readBody(req);

    // Validate it's parseable JSON before storing
    JSON.parse(raw);

    await put(BLOB_NAME, raw, {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("winners-put error:", message);
    res.status(500).json({ error: message });
  }
}
