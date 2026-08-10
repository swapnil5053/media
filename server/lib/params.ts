import type { Request } from "express";

/** Express types route params as `string | string[]`; every route here wants the single value. */
export function param(req: Request, name: string): string {
  const value = (req.params as Record<string, string | string[] | undefined>)[name];
  return Array.isArray(value) ? value.join("/") : (value ?? "");
}
