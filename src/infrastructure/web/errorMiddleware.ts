// Centralized error handling: translates domain errors into HTTP responses with the
// standard format { success: false, message, errors } (see web/response.ts)
// and never leaks internal details (database, stack) to the client.
import { Request, Response, NextFunction } from "express";
import { QueryFailedError } from "typeorm";
import {
    ConflictError,
    DomainError,
    ForbiddenError,
    NotFoundError,
    UnauthorizedError,
    ValidationError
} from "../../domain/errors.js";
import { fail } from "./response.js";

const statusFor = (error: DomainError): number => {
    if (error instanceof ValidationError) return 400;
    if (error instanceof UnauthorizedError) return 401;
    if (error instanceof ForbiddenError) return 403;
    if (error instanceof NotFoundError) return 404;
    if (error instanceof ConflictError) return 409;
    return 400;
};

// PostgreSQL error codes caused by client data
const PG_UNIQUE_VIOLATION = "23505";
const PG_FOREIGN_KEY_VIOLATION = "23503";

// Routes that do not exist
export function notFoundHandler(req: Request, res: Response): void {
    fail(res, 404, "Ruta no encontrada");
}

// Must be registered after every route (Express recognizes it by its 4 parameters)
export function errorHandler(error: unknown, req: Request, res: Response, next: NextFunction): void {
    if (res.headersSent) {
        next(error);
        return;
    }

    if (error instanceof DomainError) {
        const details = error instanceof ValidationError ? error.details : [];
        fail(res, statusFor(error), error.message, details);
        return;
    }

    // Database constraints (e.g. two simultaneous registrations with the same email)
    if (error instanceof QueryFailedError) {
        const code = (error.driverError as { code?: string } | undefined)?.code;
        if (code === PG_UNIQUE_VIOLATION) {
            fail(res, 409, "El registro ya existe");
            return;
        }
        if (code === PG_FOREIGN_KEY_VIOLATION) {
            fail(res, 400, "El registro hace referencia a datos inexistentes");
            return;
        }
    }

    // Errors of the Express JSON parser (malformed body, too large...)
    const status = (error as { status?: unknown } | null)?.status;
    if (typeof status === "number" && status >= 400 && status < 500) {
        fail(res, status, "Petición inválida: el cuerpo debe ser un JSON válido de máximo 100 kb");
        return;
    }

    // Any other error is internal: it is logged on the server and not exposed
    console.error("Unhandled error:", error);
    fail(res, 500, "Error interno del servidor");
}
