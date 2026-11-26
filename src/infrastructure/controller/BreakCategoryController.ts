import { Request, Response } from "express";
import { BreakCategoryApplication } from "../../application/BreakCategoryApplication.js";
import { loadBreakCategory, loadBreakCategoryUpdate } from "../util/break-category-validation.js";
import { parseId } from "../util/id-validation.js";
import { created, fail, ok } from "../web/response.js";

// Responses use the standard format (web/response.ts).
// Thrown errors are translated by the global middleware (web/errorMiddleware.ts).
export class BreakCategoryController {
    private app: BreakCategoryApplication;

    constructor(application: BreakCategoryApplication) {
        this.app = application;
    }

    async createCategory(req: Request, res: Response): Promise<Response> {
        const data = loadBreakCategory(req.body);
        const id = await this.app.createCategory(data);
        return created(res, await this.app.getCategoryById(id), "Categoría creada exitosamente");
    }

    async getCategoryById(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);
        if (Number.isNaN(id)) return fail(res, 400, "ID inválido");

        const category = await this.app.getCategoryById(id);
        if (!category) return fail(res, 404, "Categoría no encontrada");

        return ok(res, category, "Categoría encontrada");
    }

    async getAllCategories(req: Request, res: Response): Promise<Response> {
        return ok(res, await this.app.getAllCategories(), "Listado de categorías");
    }

    async getActiveCategories(req: Request, res: Response): Promise<Response> {
        return ok(res, await this.app.getActiveCategories(), "Listado de categorías activas");
    }

    async updateCategory(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);
        if (Number.isNaN(id)) return fail(res, 400, "ID inválido");

        const data = loadBreakCategoryUpdate(req.body);
        const updated = await this.app.updateCategory(id, data);
        if (!updated) return fail(res, 404, "Categoría no encontrada");

        return ok(res, await this.app.getCategoryById(id), "Categoría actualizada correctamente");
    }

    async deleteCategory(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);
        if (Number.isNaN(id)) return fail(res, 400, "ID inválido");

        const deleted = await this.app.deleteCategory(id);
        if (!deleted) return fail(res, 404, "Categoría no encontrada");

        return ok(res, null, "Categoría eliminada correctamente");
    }
}
