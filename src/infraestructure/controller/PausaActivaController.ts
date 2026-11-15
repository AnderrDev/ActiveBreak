import { Request, Response } from "express";
import { PausaActivaApplication } from "../../application/PausaActivaApplication.js";
import { PausaActiva } from "../../domain/PausaActiva.js";
import { loadPausaActiva } from "../util/pausa-activa-validation.js";
import { loadUpdatePausaActiva } from "../util/pausa-activa-update-validation.js";
import { parseId } from "../util/id-validation.js";

// Los errores (validación, no encontrado, etc.) los traduce a HTTP el middleware global (web/errorMiddleware.ts)
export class PausaActivaController {

    private app: PausaActivaApplication;

    constructor(application: PausaActivaApplication) {
        this.app = application;
    }

    async createPausaActiva(req: Request, res: Response): Promise<Response> {
        const data = loadPausaActiva(req.body);

        const pausa: Omit<PausaActiva, "id"> = {
            nombre: data.nombre,
            duracionMinutos: data.duracionMinutos,
            intensidad: data.intensidad,
            activo: data.activo,
            ...(data.descripcion !== undefined && { descripcion: data.descripcion })
        };

        const id = await this.app.createPausaActiva(pausa);

        return res.status(201).json({
            message: "Pausa activa creada exitosamente",
            id
        });
    }
    async getByIdPausaActiva(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);

        if (Number.isNaN(id)) {
            return res.status(400).json({ error: "ID inválido" });
        }

        const pausa = await this.app.getByIdPausaActiva(id);

        if (!pausa) {
            return res.status(404).json({ error: "Pausa activa no encontrada" });
        }

        return res.status(200).json(pausa);
    }
    async getAllPausaActiva(req: Request, res: Response): Promise<Response> {
        const pausas = await this.app.getAllPausaActiva();
        return res.status(200).json(pausas);
    }
    async getActivasPausaActiva(req: Request, res: Response): Promise<Response> {
        const pausas = await this.app.getActivasPausaActiva();
        return res.status(200).json(pausas);
    }
    async updatePausaActiva(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);

        if (Number.isNaN(id)) {
            return res.status(400).json({
                error: "ID inválido"
            });
        }

        const data = loadUpdatePausaActiva(req.body);

        const updated = await this.app.updatePausaActiva(id, data);

        if (!updated) {
            return res.status(404).json({
                error: "Pausa activa no encontrada o sin cambios"
            });
        }

        return res.status(200).json({
            message: "Pausa activa actualizada correctamente"
        });
    }
    async deletePausaActiva(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);

        if (Number.isNaN(id)) {
            return res.status(400).json({
                error: "ID inválido"
            });
        }

        const deleted = await this.app.deletePausaActiva(id);

        if (!deleted) {
            return res.status(404).json({
                error: "Pausa activa no encontrada"
            });
        }

        return res.status(200).json({
            message: "Pausa activa eliminada correctamente"
        });
    }
}
