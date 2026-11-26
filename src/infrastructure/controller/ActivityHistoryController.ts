import { Request, Response } from "express";
import { ActivityHistoryApplication } from "../../application/ActivityHistoryApplication.js";
import { loadActivityRecord } from "../util/activity-history-validation.js";
import { canAccess, forbidden } from "../web/authMiddleware.js";
import { parseId } from "../util/id-validation.js";
import { created, fail, ok } from "../web/response.js";

// Responses use the standard format (web/response.ts).
// Thrown errors are translated by the global middleware (web/errorMiddleware.ts).
export class ActivityHistoryController {
    private app: ActivityHistoryApplication;

    constructor(application: ActivityHistoryApplication) {
        this.app = application;
    }

    async createRecord(req: Request, res: Response): Promise<Response> {
        const data = loadActivityRecord(req.body);
        // A user can only register their own activity (admin: anyone)
        if (!canAccess(req, data.userId)) return forbidden(res);

        const id = await this.app.createRecord({
            userId: data.userId,
            breakId: data.breakId,
            performedAt: data.performedAt ? new Date(data.performedAt) : new Date(),
            completed: data.completed,
            actualDurationMinutes: data.actualDurationMinutes,
        });

        return created(res, await this.app.getRecordById(id), "Pausa registrada en el historial");
    }

    async getRecordById(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);
        if (Number.isNaN(id)) return fail(res, 400, "ID inválido");

        const record = await this.app.getRecordById(id);
        if (!record) return fail(res, 404, "Registro no encontrado");
        if (!canAccess(req, record.userId)) return forbidden(res);

        return ok(res, record, "Registro encontrado");
    }

    async getAllRecords(req: Request, res: Response): Promise<Response> {
        return ok(res, await this.app.getAllRecords(), "Historial de actividad");
    }

    async getRecordsByUserId(req: Request, res: Response): Promise<Response> {
        const userId = parseId(req.params.userId);
        if (Number.isNaN(userId)) return fail(res, 400, "ID de usuario inválido");
        if (!canAccess(req, userId)) return forbidden(res);

        return ok(res, await this.app.getRecordsByUserId(userId), "Historial del usuario");
    }

    async getRecordsByBreakId(req: Request, res: Response): Promise<Response> {
        const breakId = parseId(req.params.breakId);
        if (Number.isNaN(breakId)) return fail(res, 400, "ID de pausa inválido");

        return ok(res, await this.app.getRecordsByBreakId(breakId), "Historial de la pausa");
    }

    async deleteRecord(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);
        if (Number.isNaN(id)) return fail(res, 400, "ID inválido");

        const record = await this.app.getRecordById(id);
        if (!record) return fail(res, 404, "Registro no encontrado");
        if (!canAccess(req, record.userId)) return forbidden(res);

        const deleted = await this.app.deleteRecord(id);
        if (!deleted) return fail(res, 404, "Registro no encontrado");

        return ok(res, null, "Registro eliminado correctamente");
    }
}
