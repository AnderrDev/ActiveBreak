import { Request, Response } from "express";
import { PausaActivaApplication } from "../../application/PausaActivaApplication.js";
import { PausaActiva } from "../../domain/PausaActiva.js";
import { loadFiltrosCatalogo, loadPausaActiva } from "../util/pausa-activa-validation.js";
import { loadUpdatePausaActiva } from "../util/pausa-activa-update-validation.js";
import { parseId } from "../util/id-validation.js";
import { created, fail, ok } from "../web/response.js";

// Las respuestas usan el formato estándar de web/response.ts.
// Los errores (validación, no encontrado, etc.) los traduce el middleware global (web/errorMiddleware.ts)
export class PausaActivaController {

    private app: PausaActivaApplication;

    constructor(application: PausaActivaApplication) {
        this.app = application;
    }

    async createPausaActiva(req: Request, res: Response): Promise<Response> {
        const data = loadPausaActiva(req.body);

        const pausa: Omit<PausaActiva, "id"> = {
            nombre: data.nombre,
            duracionMinutos: data.duracionMinutos,
            intensidad: data.intensidad,
            activo: data.activo,
            categoriaId: data.categoriaId,
            ...(data.descripcion !== undefined && { descripcion: data.descripcion })
        };

        const id = await this.app.createPausaActiva(pausa);

        return created(res, await this.app.getByIdPausaActiva(id), "Pausa activa creada exitosamente");
    }

    async getByIdPausaActiva(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);
        if (Number.isNaN(id)) return fail(res, 400, "ID inválido");

        const pausa = await this.app.getByIdPausaActiva(id);
        if (!pausa) return fail(res, 404, "Pausa activa no encontrada");

        return ok(res, pausa, "Pausa activa encontrada");
    }

    async getAllPausaActiva(req: Request, res: Response): Promise<Response> {
        const pausas = await this.app.getAllPausaActiva();
        return ok(res, pausas, "Listado de pausas activas");
    }

    async getActivasPausaActiva(req: Request, res: Response): Promise<Response> {
        // Filtros opcionales: ?categoriaId=1&intensidad=baja&duracionMax=10
        const filtros = loadFiltrosCatalogo(req.query);
        const pausas = await this.app.getActivasPausaActiva(filtros);
        return ok(res, pausas, "Catálogo de pausas activas");
    }

    async updatePausaActiva(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);
        if (Number.isNaN(id)) return fail(res, 400, "ID inválido");

        const data = loadUpdatePausaActiva(req.body);

        const updated = await this.app.updatePausaActiva(id, data);
        if (!updated) return fail(res, 404, "Pausa activa no encontrada");

        return ok(res, await this.app.getByIdPausaActiva(id), "Pausa activa actualizada correctamente");
    }

    async deletePausaActiva(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);
        if (Number.isNaN(id)) return fail(res, 400, "ID inválido");

        const deleted = await this.app.deletePausaActiva(id);
        if (!deleted) return fail(res, 404, "Pausa activa no encontrada");

        return ok(res, null, "Pausa activa eliminada correctamente");
    }
}
