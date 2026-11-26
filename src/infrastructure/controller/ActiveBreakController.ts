import { Request, Response } from "express";
import { ActiveBreakApplication } from "../../application/ActiveBreakApplication.js";
import { loadActiveBreak, loadActiveBreakUpdate, loadCatalogFilters } from "../util/active-break-validation.js";
import { parseId } from "../util/id-validation.js";
import { created, fail, ok } from "../web/response.js";

// Responses use the standard format (web/response.ts).
// Thrown errors are translated by the global middleware (web/errorMiddleware.ts).
export class ActiveBreakController {
    private app: ActiveBreakApplication;

    constructor(application: ActiveBreakApplication) {
        this.app = application;
    }

    async createBreak(req: Request, res: Response): Promise<Response> {
        const data = loadActiveBreak(req.body);
        const id = await this.app.createBreak(data);
        return created(res, await this.app.getBreakById(id), "Pausa activa creada exitosamente");
    }

    async getBreakById(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);
        if (Number.isNaN(id)) return fail(res, 400, "ID inválido");

        const activeBreak = await this.app.getBreakById(id);
        if (!activeBreak) return fail(res, 404, "Pausa activa no encontrada");

        return ok(res, activeBreak, "Pausa activa encontrada");
    }

    async getAllBreaks(req: Request, res: Response): Promise<Response> {
        return ok(res, await this.app.getAllBreaks(), "Listado de pausas activas");
    }

    async getActiveBreaks(req: Request, res: Response): Promise<Response> {
        // Optional filters: ?categoryId=1&intensity=low&maxDuration=10
        const filters = loadCatalogFilters(req.query);
        return ok(res, await this.app.getActiveBreaks(filters), "Catálogo de pausas activas");
    }

    async updateBreak(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);
        if (Number.isNaN(id)) return fail(res, 400, "ID inválido");

        const data = loadActiveBreakUpdate(req.body);
        const updated = await this.app.updateBreak(id, data);
        if (!updated) return fail(res, 404, "Pausa activa no encontrada");

        return ok(res, await this.app.getBreakById(id), "Pausa activa actualizada correctamente");
    }

    async deleteBreak(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);
        if (Number.isNaN(id)) return fail(res, 400, "ID inválido");

        const deleted = await this.app.deleteBreak(id);
        if (!deleted) return fail(res, 404, "Pausa activa no encontrada");

        return ok(res, null, "Pausa activa eliminada correctamente");
    }
}
