import { UserApplication } from "../../application/UserApplication.js";
import { Request, Response } from "express";
import { loadUpdateUserData } from "../util/user-update-validation.js"
import { loadUserData } from "../util/user-validation.js";
import { User } from "../../domain/User.js";
import { loadEmail } from "../util/user-email-validation.js";
import { loadLoginData } from "../util/user-validation.js";

export class UserController {
    private app: UserApplication;

    constructor(application: UserApplication) {
        this.app = application;
    }

    async login(req: Request, res: Response): Promise<Response> {
        try {
            const { correo, contrasena } = loadLoginData(req.body);

            // Validación básica
            if (!correo || !contrasena) {
                return res.status(400).json({
                    error: "Email y contraseña son obligatorios"
                });
            }

            const token = await this.app.login(correo, contrasena);

            return res.status(200).json({
                message: "Login exitoso",
                token
            });

        } catch (error) {
            if (error instanceof Error) {
                return res.status(401).json({
                    details: error.message
                });
            }

            return res.status(500).json({
                error: "Error interno del servidor"
            });
        }
    }

    async createUser(req: Request, res: Response): Promise<Response> {
        try {
            //validar los datos que entran 
            const { nombre, correo, contrasena, rol, nivel_salud, activo } = loadUserData(req.body);
            const user: Omit<User, "id"> = { nombre, correo, contrasena, rol, nivel_salud, activo };
            const userId = await this.app.createUser(user);

            return res.status(201).json({ message: "Usuario creado exitosamente", userId });
        } catch (error) {
            if (error instanceof Error) {
                return res
                    .status(500)
                    .json({
                        error: "Error al crear el usuario",
                        details: error.message,
                    });
            }
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }
    async updateUser(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                return res.status(400).json({ error: "El id del usuario debe ser un formato válido" });
            }

            const dataLoad = loadUpdateUserData(req.body);
            const updated = await this.app.updateUser(id, dataLoad);

            if (!updated) {
                return res
                    .status(404)
                    .json({ error: "Usuario no encontrado o sin cambios" })
            }
            return res
                .status(200)
                .json({ message: "Usuario actualizado con éxito" })
        } catch (error) {

            if (error instanceof Error) {
                return res.status(500).json({ error: "Error al actualizar el usuario", details: error.message, });
            }
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }
    async getUserById(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id)
            if (Number.isNaN(id)) return res.status(400).json({ error: "ID invalido" });

            const user = await this.app.getUserById(id);
            if (!user)
                return res.status(404).json({ error: "Usuario no encontrado" });

            return res.status(200).json(user);

        } catch (error) {
            if (error instanceof Error) {
                return res
                    .status(500)
                    .json({
                        error: "Error interno del servidor",
                        datails: error.message
                    });
            }
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }
    async getUserByEmail(req: Request, res: Response): Promise<Response> {
        try {
            //validacion del email usando Joi
            const { email } = loadEmail(req.params);

            const user = await this.app.getUserByEmail(email);

            if (!user) {
                return res.status(404).json({ error: "Usuario no encontrado" });
            }
            return res.status(200).json(user);

        } catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message })
            }
            return res.status(500).json({
                error: "Error interno del servidor",
                datails: error instanceof Error ? error.message : "Error desconocido "
            });
        }
    }
    async getAllUsers(req: Request, res: Response): Promise<Response> {
        try {
            const users = await this.app.getAllUsers();
            return res.status(200).json(users);
        } catch (error) {
            return res.status(500).json({ message: "Error al obtener usuarios ", error });
        }
    }
    async getActiveUsers(req: Request, res: Response): Promise<Response> {
        try {
            const users = await this.app.getActiveUsers();
            return res.status(200).json(users);
        } catch (error) {
            return res.status(500).json({ message: "Error al obtener los usuarios activos", error })
        }
    }
    async deleteUser(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) return res.status(400).json({ error: "ID en el formato inválido" });

            const deleted = await this.app.deleteUser(id);
            if (!deleted)
                return res.status(404).json({ error: "Usuario no encontrado" });

            return res.status(202).json({ message: "Usuario eliminado con éxito" });

        } catch (error) {
            if (error instanceof Error) {
                return res
                    .status(500)
                    .json({
                        error: " Error interno del servidor",
                        details: error.message,
                    });
            }
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }
}

