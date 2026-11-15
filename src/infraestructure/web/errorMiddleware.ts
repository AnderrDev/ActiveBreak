// Manejo centralizado de errores: traduce errores de dominio a respuestas HTTP
// y evita filtrar detalles internos (BD, stack) al cliente.
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

const statusFor = (error: DomainError): number => {
    if (error instanceof ValidationError) return 400;
    if (error instanceof UnauthorizedError) return 401;
    if (error instanceof ForbiddenError) return 403;
    if (error instanceof NotFoundError) return 404;
    if (error instanceof ConflictError) return 409;
    return 400;
};

// Códigos de error de PostgreSQL que provienen de datos del cliente
const PG_UNIQUE_VIOLATION = "23505";
const PG_FOREIGN_KEY_VIOLATION = "23503";

// Rutas que no existen
export function notFoundHandler(req: Request, res: Response): void {
    res.status(404).json({ error: "Ruta no encontrada" });
}

// Debe registrarse después de todas las rutas (Express lo reconoce por sus 4 parámetros)
export function errorHandler(error: unknown, req: Request, res: Response, next: NextFunction): void {
    if (res.headersSent) {
        next(error);
        return;
    }

    if (error instanceof DomainError) {
        res.status(statusFor(error)).json({ error: error.message });
        return;
    }

    // Restricciones de la BD (por ejemplo, dos registros simultáneos con el mismo correo)
    if (error instanceof QueryFailedError) {
        const code = (error.driverError as { code?: string } | undefined)?.code;
        if (code === PG_UNIQUE_VIOLATION) {
            res.status(409).json({ error: "El registro ya existe" });
            return;
        }
        if (code === PG_FOREIGN_KEY_VIOLATION) {
            res.status(400).json({ error: "El registro hace referencia a datos inexistentes" });
            return;
        }
    }

    // Errores del parser de JSON de Express (cuerpo mal formado, demasiado grande, etc.)
    const status = (error as { status?: unknown } | null)?.status;
    if (typeof status === "number" && status >= 400 && status < 500) {
        res.status(status).json({ error: "Petición inválida" });
        return;
    }

    // Cualquier otro error es interno: se registra en el servidor y no se expone
    console.error("Error no controlado:", error);
    res.status(500).json({ error: "Error interno del servidor" });
}
