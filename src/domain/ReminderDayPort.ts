import { ReminderDay } from "./ReminderDay.js";

export interface ReminderDayPort {
    createReminderDay(day: Omit<ReminderDay, "id">): Promise<number>;
    deleteReminderDay(id: number): Promise<boolean>;
    getReminderDayById(id: number): Promise<ReminderDay | null>;
    getAllReminderDays(): Promise<ReminderDay[]>;
    getDaysByReminderId(reminderId: number): Promise<ReminderDay[]>;
}
