// Implements BreakCategoryPort with TypeORM
import { Repository } from "typeorm";
import { BreakCategory as CategoryDomain } from "../../domain/BreakCategory.js";
import { BreakCategoryPort } from "../../domain/BreakCategoryPort.js";
import { BreakCategory as CategoryEntity } from "../entities/BreakCategory.js";
import { AppDataSource } from "../config/database.js";

export class BreakCategoryAdapter implements BreakCategoryPort {
    private repository: Repository<CategoryEntity>;

    constructor() {
        this.repository = AppDataSource.getRepository(CategoryEntity);
    }

    private toDomain(entity: CategoryEntity): CategoryDomain {
        return {
            id: entity.id,
            name: entity.name,
            active: entity.active,
            ...(entity.description !== null && { description: entity.description }),
        };
    }

    private toEntity(category: Omit<CategoryDomain, "id">): CategoryEntity {
        const entity = new CategoryEntity();
        entity.name = category.name;
        entity.description = category.description ?? null;
        entity.active = category.active;
        return entity;
    }

    async createCategory(category: Omit<CategoryDomain, "id">): Promise<number> {
        const saved = await this.repository.save(this.toEntity(category));
        return saved.id;
    }

    async updateCategory(id: number, category: Partial<CategoryDomain>): Promise<boolean> {
        const existing = await this.repository.findOne({ where: { id } });
        if (!existing) return false;

        Object.assign(existing, {
            name: category.name ?? existing.name,
            description: category.description ?? existing.description,
            active: category.active ?? existing.active,
        });
        await this.repository.save(existing);
        return true;
    }

    async deleteCategory(id: number): Promise<boolean> {
        const existing = await this.repository.findOne({ where: { id } });
        if (!existing) return false;

        // Logical delete
        existing.active = false;
        await this.repository.save(existing);
        return true;
    }

    async getCategoryById(id: number): Promise<CategoryDomain | null> {
        const category = await this.repository.findOne({ where: { id } });
        return category ? this.toDomain(category) : null;
    }

    async getCategoryByName(name: string): Promise<CategoryDomain | null> {
        const category = await this.repository
            .createQueryBuilder("c")
            .where("LOWER(c.name) = LOWER(:name)", { name })
            .getOne();
        return category ? this.toDomain(category) : null;
    }

    async getAllCategories(): Promise<CategoryDomain[]> {
        const categories = await this.repository.find({ order: { id: "ASC" } });
        return categories.map(c => this.toDomain(c));
    }

    async getActiveCategories(): Promise<CategoryDomain[]> {
        const categories = await this.repository.find({ where: { active: true }, order: { id: "ASC" } });
        return categories.map(c => this.toDomain(c));
    }
}
