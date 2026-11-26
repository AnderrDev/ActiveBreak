import { Request, Response } from "express";
import { OrganizacionApplication } from "../../application/OrganizacionApplication.js";
import { Organizacion } from "../../domain/Organizacion.js";
import { loadOrganizacion, loadUpdateOrganizacion } from "../util/organizacion-validation.js";
import { parseId } from "../util/id-validation.js";
import { created, fail, ok } from "../web/response.js";

// Las respuestas usan el formato estándar de web/response.ts.
// Los errores (validación, no encontrado, conflicto) los traduce el middleware global (web/errorMiddleware.ts)
export class OrganizacionController {

    private app: OrganizacionApplication;

    constructor(application: OrganizacionApplication) {
        this.app = application;
    }

    async createOrganizacion(req: Request, res: Response): Promise<Response> {
        const data = loadOrganizacion(req.body);

        const organizacion: Omit<Organizacion, "id"> = {
            nombre: data.nombre,
            nit: data.nit,
            activo: data.activo,
            ...(data.sector !== undefined && { sector: data.sector })
        };

        const id = await this.app.createOrganizacion(organizacion);

        return created(res, await this.app.getOrganizacionById(id), "Organización creada exitosamente");
    }

    async getOrganizacionById(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);
        if (Number.isNaN(id)) return fail(res, 400, "ID inválido");

        const organizacion = await this.app.getOrganizacionById(id);
        if (!organizacion) return fail(res, 404, "Organización no encontrada");

        return ok(res, organizacion, "Organización encontrada");
    }

    async getAllOrganizaciones(req: Request, res: Response): Promise<Response> {
        const organizaciones = await this.app.getAllOrganizaciones();
        return ok(res, organizaciones, "Listado de organizaciones");
    }

    async getActiveOrganizaciones(req: Request, res: Response): Promise<Response> {
        const organizaciones = await this.app.getActiveOrganizaciones();
        return ok(res, organizaciones, "Listado de organizaciones activas");
    }

    async updateOrganizacion(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);
        if (Number.isNaN(id)) return fail(res, 400, "ID inválido");

        const data = loadUpdateOrganizacion(req.body);
        const updated = await this.app.updateOrganizacion(id, data);
        if (!updated) return fail(res, 404, "Organización no encontrada");

        return ok(res, await this.app.getOrganizacionById(id), "Organización actualizada correctamente");
    }

    async deleteOrganizacion(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);
        if (Number.isNaN(id)) return fail(res, 400, "ID inválido");

        const deleted = await this.app.deleteOrganizacion(id);
        if (!deleted) return fail(res, 404, "Organización no encontrada");

        return ok(res, null, "Organización eliminada correctamente");
    }
}
