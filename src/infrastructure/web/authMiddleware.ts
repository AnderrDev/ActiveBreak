// Runs before the route handler: validates the JWT and the role of the user
import { Request, Response, NextFunction } from "express";
import { AuthApplication } from "../../application/AuthApplication.js";
import { AuthPayload } from "../../domain/Auth.js";
import { fail } from "./response.js";

// Request is extended to type the authenticated user (no "as any")
declare global {
    namespace Express {
        interface Request {
            user?: AuthPayload;
        }
    }
}

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
    const [scheme, token] = req.headers["authorization"]?.split(" ") ?? [];
    if (scheme !== "Bearer" || !token) {
        fail(res, 401, "Debes iniciar sesión: falta el token (Authorization: Bearer <token>)");
        return;
    }

    try {
        req.user = AuthApplication.verifyToken(token);
        next();
    } catch {
        fail(res, 401, "Token inválido o expirado");
    }
}

// Restricts the route to the given roles. Must be used after authenticateToken.
export function authorizeRoles(...roles: AuthPayload["role"][]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user || !roles.includes(req.user.role)) {
            fail(res, 403, "No tienes permisos para realizar esta acción");
            return;
        }
        next();
    };
}

// ---- Authorization helpers for the controllers ----

export const isAdmin = (req: Request): boolean => req.user?.role === "admin";

// True when the authenticated user owns the resource or is an admin
export const canAccess = (req: Request, ownerId: number): boolean =>
    isAdmin(req) || req.user?.id === ownerId;

export const forbidden = (res: Response): Response =>
    fail(res, 403, "No tienes permisos para acceder a este recurso");
