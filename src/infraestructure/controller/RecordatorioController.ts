import { Request, Response } from "express";
import { RecordatorioApplication } from "../../application/RecordatorioApplication.js";
import { Recordatorio } from "../../domain/Recordatorio.js";
import { loadRecordatorio } from "../util/recordatorio-validation.js";
import { loadUpdateRecordatorioData } from "../util/recordatorio-update-validation.js";
import { canAccess, forbidden } from "../web/authMiddleware.js";
import { parseId } from "../util/id-validation.js";
import { created, fail, ok } from "../web/response.js";

// Las respuestas usan el formato estándar de web/response.ts.
// Los errores (validación, no encontrado, etc.) los traduce el middleware global (web/errorMiddleware.ts)
export class RecordatorioController {

    private app: RecordatorioApplication;

    constructor(application: RecordatorioApplication) {
        this.app = application;
    }

    async createRecordatorio(req: Request, res: Response): Promise<Response> {
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

        return created(res, await this.app.getRecordatorioById(id), "Recordatorio creado exitosamente");
    }

    async getRecordatorioById(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);
        if (Number.isNaN(id)) return fail(res, 400, "ID inválido");

        const recordatorio = await this.app.getRecordatorioById(id);
        if (!recordatorio) return fail(res, 404, "Recordatorio no encontrado");

        if (!canAccess(req, recordatorio.usuarioId)) return forbidden(res);

        return ok(res, recordatorio, "Recordatorio encontrado");
    }

    async getRecordatoriosByUsuarioId(req: Request, res: Response): Promise<Response> {
        // el parámetro de la ruta es /recordatorios/user/:userId
        const usuarioId = parseId(req.params.userId);
        if (Number.isNaN(usuarioId)) return fail(res, 400, "ID de usuario inválido");

        if (!canAccess(req, usuarioId)) return forbidden(res);

        const recordatorios = await this.app.getRecordatoriosByUsuarioId(usuarioId);

        return ok(res, recordatorios, "Recordatorios del usuario");
    }

    async getAllRecordatorios(req: Request, res: Response): Promise<Response> {
        const recordatorios = await this.app.getAllRecordatorios();
        return ok(res, recordatorios, "Listado de recordatorios");
    }

    async getActiveRecordatorios(req: Request, res: Response): Promise<Response> {
        const recordatorios = await this.app.getActiveRecordatorios();
        return ok(res, recordatorios, "Listado de recordatorios activos");
    }

    async updateRecordatorio(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);
        if (Number.isNaN(id)) return fail(res, 400, "ID inválido");

        const existing = await this.app.getRecordatorioById(id);
        if (!existing) return fail(res, 404, "Recordatorio no encontrado");

        // Debe ser dueño del recordatorio y, si lo reasigna, también del usuario destino
        if (!canAccess(req, existing.usuarioId)) return forbidden(res);

        const dataLoad = loadUpdateRecordatorioData(req.body);

        if (dataLoad.usuarioId !== undefined && !canAccess(req, dataLoad.usuarioId)) {
            return forbidden(res);
        }

        const updated = await this.app.updateRecordatorio(id, dataLoad);
        if (!updated) return fail(res, 404, "Recordatorio no encontrado");

        return ok(res, await this.app.getRecordatorioById(id), "Recordatorio actualizado correctamente");
    }

    async deleteRecordatorio(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);
        if (Number.isNaN(id)) return fail(res, 400, "ID inválido");

        const existing = await this.app.getRecordatorioById(id);
        if (!existing) return fail(res, 404, "Recordatorio no encontrado");

        if (!canAccess(req, existing.usuarioId)) return forbidden(res);

        const deleted = await this.app.deleteRecordatorio(id);
        if (!deleted) return fail(res, 404, "Recordatorio no encontrado");

        return ok(res, null, "Recordatorio eliminado correctamente");
    }
}
