import { Request, Response } from "express";
import { ReminderApplication } from "../../application/ReminderApplication.js";
import { loadReminder, loadReminderUpdate } from "../util/reminder-validation.js";
import { canAccess, forbidden } from "../web/authMiddleware.js";
import { parseId } from "../util/id-validation.js";
import { created, fail, ok } from "../web/response.js";

// Responses use the standard format (web/response.ts).
// Thrown errors are translated by the global middleware (web/errorMiddleware.ts).
export class ReminderController {
    private app: ReminderApplication;

    constructor(application: ReminderApplication) {
        this.app = application;
    }

    async createReminder(req: Request, res: Response): Promise<Response> {
        const data = loadReminder(req.body);
        // A user can only create reminders for themselves (admin: anyone)
        if (!canAccess(req, data.userId)) return forbidden(res);

        const id = await this.app.createReminder(data);
        return created(res, await this.app.getReminderById(id), "Recordatorio creado exitosamente");
    }

    async getReminderById(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);
        if (Number.isNaN(id)) return fail(res, 400, "ID inválido");

        const reminder = await this.app.getReminderById(id);
        if (!reminder) return fail(res, 404, "Recordatorio no encontrado");
        if (!canAccess(req, reminder.userId)) return forbidden(res);

        return ok(res, reminder, "Recordatorio encontrado");
    }

    async getRemindersByUserId(req: Request, res: Response): Promise<Response> {
        const userId = parseId(req.params.userId);
        if (Number.isNaN(userId)) return fail(res, 400, "ID de usuario inválido");
        if (!canAccess(req, userId)) return forbidden(res);

        return ok(res, await this.app.getRemindersByUserId(userId), "Recordatorios del usuario");
    }

    async getAllReminders(req: Request, res: Response): Promise<Response> {
        return ok(res, await this.app.getAllReminders(), "Listado de recordatorios");
    }

    async getActiveReminders(req: Request, res: Response): Promise<Response> {
        return ok(res, await this.app.getActiveReminders(), "Listado de recordatorios activos");
    }

    async updateReminder(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);
        if (Number.isNaN(id)) return fail(res, 400, "ID inválido");

        const existing = await this.app.getReminderById(id);
        if (!existing) return fail(res, 404, "Recordatorio no encontrado");
        // Must own the reminder and, when moving it, also the target user
        if (!canAccess(req, existing.userId)) return forbidden(res);

        const data = loadReminderUpdate(req.body);
        if (data.userId !== undefined && !canAccess(req, data.userId)) return forbidden(res);

        const updated = await this.app.updateReminder(id, data);
        if (!updated) return fail(res, 404, "Recordatorio no encontrado");

        return ok(res, await this.app.getReminderById(id), "Recordatorio actualizado correctamente");
    }

    async deleteReminder(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);
        if (Number.isNaN(id)) return fail(res, 400, "ID inválido");

        const existing = await this.app.getReminderById(id);
        if (!existing) return fail(res, 404, "Recordatorio no encontrado");
        if (!canAccess(req, existing.userId)) return forbidden(res);

        const deleted = await this.app.deleteReminder(id);
        if (!deleted) return fail(res, 404, "Recordatorio no encontrado");

        return ok(res, null, "Recordatorio eliminado correctamente");
    }
}
