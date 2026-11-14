import { Request, Response } from "express";
import { RecordatorioDiaApplication } from "../../application/RecordatorioDiaApplication.js";
import { loadRecordatorioDia } from "../util/recordatorio-dia-validation.js";

export class RecordatorioDiaController {

    private app: RecordatorioDiaApplication;

    constructor(application: RecordatorioDiaApplication) {
        this.app = application;
    }

    // CREATE (ARRAY)
    async createRecordatorioDia(req: Request, res: Response): Promise<Response> {

        try {
            const data = loadRecordatorioDia(req.body);

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