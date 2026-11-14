//Esta capa se encarga de hacer el intercambio de informacion directamente con la base de datos, por medio del typeORM
import { Repository } from "typeorm";
import { User as UserDomain } from "../../domain/User.js";
import { User as UserEntity } from "../entities/User.js"
import { UserPort } from "../../domain/UserPort.js";
import { AppDataSource } from "../config/data-base.js";

export class UserAdapter implements UserPort {
    private userRepository: Repository<UserEntity>;

    constructor() {
        this.userRepository = AppDataSource.getRepository(UserEntity);
    }
    //ENTITY -> DOMAIN
    private toDomain(userEntity: UserEntity): UserDomain {
        return {
            id: userEntity.id,
            nombre: userEntity.nombre,
            correo: userEntity.correo,
            nivel_salud: userEntity.nivel_salud as "bajo" | "medio" | "alto",
            contrasena: userEntity.contrasena_hash,
            rol: userEntity.rol,
            activo: userEntity.activo,
        };
    }
    //DOMAIN -> ENTITY
    private toEntity(userDomain: Omit<UserDomain, "id">): UserEntity {
        const userEntity = new UserEntity();
        userEntity.nombre = userDomain.nombre;
        userEntity.correo = userDomain.correo;
        userEntity.contrasena_hash = userDomain.contrasena;
        userEntity.rol = userDomain.rol;
        userEntity.nivel_salud = userDomain.nivel_salud;
        userEntity.activo = userDomain.activo;
        return userEntity;
    }




    //implementar los metodos de la interfaz UserPort
    async createUser(user: Omit<UserDomain, "id">): Promise<number> {
        try {
            const newUser = this.toEntity(user);
            const savedUser = await this.userRepository.save(newUser);
            return savedUser.id;
        } catch (error) {
            console.error("Error creando el usuario:", error);
            throw error;
        }
    }

    async updateUser(id: number, user: Partial<UserDomain>): Promise<boolean> {
        try {
            const existingUser = await this.userRepository.findOne({ where: { id: id } });
            if (!existingUser) return false;
            //actualizar solo los campos enviados
            Object.assign(existingUser, {
                nombre: user.nombre ?? existingUser.nombre,
                correo: user.correo ?? existingUser.correo,
                contrasena_hash: user.contrasena ?? existingUser.contrasena_hash,
                rol: user.rol ?? existingUser.rol,
                nivel_salud: user.nivel_salud ?? existingUser.nivel_salud,
                activo: user.activo ?? existingUser.activo,
            });
            await this.userRepository.save(existingUser);
            return true;
        } catch (error) {
            console.error("Error actualizando el usuario:", error);
            throw new Error("No se pudo actualizar el usuario");
        }
    }
    async deleteUser(id: number): Promise<boolean> {
        try {
            const existingUser = await this.userRepository.findOne({ where: { id: id } });
            if (!existingUser) return false;
            //actualiza solo el status a 0 para marcarlo como eliminado.
            Object.assign(existingUser, {
                activo: false,
            })
            await this.userRepository.save(existingUser);
            return true;
        } catch (error) {
            console.error("Error eliminando el usuario:", error);
            throw new Error("No se pudo eliminar el usuario");
        }
    }
    async getUserById(id: number): Promise<UserDomain | null> {
        try {
            const user = await this.userRepository.findOne({ where: { id: id } });
            return user ? this.toDomain(user) : null;
        } catch (error) {
            console.error("Error obteniendo el usuario por ID:", error);
            throw new Error("No se pudo obtener el usuario");
        }
    }
    async getUserByEmail(email: string): Promise<UserDomain | null> {
        //esto es otra forma de manejarlo pero hacen los mismo de la transformacion qeu esta al inicio de este documento
        const user = await this.userRepository.findOne({ where: { correo: email } });
        if (!user) return null;
        // ? "si user existe -> conviértelo" : "si no -> devuelve null"
        return user ? this.toDomain(user) : null;
    }
    async getAllUsers(): Promise<UserDomain[]> {
        try {
            const users = await this.userRepository.find({ order: { id: "ASC" } });
            return users.map(user => this.toDomain(user));
        } catch (error) {
            console.error("Error obteniendo todos los usuarios:", error);
            throw new Error("No se pudieron obtener los usuarios");
        }
    }
    async getActiveUsers(): Promise<UserDomain[]> {
        try {
            const users = await this.userRepository.find({ where: { activo: true }, order: { id: "ASC" } });
            return users.map(user => this.toDomain(user));
        } catch (error) {
            console.error("Error obteniendo todos los usuarios:", error);
            throw new Error("No se pudieron obtener los usuarios");
        }
    }
}