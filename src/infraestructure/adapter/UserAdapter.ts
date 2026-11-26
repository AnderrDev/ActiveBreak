//Esta capa se encarga de hacer el intercambio de informacion directamente con la base de datos, por medio del typeORM
import { Repository } from "typeorm";
import { User as UserDomain } from "../../domain/User.js";
import { User as UserEntity } from "../entities/User.js"
import { UserPort } from "../../domain/UserPort.js";
import { AppDataSource } from "../config/data-base.js";

// Sin try/catch: cualquier error de la BD sube al middleware global (web/errorMiddleware.ts),
// que traduce duplicados a 409 y el resto a 500 sin exponer detalles.

export class UserAdapter implements UserPort {
    private userRepository: Repository<UserEntity>;

    constructor() {
        this.userRepository = AppDataSource.getRepository(UserEntity);
    }
    //ENTITY -> DOMAIN
    private toDomain(userEntity: UserEntity): UserDomain {
        const domain: UserDomain = {
            id: userEntity.id,
            nombre: userEntity.nombre,
            correo: userEntity.correo,
            nivel_salud: userEntity.nivel_salud as "bajo" | "medio" | "alto",
            contrasena: userEntity.contrasena_hash,
            rol: userEntity.rol,
            activo: userEntity.activo,
        };
        if (userEntity.organizacion_id !== null) {
            domain.organizacionId = userEntity.organizacion_id;
        }
        return domain;
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
        userEntity.organizacion_id = userDomain.organizacionId ?? null;
        return userEntity;
    }




    //implementar los metodos de la interfaz UserPort
    async createUser(user: Omit<UserDomain, "id">): Promise<number> {
        const newUser = this.toEntity(user);
        const savedUser = await this.userRepository.save(newUser);
        return savedUser.id;
    }

    async updateUser(id: number, user: Partial<UserDomain>): Promise<boolean> {
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
            organizacion_id: user.organizacionId ?? existingUser.organizacion_id,
        });
        await this.userRepository.save(existingUser);
        return true;
    }
    async deleteUser(id: number): Promise<boolean> {
        const existingUser = await this.userRepository.findOne({ where: { id: id } });
        if (!existingUser) return false;
        //actualiza solo el status a 0 para marcarlo como eliminado.
        Object.assign(existingUser, {
            activo: false,
        })
        await this.userRepository.save(existingUser);
        return true;
    }
    async getUserById(id: number): Promise<UserDomain | null> {
        const user = await this.userRepository.findOne({ where: { id: id } });
        return user ? this.toDomain(user) : null;
    }
    async getUserByEmail(email: string): Promise<UserDomain | null> {
        //esto es otra forma de manejarlo pero hacen los mismo de la transformacion qeu esta al inicio de este documento
        // Sin distinguir mayúsculas: los correos antiguos pueden estar guardados con mayúsculas
        const user = await this.userRepository
            .createQueryBuilder("u")
            .where("LOWER(u.correo) = LOWER(:email)", { email })
            .getOne();
        if (!user) return null;
        // ? "si user existe -> conviértelo" : "si no -> devuelve null"
        return user ? this.toDomain(user) : null;
    }
    async getAllUsers(): Promise<UserDomain[]> {
        const users = await this.userRepository.find({ order: { id: "ASC" } });
        return users.map(user => this.toDomain(user));
    }
    async getActiveUsers(): Promise<UserDomain[]> {
        const users = await this.userRepository.find({ where: { activo: true }, order: { id: "ASC" } });
        return users.map(user => this.toDomain(user));
    }

    async countActiveAdmins(): Promise<number> {
        return this.userRepository.count({ where: { rol: "admin", activo: true } });
    }

    async countActiveByOrganizacion(organizacionId: number): Promise<number> {
        return this.userRepository.count({ where: { organizacion_id: organizacionId, activo: true } });
    }
}
