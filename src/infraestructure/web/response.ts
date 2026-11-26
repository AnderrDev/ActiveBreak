/*
Formato estándar de TODAS las respuestas de la API.

Éxito:  { "success": true,  "message": "Meta creada exitosamente", "data": { ... } }
Error:  { "success": false, "message": "Datos inválidos", "errors": ["La duración debe estar entre 1 y 30 minutos"] }

- El código HTTP se mantiene (201, 400, 404, 409...): el formato no lo reemplaza.
- "data" lleva el registro, la lista o null (por ejemplo al eliminar).
- "errors" siempre es una lista; trae el detalle de cada dato inválido y va vacía en los demás errores.
*/
import { Response } from "express";

export interface RespuestaExito<T> {
    success: true;
    message: string;
    data: T;
}

export interface RespuestaError {
    success: false;
    message: string;
    errors: string[];
}

export const ok = <T>(res: Response, data: T, message: string, status = 200): Response => {
    const body: RespuestaExito<T> = { success: true, message, data };
    return res.status(status).json(body);
};

export const created = <T>(res: Response, data: T, message: string): Response =>
    ok(res, data, message, 201);

export const fail = (res: Response, status: number, message: string, errors: string[] = []): Response => {
    const body: RespuestaError = { success: false, message, errors };
    return res.status(status).json(body);
};
