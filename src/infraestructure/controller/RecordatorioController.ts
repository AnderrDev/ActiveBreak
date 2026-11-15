import { Request, Response } from "express";
import { RecordatorioApplication } from "../../application/RecordatorioApplication.js";
import { Recordatorio } from "../../domain/Recordatorio.js";
import { loadRecordatorio } from "../util/recordatorio-validation.js";
import { loadUpdateRecordatorioData } from "../util/recordatorio-update-validation.js";
import { canAccess, forbidden } from "../web/authMiddleware.js";

export class RecordatorioController {

    private app: RecordatorioApplication;

    constructor(application: RecordatorioApplication) {
        this.app = application;
    }

    async createRecordatorio(req: Request, res: Response): Promise<Response> {
        try {
            const { usuarioId, frecuenciaMinutos, horaInicio, horaFin, activo } =
                loadRecordatorio(req.body);

            // Un usuario solo puede crear recordatorios para sí mismo (admin: cualquiera)
            if (!canAccess(req, usuarioId)) return forbidden(res);

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

            if (!canAccess(req, recordatorio.usuarioId)) return forbidden(res);

            return res.status(200).json(recordatorio);

        } catch (error) {
            return res.status(500).json({
                error: "Error interno del servidor"
            });
        }
    }
    async getRecordatoriosByUsuarioId(req: Request, res: Response): Promise<Response> {
        try {
            // el parámetro de la ruta es /recordatorios/user/:userId
            const usuarioId = Number(req.params.userId);

            if (Number.isNaN(usuarioId)) {
                return res.status(400).json({ error: "ID de usuario inválido" });
            }

            if (!canAccess(req, usuarioId)) return forbidden(res);

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

            const existing = await this.app.getRecordatorioById(id);
            if (!existing) {
                return res.status(404).json({ error: "Recordatorio no encontrado" });
            }

            // Debe ser dueño del recordatorio y, si lo reasigna, también del usuario destino
            if (!canAccess(req, existing.usuarioId)) return forbidden(res);

            const dataLoad = loadUpdateRecordatorioData(req.body);

            if (dataLoad.usuarioId !== undefined && !canAccess(req, dataLoad.usuarioId)) {
                return forbidden(res);
            }

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

            const existing = await this.app.getRecordatorioById(id);
            if (!existing) {
                return res.status(404).json({ error: "Recordatorio no encontrado" });
            }

            if (!canAccess(req, existing.usuarioId)) return forbidden(res);

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