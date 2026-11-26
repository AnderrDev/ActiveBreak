import { Reminder } from "./Reminder.js";

export interface ReminderPort {
    createReminder(reminder: Omit<Reminder, "id">): Promise<number>;
    updateReminder(id: number, reminder: Partial<Reminder>): Promise<boolean>;
    deleteReminder(id: number): Promise<boolean>;
    getReminderById(id: number): Promise<Reminder | null>;
    getRemindersByUserId(userId: number): Promise<Reminder[]>;
    getAllReminders(): Promise<Reminder[]>;
    getActiveReminders(): Promise<Reminder[]>;

    // Business rule: maximum number of active reminders per user
    countActiveByUser(userId: number): Promise<number>;
}
