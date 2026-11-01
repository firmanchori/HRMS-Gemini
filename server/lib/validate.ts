import type { Request, Response, NextFunction } from "express";
import { z, type ZodSchema } from "zod";

/** Rejects with 400 on anything that doesn't match — the schema is the sanitizer (trim/lowercase/length caps belong in the schema itself). */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Input tidak valid", details: result.error.flatten() });
    }
    req.body = result.data;
    next();
  };
}

/** Same idea for route params (e.g. rejecting a malformed :id before it ever reaches a query). */
export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({ error: "Parameter tidak valid", details: result.error.flatten() });
    }
    next();
  };
}

/** Same idea for querystring params (pagination/search/filter) — req.query values arrive as strings, so the schema should coerce (e.g. z.coerce.number()). */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({ error: "Parameter tidak valid", details: result.error.flatten() });
    }
    req.query = result.data as unknown as Request["query"];
    next();
  };
}

export const uuidParam = (name: string) => z.object({ [name]: z.string().uuid() });
