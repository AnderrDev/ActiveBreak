import { Request, Response } from "express";
import { GoalApplication } from "../../application/GoalApplication.js";
import { loadGoal, loadGoalUpdate } from "../util/goal-validation.js";
import { canAccess, forbidden } from "../web/authMiddleware.js";
import { parseId } from "../util/id-validation.js";
import { created, fail, ok } from "../web/response.js";

// Responses use the standard format (web/response.ts).
// Thrown errors are translated by the global middleware (web/errorMiddleware.ts).
export class GoalController {
    private app: GoalApplication;

    constructor(application: GoalApplication) {
        this.app = application;
    }

    async createGoal(req: Request, res: Response): Promise<Response> {
        const data = loadGoal(req.body);
        // A user can only create goals for themselves (admin: anyone)
        if (!canAccess(req, data.userId)) return forbidden(res);

        const id = await this.app.createGoal(data);
        return created(res, await this.app.getGoalById(id), "Meta creada exitosamente");
    }

    async getGoalById(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);
        if (Number.isNaN(id)) return fail(res, 400, "ID inválido");

        const goal = await this.app.getGoalById(id);
        if (!goal) return fail(res, 404, "Meta no encontrada");
        if (!canAccess(req, goal.userId)) return forbidden(res);

        return ok(res, goal, "Meta encontrada");
    }

    async getGoalsByUserId(req: Request, res: Response): Promise<Response> {
        const userId = parseId(req.params.userId);
        if (Number.isNaN(userId)) return fail(res, 400, "ID de usuario inválido");
        if (!canAccess(req, userId)) return forbidden(res);

        return ok(res, await this.app.getGoalsByUserId(userId), "Metas del usuario");
    }

    async getAllGoals(req: Request, res: Response): Promise<Response> {
        return ok(res, await this.app.getAllGoals(), "Listado de metas");
    }

    async updateGoal(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);
        if (Number.isNaN(id)) return fail(res, 400, "ID inválido");

        const existing = await this.app.getGoalById(id);
        if (!existing) return fail(res, 404, "Meta no encontrada");
        if (!canAccess(req, existing.userId)) return forbidden(res);

        const data = loadGoalUpdate(req.body);
        const updated = await this.app.updateGoal(id, data);
        if (!updated) return fail(res, 404, "Meta no encontrada");

        return ok(res, await this.app.getGoalById(id), "Meta actualizada correctamente");
    }

    async deleteGoal(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);
        if (Number.isNaN(id)) return fail(res, 400, "ID inválido");

        const existing = await this.app.getGoalById(id);
        if (!existing) return fail(res, 404, "Meta no encontrada");
        if (!canAccess(req, existing.userId)) return forbidden(res);

        const deleted = await this.app.deleteGoal(id);
        if (!deleted) return fail(res, 404, "Meta no encontrada");

        return ok(res, null, "Meta eliminada correctamente");
    }
}
