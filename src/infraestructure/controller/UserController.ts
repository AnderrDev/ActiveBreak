import { UserApplication } from "../../application/UserApplication.js";
import { Request, Response } from "express";
import { loadUpdateUserData } from "../util/user-update-validation.js"
import { loadUserData } from "../util/user-validation.js";
import { User } from "../../domain/User.js";
import { loadEmail } from "../util/user-email-validation.js";
import { loadLoginData } from "../util/user-validation.js";
import { canAccess, forbidden, isAdmin } from "../web/authMiddleware.js";

// Respuesta pública del usuario: nunca se expone el hash de la contraseña
type UserResponse = Omit<User, "contrasena">;
const toUserResponse = ({ contrasena, ...publicUser }: User): UserResponse => publicUser;

// Los errores (validación, no encontrado, conflicto, credenciales) los traduce a HTTP
// el middleware global (web/errorMiddleware.ts)
export class UserController {
    private app: UserApplication;

    constructor(application: UserApplication) {
        this.app = application;
    }

    async login(req: Request, res: Response): Promise<Response> {
        const { correo, contrasena } = loadLoginData(req.body);

        const token = await this.app.login(correo, contrasena);

        return res.status(200).json({
            message: "Login exitoso",
            token
        });
    }

    async createUser(req: Request, res: Response): Promise<Response> {
        //validar los datos que entran
        const { nombre, correo, contrasena, nivel_salud } = loadUserData(req.body);
        // El rol y el estado los asigna el servidor; un admin se promueve después con PUT /users/:id
        const user: Omit<User, "id"> = { nombre, correo, contrasena, rol: "usuario", nivel_salud, activo: true };
        const userId = await this.app.createUser(user);

        return res.status(201).json({ message: "Usuario creado exitosamente", userId });
    }
    async updateUser(req: Request, res: Response): Promise<Response> {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ error: "El id del usuario debe ser un formato válido" });
        }

        // Solo el propio usuario o un admin pueden modificar la cuenta
        if (!canAccess(req, id)) return forbidden(res);

        const dataLoad = loadUpdateUserData(req.body);

        // Cambiar rol o estado es exclusivo de administradores
        if ((dataLoad.rol !== undefined || dataLoad.activo !== undefined) && !isAdmin(req)) {
            return res.status(403).json({ error: "Solo un administrador puede cambiar el rol o el estado" });
        }

        const updated = await this.app.updateUser(id, dataLoad);

        if (!updated) {
            return res
                .status(404)
                .json({ error: "Usuario no encontrado o sin cambios" })
        }
        return res
            .status(200)
            .json({ message: "Usuario actualizado con éxito" })
    }
    async getUserById(req: Request, res: Response): Promise<Response> {
        const id = Number(req.params.id)
        if (Number.isNaN(id)) return res.status(400).json({ error: "ID invalido" });

        if (!canAccess(req, id)) return forbidden(res);

        const user = await this.app.getUserById(id);
        if (!user)
            return res.status(404).json({ error: "Usuario no encontrado" });

        return res.status(200).json(toUserResponse(user));
    }
    async getUserByEmail(req: Request, res: Response): Promise<Response> {
        //validacion del email usando Joi
        const { email } = loadEmail(req.params);

        const user = await this.app.getUserByEmail(email);

        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        return res.status(200).json(toUserResponse(user));
    }
    async getAllUsers(req: Request, res: Response): Promise<Response> {
        const users = await this.app.getAllUsers();
        return res.status(200).json(users.map(toUserResponse));
    }
    async getActiveUsers(req: Request, res: Response): Promise<Response> {
        const users = await this.app.getActiveUsers();
        return res.status(200).json(users.map(toUserResponse));
    }
    async deleteUser(req: Request, res: Response): Promise<Response> {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) return res.status(400).json({ error: "ID en el formato inválido" });

        if (!canAccess(req, id)) return forbidden(res);

        const deleted = await this.app.deleteUser(id);
        if (!deleted)
            return res.status(404).json({ error: "Usuario no encontrado" });

        return res.status(202).json({ message: "Usuario eliminado con éxito" });
    }
}
