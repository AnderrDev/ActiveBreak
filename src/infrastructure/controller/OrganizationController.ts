import { Request, Response } from "express";
import { OrganizationApplication } from "../../application/OrganizationApplication.js";
import { loadOrganization, loadOrganizationUpdate } from "../util/organization-validation.js";
import { parseId } from "../util/id-validation.js";
import { created, fail, ok } from "../web/response.js";

// Responses use the standard format (web/response.ts).
// Thrown errors are translated by the global middleware (web/errorMiddleware.ts).
export class OrganizationController {
    private app: OrganizationApplication;

    constructor(application: OrganizationApplication) {
        this.app = application;
    }

    async createOrganization(req: Request, res: Response): Promise<Response> {
        const data = loadOrganization(req.body);
        const id = await this.app.createOrganization(data);
        return created(res, await this.app.getOrganizationById(id), "Organización creada exitosamente");
    }

    async getOrganizationById(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);
        if (Number.isNaN(id)) return fail(res, 400, "ID inválido");

        const organization = await this.app.getOrganizationById(id);
        if (!organization) return fail(res, 404, "Organización no encontrada");

        return ok(res, organization, "Organización encontrada");
    }

    async getAllOrganizations(req: Request, res: Response): Promise<Response> {
        return ok(res, await this.app.getAllOrganizations(), "Listado de organizaciones");
    }

    async getActiveOrganizations(req: Request, res: Response): Promise<Response> {
        return ok(res, await this.app.getActiveOrganizations(), "Listado de organizaciones activas");
    }

    async updateOrganization(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);
        if (Number.isNaN(id)) return fail(res, 400, "ID inválido");

        const data = loadOrganizationUpdate(req.body);
        const updated = await this.app.updateOrganization(id, data);
        if (!updated) return fail(res, 404, "Organización no encontrada");

        return ok(res, await this.app.getOrganizationById(id), "Organización actualizada correctamente");
    }

    async deleteOrganization(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);
        if (Number.isNaN(id)) return fail(res, 400, "ID inválido");

        const deleted = await this.app.deleteOrganization(id);
        if (!deleted) return fail(res, 404, "Organización no encontrada");

        return ok(res, null, "Organización eliminada correctamente");
    }
}
