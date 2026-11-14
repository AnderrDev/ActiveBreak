import { Request, Response } from "express";
import { RecordatorioApplication } from "../../application/RecordatorioApplication.js";
import { Recordatorio } from "../../domain/Recordatorio.js";
import { loadRecordatorio } from "../util/recordatorio-validation.js";
import { loadUpdateRecordatorioData } from "../util/recordatorio-update-validation.js";

export class RecordatorioController {

    private app: RecordatorioApplication;

    constructor(application: RecordatorioApplication) {
        this.app = application;
    }

    async createRecordatorio(req: Request, res: Response): Promise<Response> {
        try {
            const { usuarioId, frecuenciaMinutos, horaInicio, horaFin, activo } =
                loadRecordatorio(req.body);

            const recordatorio: Omit<Recordatorio, "id"> = {
                usuarioId,
                frecuenciaMinutos,
                horaInicio,
                horaFin,
                activo
            };

            const id = await this.app.createRecordatorio(recordatorio);

            return res.status(201).json({
                message: "Recordatorio creado exitosamente",
                id
            });

        } catch (error) {
            return res.status(500).json({
                error: "Error al crear recordatorio",
                details: error instanceof Error ? error.message : "Error desconocido"
            });
        }
    }
    async getRecordatorioById(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);

            if (Number.isNaN(id)) {
                return res.status(400).json({ error: "ID inválido" });
            }

            const recordatorio = await this.app.getRecordatorioById(id);

            if (!recordatorio) {
                return res.status(404).json({
                    error: "Recordatorio no encontrado"
                });
            }

            return res.status(200).json(recordatorio);

        } catch (error) {
            return res.status(500).json({
                error: "Error interno del servidor"
            });
        }
    }
    async getRecordatoriosByUsuarioId(req: Request, res: Response): Promise<Response> {
        try {
            const usuarioId = Number(req.params.usuarioId);

            if (Number.isNaN(usuarioId)) {
                return res.status(400).json({ error: "ID de usuario inválido" });
            }

            const recordatorios =
                await this.app.getRecordatoriosByUsuarioId(usuarioId);

            return res.status(200).json(recordatorios);

        } catch (error) {
            return res.status(500).json({
                error: "Error al obtener recordatorios del usuario",
                details: error instanceof Error ? error.message : "Error desconocido"
            });
        }
    }
    async getAllRecordatorios(req: Request, res: Response): Promise<Response> {
        try {
            const recordatorios = await this.app.getAllRecordatorios();
            return res.status(200).json(recordatorios);

        } catch (error) {
            return res.status(500).json({
                error: "Error al obtener recordatorios"
            });
        }
    }
    async getActiveRecordatorios(req: Request, res: Response): Promise<Response> {
        try {
            const recordatorios = await this.app.getActiveRecordatorios();
            return res.status(200).json(recordatorios);

        } catch (error) {
            return res.status(500).json({
                error: "Error al obtener recordatorios activos"
            });
        }
    }
    async updateRecordatorio(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);

            if (Number.isNaN(id)) {
                return res.status(400).json({ error: "ID inválido" });
            }

            const dataLoad = loadUpdateRecordatorioData(req.body);

            const updated = await this.app.updateRecordatorio(id, dataLoad);

            if (!updated) {
                return res.status(404).json({
                    error: "Recordatorio no encontrado o sin cambios"
                });
            }

            return res.status(200).json({
                message: "Recordatorio actualizado correctamente"
            });

        } catch (error) {
            return res.status(500).json({
                error: "Error al actualizar recordatorio",
                details: error instanceof Error ? error.message : "Error desconocido"
            });
        }
    }
    async deleteRecordatorio(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);

            if (Number.isNaN(id)) {
                return res.status(400).json({ error: "ID inválido" });
            }

            const deleted = await this.app.deleteRecordatorio(id);

            if (!deleted) {
                return res.status(404).json({
                    error: "Recordatorio no encontrado"
                });
            }

            return res.status(200).json({
                message: "Recordatorio eliminado correctamente"
            });

        } catch (error) {
            return res.status(500).json({
                error: "Error al eliminar recordatorio",
                details: error instanceof Error ? error.message : "Error desconocido"
            });
        }
    }
}