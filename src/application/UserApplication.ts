/*
EN ESTA CAPA ESTA:
- Validaciones de Lógica de negocio
- Están los SERVICIOS que se encargan de procesar la información, es decir, de realizar las operaciones necesarias para cumplir con los requerimientos del negocio.
*/
import { User } from "../domain/User.js";
import { UserPort } from "../domain/UserPort.js";
import bcrypt from "bcryptjs";
import { AuthApplication } from "./AuthApplication.js";
import { OrganizacionPort } from "../domain/OrganizacionPort.js";
import { ConflictError, NotFoundError, UnauthorizedError, ValidationError } from "../domain/errors.js";

// Hash bcrypt (coste 12) de un valor aleatorio; solo sirve para igualar tiempos en el login
const DUMMY_HASH = bcrypt.hashSync(Math.random().toString(36), 12);

export class UserApplication {
    //Declarar atributo
    private port: UserPort;
    private organizacionPort: OrganizacionPort; // para asignar la organización del usuario

    //Declarar método constructor para inyectar la dependencia del puerto
    constructor(port: UserPort, organizacionPort: OrganizacionPort) {
        this.port = port;
        this.organizacionPort = organizacionPort;
    }

    // Reglas sobre administradores:
    // - un administrador no puede desactivarse a sí mismo
    // - siempre debe quedar al menos un administrador activo
    private async validarCambioDeAdmin(existing: User, actorId: number, pierdeAdmin: boolean, seDesactiva: boolean): Promise<void> {
        if (existing.rol !== "admin" || !existing.activo) return;

        if (seDesactiva && existing.id === actorId) {
            throw new ConflictError("Un administrador no puede desactivarse a sí mismo");
        }

        if (pierdeAdmin || seDesactiva) {
            const admins = await this.port.countActiveAdmins();
            if (admins <= 1) {
                throw new ConflictError("Debe quedar al menos un administrador activo");
            }
        }
    }

    private async validarOrganizacion(organizacionId: number): Promise<void> {
        const organizacion = await this.organizacionPort.getOrganizacionById(organizacionId);
        if (!organizacion) {
            throw new NotFoundError("La organización no existe");
        }
        if (!organizacion.activo) {
            throw new ValidationError("La organización está inactiva");
        }
    }

    async login(email: string, password: string): Promise<string> {
        const existUser = await this.port.getUserByEmail(email);

        // Se compara SIEMPRE contra un hash (uno ficticio si el usuario no existe) para que
        // el tiempo de respuesta no revele qué correos están registrados.
        const passMatch = await bcrypt.compare(password, existUser?.contrasena ?? DUMMY_HASH);

        // Mismo mensaje para correo inexistente, contraseña incorrecta o usuario inactivo
        if (!existUser || !passMatch || !existUser.activo) {
            throw new UnauthorizedError("Credenciales inválidas");
        }

        const token = AuthApplication.generateToken({
            id: existUser.id,
            email: existUser.correo,
            rol: existUser.rol
        });
        return token
    }

    //métodos 
    async createUser(user: Omit<User, "id">): Promise<number> {
        //Validaciones de negocio
        const existingUser = await this.port.getUserByEmail(user.correo);
        if (existingUser) {
            throw new ConflictError("El correo electrónico ya está registrado");
        }
        //Hasher la contraseña antes de guardar
        const hashedPassword = await bcrypt.hash(user.contrasena, 12);
        user.contrasena = hashedPassword;
        return this.port.createUser(user);
    }
    async getUserById(id: number): Promise<User | null> {
        return await this.port.getUserById(id);
    }
    async getUserByEmail(email: string): Promise<User | null> {
        return await this.port.getUserByEmail(email);
    }
    async getAllUsers(): Promise<User[]> {
        return await this.port.getAllUsers();
    }

    async getActiveUsers(): Promise<User[]> {
        return await this.port.getActiveUsers();
    }

    // actorId: id del usuario autenticado que hace el cambio
    async updateUser(id: number, user: Partial<User>, actorId: number): Promise<boolean> {
        const existingUser = await this.port.getUserById(id);
        if (!existingUser) {
            throw new NotFoundError("El usuario no existe");
        }

        await this.validarCambioDeAdmin(
            existingUser,
            actorId,
            user.rol !== undefined && user.rol !== "admin",
            user.activo === false
        );

        if (user.organizacionId !== undefined) {
            await this.validarOrganizacion(user.organizacionId);
        }

        if (user.correo) {
            const emailTaken = await this.port.getUserByEmail(user.correo);
            if (emailTaken && emailTaken.id !== id) {
                throw new ConflictError("El correo electrónico ya está registrado por otro usuario");
            }
        }

        if (user.contrasena) {
            const hashedPassword = await bcrypt.hash(user.contrasena, 12);
            user.contrasena = hashedPassword;
        }

        return this.port.updateUser(id, user);
    }

    async deleteUser(id: number, actorId: number): Promise<boolean> {
        //validaciones de negocio
        const existingUser = await this.port.getUserById(id);
        if (!existingUser) {
            throw new NotFoundError("El usuario no existe");
        }
        await this.validarCambioDeAdmin(existingUser, actorId, false, true);
        return this.port.deleteUser(id);
    }

}