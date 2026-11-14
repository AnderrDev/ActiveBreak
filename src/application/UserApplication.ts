/*
EN ESTA CAPA ESTA:
- Validaciones de Lógica de negocio
- Están los SERVICIOS que se encargan de procesar la información, es decir, de realizar las operaciones necesarias para cumplir con los requerimientos del negocio.
*/
import { User } from "../domain/User.js";
import { UserPort } from "../domain/UserPort.js";
import bcrypt from "bcryptjs";
import { AuthApplication } from "./AuthApplication.js";

export class UserApplication {
    //Declarar atributo
    private port: UserPort;

    //Declarar método constructor para inyectar la dependencia del puerto
    constructor(port: UserPort) {
        this.port = port;
    }

    async login(email: string, password: string): Promise<string> {
        const existUser = await this.port.getUserByEmail(email);
        if (!existUser) {
            throw new Error("Credenciales inválidas");
        }
        //validar status
        if (!existUser.activo) {
            throw new Error("Usuario inactivo");
        }
        //comparar los password
        const passMatch = await bcrypt.compare(password, existUser.contrasena);
        if (!passMatch) {
            throw new Error("Credenciales inválidas")
        }
        const token = AuthApplication.generateToken({
            id: existUser.id,
            email: existUser.correo
        });
        return token
    }

    //métodos 
    async createUser(user: Omit<User, "id">): Promise<number> {
        //Validaciones de negocio
        const existingUser = await this.port.getUserByEmail(user.correo);
        if (existingUser) {
            throw new Error("El correo electrónico ya está registrado");
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
            throw new Error("El usuario no existe");
        }

        if (user.correo) {
            const emailTaken = await this.port.getUserByEmail(user.correo);
            if (emailTaken && emailTaken.id !== id) {
                throw new Error("El correo electrónico ya está registrado por otro usuario");
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
            throw new Error("El usuario no existe");
        }
        return this.port.deleteUser(id);
    }

}