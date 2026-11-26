import { Request, Response } from "express";
import { MetaApplication } from "../../application/MetaApplication.js";
import { loadMeta, loadUpdateMeta } from "../util/meta-validation.js";
import { canAccess, forbidden } from "../web/authMiddleware.js";
import { parseId } from "../util/id-validation.js";
import { created, fail, ok } from "../web/response.js";

// Las respuestas usan el formato estándar de web/response.ts.
// Los errores (validación, no encontrado, conflicto) los traduce el middleware global (web/errorMiddleware.ts)
export class MetaController {

    private app: MetaApplication;

    constructor(application: MetaApplication) {
        this.app = application;
    }

    async createMeta(req: Request, res: Response): Promise<Response> {
        const data = loadMeta(req.body);

        // Un usuario solo puede crear metas para sí mismo (admin: cualquiera)
        if (!canAccess(req, data.usuarioId)) return forbidden(res);

        const id = await this.app.createMeta(data);

        return created(res, await this.app.getMetaById(id), "Meta creada exitosamente");
    }

    async getMetaById(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);
        if (Number.isNaN(id)) return fail(res, 400, "ID inválido");

        const meta = await this.app.getMetaById(id);
        if (!meta) return fail(res, 404, "Meta no encontrada");

        if (!canAccess(req, meta.usuarioId)) return forbidden(res);

        return ok(res, meta, "Meta encontrada");
    }

    async getMetasByUsuarioId(req: Request, res: Response): Promise<Response> {
        const usuarioId = parseId(req.params.usuarioId);
        if (Number.isNaN(usuarioId)) return fail(res, 400, "ID de usuario inválido");

        if (!canAccess(req, usuarioId)) return forbidden(res);

        const metas = await this.app.getMetasByUsuarioId(usuarioId);
        return ok(res, metas, "Metas del usuario");
    }

    async getAllMetas(req: Request, res: Response): Promise<Response> {
        const metas = await this.app.getAllMetas();
        return ok(res, metas, "Listado de metas");
    }

    async updateMeta(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);
        if (Number.isNaN(id)) return fail(res, 400, "ID inválido");

        const existing = await this.app.getMetaById(id);
        if (!existing) return fail(res, 404, "Meta no encontrada");

        if (!canAccess(req, existing.usuarioId)) return forbidden(res);

        const data = loadUpdateMeta(req.body);
        const updated = await this.app.updateMeta(id, data);
        if (!updated) return fail(res, 404, "Meta no encontrada");

        return ok(res, await this.app.getMetaById(id), "Meta actualizada correctamente");
    }

    async deleteMeta(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);
        if (Number.isNaN(id)) return fail(res, 400, "ID inválido");

        const existing = await this.app.getMetaById(id);
        if (!existing) return fail(res, 404, "Meta no encontrada");

        if (!canAccess(req, existing.usuarioId)) return forbidden(res);

        const deleted = await this.app.deleteMeta(id);
        if (!deleted) return fail(res, 404, "Meta no encontrada");

        return ok(res, null, "Meta eliminada correctamente");
    }
}
