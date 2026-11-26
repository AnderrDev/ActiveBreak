// Implements GoalPort with TypeORM
import { Repository } from "typeorm";
import { Goal as GoalDomain } from "../../domain/Goal.js";
import { GoalPort } from "../../domain/GoalPort.js";
import { Goal as GoalEntity } from "../entities/Goal.js";
import { AppDataSource } from "../config/database.js";

export class GoalAdapter implements GoalPort {
    private repository: Repository<GoalEntity>;

    constructor() {
        this.repository = AppDataSource.getRepository(GoalEntity);
    }

    private toDomain(entity: GoalEntity): GoalDomain {
        return {
            id: entity.id,
            userId: entity.user_id,
            targetBreaks: entity.target_breaks,
            startDate: entity.start_date,
            endDate: entity.end_date,
            status: entity.status,
            active: entity.active,
        };
    }

    private toEntity(goal: Omit<GoalDomain, "id">): GoalEntity {
        const entity = new GoalEntity();
        entity.user_id = goal.userId;
        entity.target_breaks = goal.targetBreaks;
        entity.start_date = goal.startDate;
        entity.end_date = goal.endDate;
        entity.status = goal.status;
        entity.active = goal.active;
        return entity;
    }

    async createGoal(goal: Omit<GoalDomain, "id">): Promise<number> {
        const saved = await this.repository.save(this.toEntity(goal));
        return saved.id;
    }

    async updateGoal(id: number, goal: Partial<GoalDomain>): Promise<boolean> {
        const existing = await this.repository.findOne({ where: { id } });
        if (!existing) return false;

        Object.assign(existing, {
            target_breaks: goal.targetBreaks ?? existing.target_breaks,
            start_date: goal.startDate ?? existing.start_date,
            end_date: goal.endDate ?? existing.end_date,
            status: goal.status ?? existing.status,
            active: goal.active ?? existing.active,
        });
        await this.repository.save(existing);
        return true;
    }

    async deleteGoal(id: number): Promise<boolean> {
        const existing = await this.repository.findOne({ where: { id } });
        if (!existing) return false;

        // Logical delete
        existing.active = false;
        await this.repository.save(existing);
        return true;
    }

    async getGoalById(id: number): Promise<GoalDomain | null> {
        const goal = await this.repository.findOne({ where: { id } });
        return goal ? this.toDomain(goal) : null;
    }

    async getGoalsByUserId(userId: number): Promise<GoalDomain[]> {
        const goals = await this.repository.find({ where: { user_id: userId }, order: { start_date: "DESC" } });
        return goals.map(g => this.toDomain(g));
    }

    async getAllGoals(): Promise<GoalDomain[]> {
        const goals = await this.repository.find({ order: { id: "ASC" } });
        return goals.map(g => this.toDomain(g));
    }
}
