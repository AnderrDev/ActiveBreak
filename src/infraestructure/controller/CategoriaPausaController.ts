import { Request, Response } from "express";
import { CategoriaPausaApplication } from "../../application/CategoriaPausaApplication.js";
import { CategoriaPausa } from "../../domain/CategoriaPausa.js";
import { loadCategoria, loadUpdateCategoria } from "../util/categoria-validation.js";
import { parseId } from "../util/id-validation.js";
import { created, fail, ok } from "../web/response.js";

// Las respuestas usan el formato estándar de web/response.ts.
// Los errores (validación, no encontrado, conflicto) los traduce el middleware global (web/errorMiddleware.ts)
export class CategoriaPausaController {

    private app: CategoriaPausaApplication;

    constructor(application: CategoriaPausaApplication) {
        this.app = application;
    }

    async createCategoria(req: Request, res: Response): Promise<Response> {
        const data = loadCategoria(req.body);

        const categoria: Omit<CategoriaPausa, "id"> = {
            nombre: data.nombre,
            activo: data.activo,
            ...(data.descripcion !== undefined && { descripcion: data.descripcion })
        };

        const id = await this.app.createCategoria(categoria);

        return created(res, await this.app.getCategoriaById(id), "Categoría creada exitosamente");
    }

    async getCategoriaById(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);
        if (Number.isNaN(id)) return fail(res, 400, "ID inválido");

        const categoria = await this.app.getCategoriaById(id);
        if (!categoria) return fail(res, 404, "Categoría no encontrada");

        return ok(res, categoria, "Categoría encontrada");
    }

    async getAllCategorias(req: Request, res: Response): Promise<Response> {
        const categorias = await this.app.getAllCategorias();
        return ok(res, categorias, "Listado de categorías");
    }

    async getActiveCategorias(req: Request, res: Response): Promise<Response> {
        const categorias = await this.app.getActiveCategorias();
        return ok(res, categorias, "Listado de categorías activas");
    }

    async updateCategoria(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);
        if (Number.isNaN(id)) return fail(res, 400, "ID inválido");

        const data = loadUpdateCategoria(req.body);
        const updated = await this.app.updateCategoria(id, data);
        if (!updated) return fail(res, 404, "Categoría no encontrada");

        return ok(res, await this.app.getCategoriaById(id), "Categoría actualizada correctamente");
    }

    async deleteCategoria(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);
        if (Number.isNaN(id)) return fail(res, 400, "ID inválido");

        const deleted = await this.app.deleteCategoria(id);
        if (!deleted) return fail(res, 404, "Categoría no encontrada");

        return ok(res, null, "Categoría eliminada correctamente");
    }
}
