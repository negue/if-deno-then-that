
import { Request } from "https://deno.land/x/oak/mod.ts";

export async function getResultJsonOrText(
  res: Response,
): Promise<Record<string, unknown> | string> {
  try {
    return await res.json();
  } catch {
    return await res.text();
  }
}

export async function getOakRequestJsonOrText(
  req: Request,
): Promise<Record<string, unknown> | string | undefined> {
  if (req.method === "GET" || !req.hasBody) {
    return;
  }

  const body = await req.body();

  if (body.type === 'json' || body.type === 'text') {
    return await body.value;
  } 
}
