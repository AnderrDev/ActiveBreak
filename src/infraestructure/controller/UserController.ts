import { UserApplication } from "../../application/UserApplication.js";
import { Request, Response } from "express";
import { loadUpdateUserData } from "../util/user-update-validation.js"
import { loadUserData } from "../util/user-validation.js";
import { User } from "../../domain/User.js";
import { loadEmail } from "../util/user-email-validation.js";
import { loadLoginData } from "../util/user-validation.js";
import { canAccess, forbidden, isAdmin } from "../web/authMiddleware.js";
import { parseId } from "../util/id-validation.js";
import { created, fail, ok } from "../web/response.js";

// Respuesta pública del usuario: nunca se expone el hash de la contraseña
type UserResponse = Omit<User, "contrasena">;
const toUserResponse = ({ contrasena, ...publicUser }: User): UserResponse => publicUser;

// Las respuestas usan el formato estándar de web/response.ts.
// Los errores (validación, no encontrado, conflicto, credenciales) los traduce el middleware global (web/errorMiddleware.ts)
export class UserController {
    private app: UserApplication;

    constructor(application: UserApplication) {
        this.app = application;
    }

    async login(req: Request, res: Response): Promise<Response> {
        const { correo, contrasena } = loadLoginData(req.body);

        const token = await this.app.login(correo, contrasena);

        return ok(res, { token }, "Login exitoso");
    }

    async createUser(req: Request, res: Response): Promise<Response> {
        //validar los datos que entran
        const { nombre, correo, contrasena, nivel_salud } = loadUserData(req.body);
        // El rol y el estado los asigna el servidor; un admin se promueve después con PUT /users/:id
        const user: Omit<User, "id"> = { nombre, correo, contrasena, rol: "usuario", nivel_salud, activo: true };
        const userId = await this.app.createUser(user);

        const nuevo = await this.app.getUserById(userId);
        return created(res, nuevo ? toUserResponse(nuevo) : { id: userId }, "Usuario creado exitosamente");
    }

    async updateUser(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);
        if (Number.isNaN(id)) return fail(res, 400, "ID inválido");

        // Solo el propio usuario o un admin pueden modificar la cuenta
        if (!canAccess(req, id)) return forbidden(res);

        const dataLoad = loadUpdateUserData(req.body);

        // Cambiar rol, estado u organización es exclusivo de administradores
        const cambiaCamposDeAdmin =
            dataLoad.rol !== undefined || dataLoad.activo !== undefined || dataLoad.organizacionId !== undefined;
        if (cambiaCamposDeAdmin && !isAdmin(req)) {
            return fail(res, 403, "Solo un administrador puede cambiar el rol, el estado o la organización");
        }

        const updated = await this.app.updateUser(id, dataLoad, req.user!.id);
        if (!updated) return fail(res, 404, "Usuario no encontrado");

        const user = await this.app.getUserById(id);
        return ok(res, user ? toUserResponse(user) : null, "Usuario actualizado correctamente");
    }

    async getUserById(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id)
        if (Number.isNaN(id)) return fail(res, 400, "ID inválido");

        if (!canAccess(req, id)) return forbidden(res);

        const user = await this.app.getUserById(id);
        if (!user) return fail(res, 404, "Usuario no encontrado");

        return ok(res, toUserResponse(user), "Usuario encontrado");
    }

    async getUserByEmail(req: Request, res: Response): Promise<Response> {
        //validacion del email usando Joi
        const { email } = loadEmail(req.params);

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

    async deleteUser(req: Request, res: Response): Promise<Response> {
        const id = parseId(req.params.id);
        if (Number.isNaN(id)) return fail(res, 400, "ID inválido");

        if (!canAccess(req, id)) return forbidden(res);

        const deleted = await this.app.deleteUser(id, req.user!.id);
        if (!deleted) return fail(res, 404, "Usuario no encontrado");

        return ok(res, null, "Usuario eliminado correctamente");
    }
}
