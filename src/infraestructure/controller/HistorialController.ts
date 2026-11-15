import { Request, Response } from "express";
import { HistorialApplication } from "../../application/HistorialApplication.js";
import { HistorialActividad } from "../../domain/Historial.js";
import { loadHistorial } from "../util/historial-validation.js";
import { canAccess, forbidden } from "../web/authMiddleware.js";
import { parseId } from "../util/id-validation.js";

// Los errores (validación, no encontrado, etc.) los traduce a HTTP el middleware global (web/errorMiddleware.ts)
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

        return res.status(201).json({
            message: "Historial creado exitosamente",
            id
        });
    }

    async getHistorialById(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);

        if (Number.isNaN(id)) {
            return res.status(400).json({ error: "ID inválido" });
        }

        const historial = await this.app.getHistorialById(id);

        if (!historial) {
            return res.status(404).json({
                error: "Historial no encontrado"
            });
        }

        if (!canAccess(req, historial.usuarioId)) return forbidden(res);

        return res.status(200).json(historial);
    }

    async getAllHistorial(req: Request, res: Response): Promise<Response> {
        const historial = await this.app.getAllHistorial();
        return res.status(200).json(historial);
    }

    async getHistorialByUsuarioId(req: Request, res: Response): Promise<Response> {
        const usuarioId = parseId(req.params.usuarioId);

        if (Number.isNaN(usuarioId)) {
            return res.status(400).json({ error: "usuarioId inválido" });
        }

        if (!canAccess(req, usuarioId)) return forbidden(res);

        const historial = await this.app.getHistorialByUsuarioId(usuarioId);

        return res.status(200).json(historial);
    }

    async getHistorialByPausaId(req: Request, res: Response): Promise<Response> {
        const pausaId = parseId(req.params.pausaId);

        if (Number.isNaN(pausaId)) {
            return res.status(400).json({ error: "pausaId inválido" });
        }

        const historial = await this.app.getHistorialByPausaId(pausaId);

        return res.status(200).json(historial);
    }

    async deleteHistorial(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);

        if (Number.isNaN(id)) {
            return res.status(400).json({ error: "ID inválido" });
        }

        const existing = await this.app.getHistorialById(id);
        if (!existing) {
            return res.status(404).json({ error: "Historial no encontrado" });
        }

        if (!canAccess(req, existing.usuarioId)) return forbidden(res);

        const deleted = await this.app.deleteHistorial(id);

        if (!deleted) {
            return res.status(404).json({
                error: "Historial no encontrado"
            });
        }

        return res.status(200).json({
            message: "Historial eliminado correctamente"
        });
    }
}
