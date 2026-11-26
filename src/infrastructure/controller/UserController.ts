import { Request, Response } from "express";
import { UserApplication } from "../../application/UserApplication.js";
import { User } from "../../domain/User.js";
import { loadEmailParam, loadLoginData, loadRegisterData, loadUserUpdate } from "../util/user-validation.js";
import { canAccess, forbidden, isAdmin } from "../web/authMiddleware.js";
import { parseId } from "../util/id-validation.js";
import { created, fail, ok } from "../web/response.js";

// Public user data: the password hash is never exposed
type UserResponse = Omit<User, "password">;
const toUserResponse = ({ password, ...publicUser }: User): UserResponse => publicUser;

// Responses use the standard format (web/response.ts).
// Thrown errors are translated by the global middleware (web/errorMiddleware.ts).
export class UserController {
    private app: UserApplication;

    constructor(application: UserApplication) {
        this.app = application;
    }

    async login(req: Request, res: Response): Promise<Response> {
        const { email, password } = loadLoginData(req.body);
        const token = await this.app.login(email, password);
        return ok(res, { token }, "Inicio de sesión exitoso");
    }

    async createUser(req: Request, res: Response): Promise<Response> {
        const data = loadRegisterData(req.body);
        // The role and the status are assigned by the server; an admin is promoted later with PUT /users/:id
        const id = await this.app.createUser({ ...data, role: "user", active: true });

        const user = await this.app.getUserById(id);
        return created(res, user ? toUserResponse(user) : null, "Usuario creado exitosamente");
    }

    async getUserById(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);
        if (Number.isNaN(id)) return fail(res, 400, "ID inválido");
        if (!canAccess(req, id)) return forbidden(res);

        const user = await this.app.getUserById(id);
        if (!user) return fail(res, 404, "Usuario no encontrado");

        return ok(res, toUserResponse(user), "Usuario encontrado");
    }

    async getUserByEmail(req: Request, res: Response): Promise<Response> {
        const { email } = loadEmailParam(req.params);

        const user = await this.app.getUserByEmail(email);
        if (!user) return fail(res, 404, "Usuario no encontrado");

        return ok(res, toUserResponse(user), "Usuario encontrado");
    }

    async getAllUsers(req: Request, res: Response): Promise<Response> {
        const users = await this.app.getAllUsers();
        return ok(res, users.map(toUserResponse), "Listado de usuarios");
    }

    async getActiveUsers(req: Request, res: Response): Promise<Response> {
        const users = await this.app.getActiveUsers();
        return ok(res, users.map(toUserResponse), "Listado de usuarios activos");
    }

    async updateUser(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);
        if (Number.isNaN(id)) return fail(res, 400, "ID inválido");
        // Only the user or an admin can modify the account
        if (!canAccess(req, id)) return forbidden(res);

        const data = loadUserUpdate(req.body);

        // Changing the role, the status or the organization is reserved to admins
        const changesAdminFields = data.role !== undefined || data.active !== undefined || data.organizationId !== undefined;
        if (changesAdminFields && !isAdmin(req)) {
            return fail(res, 403, "Solo un administrador puede cambiar el rol, el estado o la organización");
        }

        const updated = await this.app.updateUser(id, data, req.user!.id);
        if (!updated) return fail(res, 404, "Usuario no encontrado");

        const user = await this.app.getUserById(id);
        return ok(res, user ? toUserResponse(user) : null, "Usuario actualizado correctamente");
    }

    async deleteUser(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);
        if (Number.isNaN(id)) return fail(res, 400, "ID inválido");
        if (!canAccess(req, id)) return forbidden(res);

        const deleted = await this.app.deleteUser(id, req.user!.id);
        if (!deleted) return fail(res, 404, "Usuario no encontrado");

        return ok(res, null, "Usuario eliminado correctamente");
    }
}
