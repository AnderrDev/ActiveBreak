/*
Standard format of EVERY API response.

Success: { "success": true,  "message": "Meta creada exitosamente", "data": { ... } }
Error:   { "success": false, "message": "Datos inválidos", "errors": ["La duración debe estar entre 1 y 30 minutos"] }

- The HTTP status code is kept (201, 400, 404, 409...): the format does not replace it.
- "data" holds the record, the list, or null (for example after a delete).
- "errors" is always a list: one message per invalid field, empty for other errors.
*/
import { Response } from "express";

export interface SuccessResponse<T> {
    success: true;
    message: string;
    data: T;
}

export interface ErrorResponse {
    success: false;
    message: string;
    errors: string[];
}

export const ok = <T>(res: Response, data: T, message: string, status = 200): Response => {
    const body: SuccessResponse<T> = { success: true, message, data };
    return res.status(status).json(body);
};

export const created = <T>(res: Response, data: T, message: string): Response =>
    ok(res, data, message, 201);

export const fail = (res: Response, status: number, message: string, errors: string[] = []): Response => {
    const body: ErrorResponse = { success: false, message, errors };
    return res.status(status).json(body);
};
