import { Request, Response } from "express";
import { RecordatorioDiaApplication } from "../../application/RecordatorioDiaApplication.js";
import { RecordatorioApplication } from "../../application/RecordatorioApplication.js";
import { loadRecordatorioDia } from "../util/recordatorio-dia-validation.js";
import { canAccess, forbidden } from "../web/authMiddleware.js";

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

        try {
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

        } catch (error) {

            return res.status(400).json({
                error: "Error al crear días del recordatorio",
                details: error instanceof Error ? error.message : "Error desconocido"
            });
        }
    }

    async getById(req: Request, res: Response): Promise<Response> {

        try {
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

        } catch (error) {

            return res.status(500).json({
                error: "Error interno del servidor"
            });
        }
    }

    async getAll(req: Request, res: Response): Promise<Response> {

        try {
            const dias = await this.app.getAll();

            return res.status(200).json(dias);

        } catch (error) {

            return res.status(500).json({
                error: "Error al obtener registros"
            });
        }
    }

    async getByRecordatorioId(req: Request, res: Response): Promise<Response> {

        try {
            const recordatorioId = Number(req.params.recordatorioId);

            if (Number.isNaN(recordatorioId)) {
                return res.status(400).json({ error: "ID inválido" });
            }

            const denied = await this.checkRecordatorioAccess(req, res, recordatorioId);
            if (denied) return denied;

            const dias = await this.app.getByRecordatorioId(recordatorioId);

            return res.status(200).json(dias);

        } catch (error) {

            return res.status(500).json({
                error: "Error al obtener días del recordatorio"
            });
        }
    }

    async delete(req: Request, res: Response): Promise<Response> {

        try {
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

        } catch (error) {

            return res.status(500).json({
                error: "Error al eliminar registro"
            });
        }
    }
}