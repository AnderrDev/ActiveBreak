// Implements ActiveBreakPort with TypeORM
import { Repository } from "typeorm";
import { ActiveBreak as BreakDomain } from "../../domain/ActiveBreak.js";
import { ActiveBreakPort, CatalogFilters } from "../../domain/ActiveBreakPort.js";
import { ActiveBreak as BreakEntity } from "../entities/ActiveBreak.js";
import { AppDataSource } from "../config/database.js";

export class ActiveBreakAdapter implements ActiveBreakPort {
    private repository: Repository<BreakEntity>;

    constructor() {
        this.repository = AppDataSource.getRepository(BreakEntity);
    }

    private toDomain(entity: BreakEntity): BreakDomain {
        return {
            id: entity.id,
            name: entity.name,
            durationMinutes: entity.duration_minutes,
            intensity: entity.intensity,
            categoryId: entity.category_id,
            active: entity.active,
            ...(entity.description !== null && { description: entity.description }),
        };
    }

    private toEntity(activeBreak: Omit<BreakDomain, "id">): BreakEntity {
        const entity = new BreakEntity();
        entity.name = activeBreak.name;
        entity.description = activeBreak.description ?? null;
        entity.duration_minutes = activeBreak.durationMinutes;
        entity.intensity = activeBreak.intensity;
        entity.category_id = activeBreak.categoryId;
        entity.active = activeBreak.active;
        return entity;
    }

    async createBreak(activeBreak: Omit<BreakDomain, "id">): Promise<number> {
        const saved = await this.repository.save(this.toEntity(activeBreak));
        return saved.id;
    }

    async updateBreak(id: number, activeBreak: Partial<BreakDomain>): Promise<boolean> {
        const existing = await this.repository.findOne({ where: { id } });
        if (!existing) return false;

        Object.assign(existing, {
            name: activeBreak.name ?? existing.name,
            description: activeBreak.description ?? existing.description,
            duration_minutes: activeBreak.durationMinutes ?? existing.duration_minutes,
            intensity: activeBreak.intensity ?? existing.intensity,
            category_id: activeBreak.categoryId ?? existing.category_id,
            active: activeBreak.active ?? existing.active,
        });
        await this.repository.save(existing);
        return true;
    }

    async deleteBreak(id: number): Promise<boolean> {
        const existing = await this.repository.findOne({ where: { id } });
        if (!existing) return false;

        // Logical delete
        existing.active = false;
        await this.repository.save(existing);
        return true;
    }

    async getBreakById(id: number): Promise<BreakDomain | null> {
        const activeBreak = await this.repository.findOne({ where: { id } });
        return activeBreak ? this.toDomain(activeBreak) : null;
    }

    async getAllBreaks(): Promise<BreakDomain[]> {
        const breaks = await this.repository.find({ order: { id: "ASC" } });
        return breaks.map(b => this.toDomain(b));
    }

    async getActiveBreaks(filters: CatalogFilters = {}): Promise<BreakDomain[]> {
        const query = this.repository
            .createQueryBuilder("b")
            .where("b.active = true")
            .orderBy("b.id", "ASC");

        if (filters.categoryId !== undefined) {
            query.andWhere("b.category_id = :categoryId", { categoryId: filters.categoryId });
        }
        if (filters.intensity !== undefined) {
            query.andWhere("b.intensity = :intensity", { intensity: filters.intensity });
        }
        if (filters.maxDuration !== undefined) {
            query.andWhere("b.duration_minutes <= :maxDuration", { maxDuration: filters.maxDuration });
        }

        const breaks = await query.getMany();
        return breaks.map(b => this.toDomain(b));
    }

    async countActiveByCategory(categoryId: number): Promise<number> {
        return this.repository.count({ where: { category_id: categoryId, active: true } });
    }
}
