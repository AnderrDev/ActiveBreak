import { Request, Response } from "express";
import { RecordatorioDiaApplication } from "../../application/RecordatorioDiaApplication.js";
import { RecordatorioApplication } from "../../application/RecordatorioApplication.js";
import { loadRecordatorioDia } from "../util/recordatorio-dia-validation.js";
import { canAccess, forbidden } from "../web/authMiddleware.js";

// Los errores (validación, no encontrado, etc.) los traduce a HTTP el middleware global (web/errorMiddleware.ts)
export class RecordatorioDiaController {

    private app: RecordatorioDiaApplication;
    private recordatorioApp: RecordatorioApplication; // para saber quién es el dueño del recordatorio

    constructor(application: RecordatorioDiaApplication, recordatorioApplication: RecordatorioApplication) {
        this.app = application;
        this.recordatorioApp = recordatorioApplication;
    }

    // Comprueba que el recordatorio exista y pertenezca al usuario autenticado (o sea admin).
    // Devuelve una respuesta de error si no cumple, o null si puede continuar.
    private async checkRecordatorioAccess(req: Request, res: Response, recordatorioId: number): Promise<Response | null> {
        const recordatorio = await this.recordatorioApp.getRecordatorioById(recordatorioId);
        if (!recordatorio) {
            return res.status(404).json({ error: "Recordatorio no encontrado" });
        }
        if (!canAccess(req, recordatorio.usuarioId)) {
            return forbidden(res);
        }
        return null;
    }

    // CREATE (ARRAY)
    async createRecordatorioDia(req: Request, res: Response): Promise<Response> {
        const data = loadRecordatorioDia(req.body);

        const denied = await this.checkRecordatorioAccess(req, res, data.recordatorioId);
        if (denied) return denied;

        const ids = await this.app.createRecordatorioDia(
            data.recordatorioId,
            data.diaSemana
        );

        return res.status(201).json({
            message: "Días del recordatorio creados correctamente",
            ids
        });
    }

    async getById(req: Request, res: Response): Promise<Response> {
        const id = Number(req.params.id);

        if (Number.isNaN(id)) {
            return res.status(400).json({ error: "ID inválido" });
        }

        const dia = await this.app.getById(id);

        if (!dia) {
            return res.status(404).json({ error: "Registro no encontrado" });
        }

        const denied = await this.checkRecordatorioAccess(req, res, dia.recordatorioId);
        if (denied) return denied;

        return res.status(200).json(dia);
    }

    async getAll(req: Request, res: Response): Promise<Response> {
        const dias = await this.app.getAll();

        return res.status(200).json(dias);
    }

    async getByRecordatorioId(req: Request, res: Response): Promise<Response> {
        const recordatorioId = Number(req.params.recordatorioId);

        if (Number.isNaN(recordatorioId)) {
            return res.status(400).json({ error: "ID inválido" });
        }

        const denied = await this.checkRecordatorioAccess(req, res, recordatorioId);
        if (denied) return denied;

        const dias = await this.app.getByRecordatorioId(recordatorioId);

        return res.status(200).json(dias);
    }

    async delete(req: Request, res: Response): Promise<Response> {
        const id = Number(req.params.id);

        if (Number.isNaN(id)) {
            return res.status(400).json({ error: "ID inválido" });
        }

        const existing = await this.app.getById(id);
        if (!existing) {
            return res.status(404).json({ error: "Registro no encontrado" });
        }

        const denied = await this.checkRecordatorioAccess(req, res, existing.recordatorioId);
        if (denied) return denied;

        const deleted = await this.app.delete(id);

        if (!deleted) {
            return res.status(404).json({
                error: "Registro no encontrado"
            });
        }

        return res.status(200).json({
            message: "Registro eliminado correctamente"
        });
    }
}
