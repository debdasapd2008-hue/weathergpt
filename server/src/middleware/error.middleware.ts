import type { NextFunction, Request, Response } from "express";

// eslint-style type for error middleware (Express expects an arity-4 signature).
interface HttpErrorLike {
  type?: unknown;
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: `Route not found: ${req.method} ${req.path}` },
  });
}

export function errorHandler(
  err: unknown & HttpErrorLike,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // express.json() throws a SyntaxError with type "entity.parse.failed".
  if (err && typeof err === "object" && err.type === "entity.parse.failed") {
    res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Invalid JSON in request body." },
    });
    return;
  }

  // Log the real error server-side but never leak internals to the client.
  console.error("[server] unexpected error:", err);
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Something went wrong on the server." },
  });
}