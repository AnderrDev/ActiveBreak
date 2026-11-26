//aqui declaramos los metodos que necesitamos para interactuar con la entidad de usuario, es decir, los metodos que vamos a usar para crear, leer, actualizar y eliminar usuarios.

import { User } from "./User.js";

export interface UserPort {

    createUser(user: Omit<User, "id">): Promise<number>;

    updateUser(id: number, user: Partial<User>): Promise<boolean>;

    deleteUser(id: number): Promise<boolean>;

    getUserById(id: number): Promise<User | null>;

    getUserByEmail(email: string): Promise<User | null>;

    getAllUsers(): Promise<User[]>;

    getActiveUsers(): Promise<User[]>;

    // Reglas de negocio: siempre debe quedar un admin activo
    countActiveAdmins(): Promise<number>;

    // Reglas de negocio: no desactivar organizaciones con usuarios activos
    countActiveByOrganizacion(organizacionId: number): Promise<number>;
}