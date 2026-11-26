// Implements ReminderPort with TypeORM
import { Repository } from "typeorm";
import { Reminder as ReminderDomain } from "../../domain/Reminder.js";
import { ReminderPort } from "../../domain/ReminderPort.js";
import { Reminder as ReminderEntity } from "../entities/Reminder.js";
import { AppDataSource } from "../config/database.js";

export class ReminderAdapter implements ReminderPort {
    private repository: Repository<ReminderEntity>;

    constructor() {
        this.repository = AppDataSource.getRepository(ReminderEntity);
    }

    private toDomain(entity: ReminderEntity): ReminderDomain {
        return {
            id: entity.id,
            userId: entity.user_id,
            frequencyMinutes: entity.frequency_minutes,
            // PostgreSQL TIME arrives as HH:mm:ss; the API works with HH:mm
            startTime: entity.start_time.slice(0, 5),
            endTime: entity.end_time.slice(0, 5),
            active: entity.active,
        };
    }

    private toEntity(reminder: Omit<ReminderDomain, "id">): ReminderEntity {
        const entity = new ReminderEntity();
        entity.user_id = reminder.userId;
        entity.frequency_minutes = reminder.frequencyMinutes;
        entity.start_time = reminder.startTime;
        entity.end_time = reminder.endTime;
        entity.active = reminder.active;
        return entity;
    }

    async createReminder(reminder: Omit<ReminderDomain, "id">): Promise<number> {
        const saved = await this.repository.save(this.toEntity(reminder));
        return saved.id;
    }

    async updateReminder(id: number, reminder: Partial<ReminderDomain>): Promise<boolean> {
        const existing = await this.repository.findOne({ where: { id } });
        if (!existing) return false;

        Object.assign(existing, {
            user_id: reminder.userId ?? existing.user_id,
            frequency_minutes: reminder.frequencyMinutes ?? existing.frequency_minutes,
            start_time: reminder.startTime ?? existing.start_time,
            end_time: reminder.endTime ?? existing.end_time,
            active: reminder.active ?? existing.active,
        });
        await this.repository.save(existing);
        return true;
    }

    async deleteReminder(id: number): Promise<boolean> {
        const existing = await this.repository.findOne({ where: { id } });
        if (!existing) return false;

        // Logical delete
        existing.active = false;
        await this.repository.save(existing);
        return true;
    }

    async getReminderById(id: number): Promise<ReminderDomain | null> {
        const reminder = await this.repository.findOne({ where: { id } });
        return reminder ? this.toDomain(reminder) : null;
    }

    async getRemindersByUserId(userId: number): Promise<ReminderDomain[]> {
        const reminders = await this.repository.find({ where: { user_id: userId }, order: { id: "ASC" } });
        return reminders.map(r => this.toDomain(r));
    }

    async getAllReminders(): Promise<ReminderDomain[]> {
        const reminders = await this.repository.find({ order: { id: "ASC" } });
        return reminders.map(r => this.toDomain(r));
    }

    async getActiveReminders(): Promise<ReminderDomain[]> {
        const reminders = await this.repository.find({ where: { active: true }, order: { id: "ASC" } });
        return reminders.map(r => this.toDomain(r));
    }

    async countActiveByUser(userId: number): Promise<number> {
        return this.repository.count({ where: { user_id: userId, active: true } });
    }
}
