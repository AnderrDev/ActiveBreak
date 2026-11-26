// Implements ReminderDayPort with TypeORM (physical delete)
import { Repository } from "typeorm";
import { ReminderDay as DayDomain } from "../../domain/ReminderDay.js";
import { ReminderDayPort } from "../../domain/ReminderDayPort.js";
import { ReminderDay as DayEntity } from "../entities/ReminderDay.js";
import { AppDataSource } from "../config/database.js";

export class ReminderDayAdapter implements ReminderDayPort {
    private repository: Repository<DayEntity>;

    constructor() {
        this.repository = AppDataSource.getRepository(DayEntity);
    }

    private toDomain(entity: DayEntity): DayDomain {
        return { id: entity.id, reminderId: entity.reminder_id, weekday: entity.weekday };
    }

    async createReminderDay(day: Omit<DayDomain, "id">): Promise<number> {
        const entity = new DayEntity();
        entity.reminder_id = day.reminderId;
        entity.weekday = day.weekday;
        const saved = await this.repository.save(entity);
        return saved.id;
    }

    async deleteReminderDay(id: number): Promise<boolean> {
        const existing = await this.repository.findOne({ where: { id } });
        if (!existing) return false;

        await this.repository.remove(existing);
        return true;
    }

    async getReminderDayById(id: number): Promise<DayDomain | null> {
        const day = await this.repository.findOne({ where: { id } });
        return day ? this.toDomain(day) : null;
    }

    async getAllReminderDays(): Promise<DayDomain[]> {
        const days = await this.repository.find({ order: { id: "ASC" } });
        return days.map(d => this.toDomain(d));
    }

    async getDaysByReminderId(reminderId: number): Promise<DayDomain[]> {
        const days = await this.repository.find({ where: { reminder_id: reminderId }, order: { id: "ASC" } });
        return days.map(d => this.toDomain(d));
    }
}
