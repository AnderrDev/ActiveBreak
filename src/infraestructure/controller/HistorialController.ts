import { Request, Response } from "express";
import { HistorialApplication } from "../../application/HistorialApplication.js";
import { HistorialActividad } from "../../domain/Historial.js";
import { loadHistorial } from "../util/historial-validation.js";
import { canAccess, forbidden } from "../web/authMiddleware.js";
import { parseId } from "../util/id-validation.js";
import { created, fail, ok } from "../web/response.js";

// Las respuestas usan el formato estándar de web/response.ts.
// Los errores (validación, no encontrado, etc.) los traduce el middleware global (web/errorMiddleware.ts)
export class HistorialController {

    private app: HistorialApplication;

    constructor(application: HistorialApplication) {
        this.app = application;
    }

    async createHistorial(req: Request, res: Response): Promise<Response> {
        const data = loadHistorial(req.body);

        // Un usuario solo puede registrar historial propio (admin: cualquiera)
        if (!canAccess(req, data.usuarioId)) return forbidden(res);

        const historial: Omit<HistorialActividad, "id"> = {
            usuarioId: data.usuarioId,
            pausaId: data.pausaId,
            fechaHora: data.fechaHora ? new Date(data.fechaHora) : new Date(),
            completado: data.completado,
            duracionReal: data.duracionReal
        };

        const id = await this.app.createHistorial(historial);

        return created(res, await this.app.getHistorialById(id), "Historial creado exitosamente");
    }

    async getHistorialById(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);
        if (Number.isNaN(id)) return fail(res, 400, "ID inválido");

        const historial = await this.app.getHistorialById(id);
        if (!historial) return fail(res, 404, "Historial no encontrado");

        if (!canAccess(req, historial.usuarioId)) return forbidden(res);

        return ok(res, historial, "Registro de historial encontrado");
    }

    async getAllHistorial(req: Request, res: Response): Promise<Response> {
        const historial = await this.app.getAllHistorial();
        return ok(res, historial, "Listado del historial");
    }

    async getHistorialByUsuarioId(req: Request, res: Response): Promise<Response> {
        const usuarioId = parseId(req.params.usuarioId);
        if (Number.isNaN(usuarioId)) return fail(res, 400, "ID de usuario inválido");

        if (!canAccess(req, usuarioId)) return forbidden(res);

        const historial = await this.app.getHistorialByUsuarioId(usuarioId);

        return ok(res, historial, "Historial del usuario");
    }

    async getHistorialByPausaId(req: Request, res: Response): Promise<Response> {
        const pausaId = parseId(req.params.pausaId);
        if (Number.isNaN(pausaId)) return fail(res, 400, "ID de pausa inválido");

        const historial = await this.app.getHistorialByPausaId(pausaId);

        return ok(res, historial, "Historial de la pausa");
    }

    async deleteHistorial(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);
        if (Number.isNaN(id)) return fail(res, 400, "ID inválido");

        const existing = await this.app.getHistorialById(id);
        if (!existing) return fail(res, 404, "Historial no encontrado");

        if (!canAccess(req, existing.usuarioId)) return forbidden(res);

        const deleted = await this.app.deleteHistorial(id);
        if (!deleted) return fail(res, 404, "Historial no encontrado");

        return ok(res, null, "Historial eliminado correctamente");
    }
}
