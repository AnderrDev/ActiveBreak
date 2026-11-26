// Implements UserPort with TypeORM. Maps entity (snake_case) <-> domain (camelCase).
// No try/catch: database errors go up to the global error middleware.
import { Repository } from "typeorm";
import { User as UserDomain } from "../../domain/User.js";
import { UserPort } from "../../domain/UserPort.js";
import { User as UserEntity } from "../entities/User.js";
import { AppDataSource } from "../config/database.js";

export class UserAdapter implements UserPort {
    private repository: Repository<UserEntity>;

    constructor() {
        this.repository = AppDataSource.getRepository(UserEntity);
    }

    private toDomain(entity: UserEntity): UserDomain {
        return {
            id: entity.id,
            name: entity.name,
            email: entity.email,
            password: entity.password_hash,
            role: entity.role,
            healthLevel: entity.health_level,
            active: entity.active,
            ...(entity.organization_id !== null && { organizationId: entity.organization_id }),
        };
    }

    private toEntity(user: Omit<UserDomain, "id">): UserEntity {
        const entity = new UserEntity();
        entity.name = user.name;
        entity.email = user.email;
        entity.password_hash = user.password;
        entity.role = user.role;
        entity.health_level = user.healthLevel;
        entity.active = user.active;
        entity.organization_id = user.organizationId ?? null;
        return entity;
    }

    async createUser(user: Omit<UserDomain, "id">): Promise<number> {
        const saved = await this.repository.save(this.toEntity(user));
        return saved.id;
    }

    async updateUser(id: number, user: Partial<UserDomain>): Promise<boolean> {
        const existing = await this.repository.findOne({ where: { id } });
        if (!existing) return false;

        // Only the fields that were sent are updated
        Object.assign(existing, {
            name: user.name ?? existing.name,
            email: user.email ?? existing.email,
            password_hash: user.password ?? existing.password_hash,
            role: user.role ?? existing.role,
            health_level: user.healthLevel ?? existing.health_level,
            active: user.active ?? existing.active,
            organization_id: user.organizationId ?? existing.organization_id,
        });
        await this.repository.save(existing);
        return true;
    }

    async deleteUser(id: number): Promise<boolean> {
        const existing = await this.repository.findOne({ where: { id } });
        if (!existing) return false;

        // Logical delete
        existing.active = false;
        await this.repository.save(existing);
        return true;
    }

    async getUserById(id: number): Promise<UserDomain | null> {
        const user = await this.repository.findOne({ where: { id } });
        return user ? this.toDomain(user) : null;
    }

    async getUserByEmail(email: string): Promise<UserDomain | null> {
        // Case-insensitive
        const user = await this.repository
            .createQueryBuilder("u")
            .where("LOWER(u.email) = LOWER(:email)", { email })
            .getOne();
        return user ? this.toDomain(user) : null;
    }

    async getAllUsers(): Promise<UserDomain[]> {
        const users = await this.repository.find({ order: { id: "ASC" } });
        return users.map(u => this.toDomain(u));
    }

    async getActiveUsers(): Promise<UserDomain[]> {
        const users = await this.repository.find({ where: { active: true }, order: { id: "ASC" } });
        return users.map(u => this.toDomain(u));
    }

    async countActiveAdmins(): Promise<number> {
        return this.repository.count({ where: { role: "admin", active: true } });
    }

    async countActiveByOrganization(organizationId: number): Promise<number> {
        return this.repository.count({ where: { organization_id: organizationId, active: true } });
    }
}
