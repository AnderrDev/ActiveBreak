import { Request, Response } from "express";
import { RecordatorioDiaApplication } from "../../application/RecordatorioDiaApplication.js";
import { RecordatorioApplication } from "../../application/RecordatorioApplication.js";
import { RecordatorioDia } from "../../domain/RecordatorioDia.js";
import { loadRecordatorioDia } from "../util/recordatorio-dia-validation.js";
import { canAccess, forbidden } from "../web/authMiddleware.js";
import { parseId } from "../util/id-validation.js";
import { created, fail, ok } from "../web/response.js";

// Las respuestas usan el formato estándar de web/response.ts.
// Los errores (validación, no encontrado, etc.) los traduce el middleware global (web/errorMiddleware.ts)
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
        if (!recordatorio) return fail(res, 404, "Recordatorio no encontrado");
        if (!canAccess(req, recordatorio.usuarioId)) return forbidden(res);
        return null;
    }

    // CREATE (ARRAY)
    async createRecordatorioDia(req: Request, res: Response): Promise<Response> {
        const data = loadRecordatorioDia(req.body);

        const denied = await this.checkRecordatorioAccess(req, res, data.recordatorioId);
        if (denied) return denied;

        const ids = await this.app.createRecordatorioDia(data.recordatorioId, data.diaSemana);

        // Se devuelven los días creados
        const dias = (await Promise.all(ids.map(id => this.app.getById(id))))
            .filter((d): d is RecordatorioDia => d !== null);

        return created(res, dias, "Días del recordatorio creados correctamente");
    }

    async getById(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);
        if (Number.isNaN(id)) return fail(res, 400, "ID inválido");

        const dia = await this.app.getById(id);
        if (!dia) return fail(res, 404, "Día de recordatorio no encontrado");

        const denied = await this.checkRecordatorioAccess(req, res, dia.recordatorioId);
        if (denied) return denied;

        return ok(res, dia, "Día de recordatorio encontrado");
    }

    async getAll(req: Request, res: Response): Promise<Response> {
        const dias = await this.app.getAll();
        return ok(res, dias, "Listado de días de recordatorio");
    }

    async getByRecordatorioId(req: Request, res: Response): Promise<Response> {
        const recordatorioId = parseId(req.params.recordatorioId);
        if (Number.isNaN(recordatorioId)) return fail(res, 400, "ID inválido");

        const denied = await this.checkRecordatorioAccess(req, res, recordatorioId);
        if (denied) return denied;

        const dias = await this.app.getByRecordatorioId(recordatorioId);

        return ok(res, dias, "Días del recordatorio");
    }

    async delete(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);
        if (Number.isNaN(id)) return fail(res, 400, "ID inválido");

        const existing = await this.app.getById(id);
        if (!existing) return fail(res, 404, "Día de recordatorio no encontrado");

        const denied = await this.checkRecordatorioAccess(req, res, existing.recordatorioId);
        if (denied) return denied;

        const deleted = await this.app.delete(id);
        if (!deleted) return fail(res, 404, "Día de recordatorio no encontrado");

        return ok(res, null, "Día de recordatorio eliminado correctamente");
    }
}
