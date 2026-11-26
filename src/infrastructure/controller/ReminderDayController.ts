import { Request, Response } from "express";
import { ReminderDayApplication } from "../../application/ReminderDayApplication.js";
import { ReminderApplication } from "../../application/ReminderApplication.js";
import { ReminderDay } from "../../domain/ReminderDay.js";
import { loadReminderDays } from "../util/reminder-day-validation.js";
import { canAccess, forbidden } from "../web/authMiddleware.js";
import { parseId } from "../util/id-validation.js";
import { created, fail, ok } from "../web/response.js";

// Responses use the standard format (web/response.ts).
// Access to the days depends on the owner of the parent reminder.
export class ReminderDayController {
    private app: ReminderDayApplication;
    private reminders: ReminderApplication; // to know who owns the reminder

    constructor(application: ReminderDayApplication, reminders: ReminderApplication) {
        this.app = application;
        this.reminders = reminders;
    }

    // Returns an error response when the reminder does not exist or is not accessible, or null to continue
    private async checkReminderAccess(req: Request, res: Response, reminderId: number): Promise<Response | null> {
        const reminder = await this.reminders.getReminderById(reminderId);
        if (!reminder) return fail(res, 404, "Recordatorio no encontrado");
        if (!canAccess(req, reminder.userId)) return forbidden(res);
        return null;
    }

    async createReminderDays(req: Request, res: Response): Promise<Response> {
        const data = loadReminderDays(req.body);

        const denied = await this.checkReminderAccess(req, res, data.reminderId);
        if (denied) return denied;

        const ids = await this.app.createReminderDays(data.reminderId, data.weekdays);
        const days = (await Promise.all(ids.map(id => this.app.getReminderDayById(id))))
            .filter((day): day is ReminderDay => day !== null);

        return created(res, days, "Días del recordatorio creados correctamente");
    }

    async getReminderDayById(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);
        if (Number.isNaN(id)) return fail(res, 400, "ID inválido");

        const day = await this.app.getReminderDayById(id);
        if (!day) return fail(res, 404, "Día de recordatorio no encontrado");

        const denied = await this.checkReminderAccess(req, res, day.reminderId);
        if (denied) return denied;

        return ok(res, day, "Día de recordatorio encontrado");
    }

    async getAllReminderDays(req: Request, res: Response): Promise<Response> {
        return ok(res, await this.app.getAllReminderDays(), "Listado de días de recordatorio");
    }

    async getDaysByReminderId(req: Request, res: Response): Promise<Response> {
        const reminderId = parseId(req.params.reminderId);
        if (Number.isNaN(reminderId)) return fail(res, 400, "ID de recordatorio inválido");

        const denied = await this.checkReminderAccess(req, res, reminderId);
        if (denied) return denied;

        return ok(res, await this.app.getDaysByReminderId(reminderId), "Días del recordatorio");
    }

    async deleteReminderDay(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);
        if (Number.isNaN(id)) return fail(res, 400, "ID inválido");

        const day = await this.app.getReminderDayById(id);
        if (!day) return fail(res, 404, "Día de recordatorio no encontrado");

        const denied = await this.checkReminderAccess(req, res, day.reminderId);
        if (denied) return denied;

        const deleted = await this.app.deleteReminderDay(id);
        if (!deleted) return fail(res, 404, "Día de recordatorio no encontrado");

        return ok(res, null, "Día de recordatorio eliminado correctamente");
    }
}
