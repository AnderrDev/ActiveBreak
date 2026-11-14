import { Request, Response } from "express";
import { HistorialApplication } from "../../application/HistorialApplication.js";
import { HistorialActividad } from "../../domain/Historial.js";
import { loadHistorial } from "../util/historial-validation.js";

export class HistorialController {

    private app: HistorialApplication;

    constructor(application: HistorialApplication) {
        this.app = application;
    }

    async createHistorial(req: Request, res: Response): Promise<Response> {
        try {
            const data = loadHistorial(req.body);

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

        } catch (error) {
            return res.status(400).json({
                error: "Error al crear historial",
                details: error instanceof Error ? error.message : "Error desconocido"
            });
        }
    }

    async getHistorialById(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);

            if (Number.isNaN(id)) {
                return res.status(400).json({ error: "ID inválido" });
            }

            const historial = await this.app.getHistorialById(id);

            if (!historial) {
                return res.status(404).json({
                    error: "Historial no encontrado"
                });
            }

            return res.status(200).json(historial);

        } catch (error) {
            return res.status(500).json({
                error: "Error interno del servidor"
            });
        }
    }

    async getAllHistorial(req: Request, res: Response): Promise<Response> {
        try {
            const historial = await this.app.getAllHistorial();
            return res.status(200).json(historial);

        } catch (error) {
            return res.status(500).json({
                error: "Error al obtener historial"
            });
        }
    }

    async getHistorialByUsuarioId(req: Request, res: Response): Promise<Response> {
        try {
            const usuarioId = Number(req.params.usuarioId);

            if (Number.isNaN(usuarioId)) {
                return res.status(400).json({ error: "usuarioId inválido" });
            }

            const historial = await this.app.getHistorialByUsuarioId(usuarioId);

            return res.status(200).json(historial);

        } catch (error) {
            return res.status(400).json({
                error: "Error al obtener historial por usuario",
                details: error instanceof Error ? error.message : "Error desconocido"
            });
        }
    }

    async getHistorialByPausaId(req: Request, res: Response): Promise<Response> {
        try {
            const pausaId = Number(req.params.pausaId);

            if (Number.isNaN(pausaId)) {
                return res.status(400).json({ error: "pausaId inválido" });
            }

            const historial = await this.app.getHistorialByPausaId(pausaId);

            return res.status(200).json(historial);

        } catch (error) {
            return res.status(400).json({
                error: "Error al obtener historial por pausa",
                details: error instanceof Error ? error.message : "Error desconocido"
            });
        }
    }

    async deleteHistorial(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);

            if (Number.isNaN(id)) {
                return res.status(400).json({ error: "ID inválido" });
            }

            const deleted = await this.app.deleteHistorial(id);

            if (!deleted) {
                return res.status(404).json({
                    error: "Historial no encontrado"
                });
            }

            return res.status(200).json({
                message: "Historial eliminado correctamente"
            });

        } catch (error) {
            return res.status(500).json({
                error: "Error al eliminar historial",
                details: error instanceof Error ? error.message : "Error desconocido"
            });
        }
    }
}