// Implements ActivityHistoryPort with TypeORM (insert-only log, physical delete)
import { Repository } from "typeorm";
import { ActivityHistory as HistoryDomain } from "../../domain/ActivityHistory.js";
import { ActivityHistoryPort } from "../../domain/ActivityHistoryPort.js";
import { ActivityHistory as HistoryEntity } from "../entities/ActivityHistory.js";
import { AppDataSource } from "../config/database.js";

export class ActivityHistoryAdapter implements ActivityHistoryPort {
    private repository: Repository<HistoryEntity>;

    constructor() {
        this.repository = AppDataSource.getRepository(HistoryEntity);
    }

    private toDomain(entity: HistoryEntity): HistoryDomain {
        return {
            id: entity.id,
            userId: entity.user_id,
            breakId: entity.break_id,
            performedAt: entity.performed_at,
            completed: entity.completed,
            actualDurationMinutes: entity.actual_duration_minutes,
        };
    }

    async createRecord(record: Omit<HistoryDomain, "id">): Promise<number> {
        const entity = new HistoryEntity();
        entity.user_id = record.userId;
        entity.break_id = record.breakId;
        entity.performed_at = record.performedAt;
        entity.completed = record.completed;
        entity.actual_duration_minutes = record.actualDurationMinutes;
        const saved = await this.repository.save(entity);
        return saved.id;
    }

    async getRecordById(id: number): Promise<HistoryDomain | null> {
        const record = await this.repository.findOne({ where: { id } });
        return record ? this.toDomain(record) : null;
    }

    async getAllRecords(): Promise<HistoryDomain[]> {
        const records = await this.repository.find({ order: { id: "ASC" } });
        return records.map(r => this.toDomain(r));
    }

    async getRecordsByUserId(userId: number): Promise<HistoryDomain[]> {
        const records = await this.repository.find({ where: { user_id: userId }, order: { performed_at: "DESC" } });
        return records.map(r => this.toDomain(r));
    }

    async getRecordsByBreakId(breakId: number): Promise<HistoryDomain[]> {
        const records = await this.repository.find({ where: { break_id: breakId }, order: { performed_at: "DESC" } });
        return records.map(r => this.toDomain(r));
    }

    async deleteRecord(id: number): Promise<boolean> {
        const existing = await this.repository.findOne({ where: { id } });
        if (!existing) return false;

        await this.repository.remove(existing);
        return true;
    }

    async countCompletedInRange(userId: number, from: string, to: string): Promise<number> {
        // From the start of day "from" to the end of day "to"
        return this.repository
            .createQueryBuilder("h")
            .where("h.user_id = :userId", { userId })
            .andWhere("h.completed = true")
            .andWhere("h.performed_at >= CAST(:from AS date)", { from })
            .andWhere("h.performed_at < CAST(:to AS date) + 1", { to })
            .getCount();
    }
}
