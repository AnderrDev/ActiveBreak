/*
EN ESTA CAPA ESTA:
- Validaciones de Lógica de negocio
- Están los SERVICIOS que se encargan de procesar la información, es decir, de realizar las operaciones necesarias para cumplir con los requerimientos del negocio.
*/
import { User } from "../domain/User.js";
import { UserPort } from "../domain/UserPort.js";
import bcrypt from "bcryptjs";
import { AuthApplication } from "./AuthApplication.js";
import { ConflictError, NotFoundError, UnauthorizedError } from "../domain/errors.js";

// Hash bcrypt (coste 12) de un valor aleatorio; solo sirve para igualar tiempos en el login
const DUMMY_HASH = bcrypt.hashSync(Math.random().toString(36), 12);

export class UserApplication {
    //Declarar atributo
    private port: UserPort;

    //Declarar método constructor para inyectar la dependencia del puerto
    constructor(port: UserPort) {
        this.port = port;
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

    async updateUser(id: number, user: Partial<User>): Promise<boolean> {
        const existingUser = await this.port.getUserById(id);
        if (!existingUser) {
            throw new NotFoundError("El usuario no existe");
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

    async deleteUser(id: number): Promise<boolean> {
        //validaciones de negocio
        const existingUser = await this.port.getUserById(id);
        if (!existingUser) {
            throw new NotFoundError("El usuario no existe");
        }
        return this.port.deleteUser(id);
    }

}