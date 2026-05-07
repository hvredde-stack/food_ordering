// Tiny helpers for API routes.

import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 });
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function serverError(message = "Internal server error") {
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function parseJson<T>(req: Request, schema: ZodSchema<T>): Promise<
  | { ok: true; data: T }
  | { ok: false; response: ReturnType<typeof badRequest> }
> {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    return { ok: true, data };
  } catch (err) {
    if (err instanceof ZodError) {
      return { ok: false, response: badRequest("Invalid request body", err.flatten()) };
    }
    return { ok: false, response: badRequest("Invalid JSON") };
  }
}
