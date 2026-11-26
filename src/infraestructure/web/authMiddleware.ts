//es nuestro intermediario que se ejecuta antes de llegar a la ruta final, interceptar la peticion desde el cliente y validar qeu el token qeu trae es valido como lo pide el endpoint
import { Request, Response, NextFunction } from "express";
import { AuthApplication } from "../../application/AuthApplication.js";
import { AuthPayload } from "../../domain/Auth.js";
import { fail } from "./response.js";

// Se extiende Request para tipar el usuario autenticado (sin usar "as any")
declare global {
    namespace Express {
        interface Request {
            user?: AuthPayload;
        }
    }
}

export function authenticateToken(req: Request, res: Response, next: NextFunction):
    void {
    const authHeader = req.headers["authorization"];
    const [scheme, token] = authHeader?.split(" ") ?? [];
    if (scheme !== "Bearer" || !token) {
        fail(res, 401, "Debes iniciar sesión: falta el token (Authorization: Bearer <token>)");
        return;
    }

    try {
        req.user = AuthApplication.verifyToken(token);
        next();
    } catch (error) {
        fail(res, 401, "Token inválido o expirado");
        return;
    }
}

// Restringe la ruta a los roles indicados. Debe usarse después de authenticateToken.
export function authorizeRoles(...roles: AuthPayload["rol"][]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user || !roles.includes(req.user.rol)) {
            fail(res, 403, "No tienes permisos para realizar esta acción");
            return;
        }
        next();
    };
}

// ---- Helpers de autorización para los controladores ----

export const isAdmin = (req: Request): boolean => req.user?.rol === "admin";

// true si el usuario autenticado es el dueño del recurso o es admin
export const canAccess = (req: Request, ownerId: number): boolean =>
    isAdmin(req) || req.user?.id === ownerId;

export const forbidden = (res: Response): Response =>
    fail(res, 403, "No tienes permisos para acceder a este recurso");
