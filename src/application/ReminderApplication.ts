/*
Reminder use cases. The business rules live in domain/Reminder.ts (ReminderRules).
Operations on the reminders of the same user are serialized so the active quota
cannot be bypassed by simultaneous requests.
*/
import { Reminder, ReminderRules } from "../domain/Reminder.js";
import { ReminderPort } from "../domain/ReminderPort.js";
import { UserRules } from "../domain/User.js";
import { UserPort } from "../domain/UserPort.js";
import { NotFoundError } from "../domain/errors.js";
import { appLock } from "./KeyedLock.js";

const lockKey = (userId: number) => `reminders:user:${userId}`;

export class ReminderApplication {
    private port: ReminderPort;
    private userPort: UserPort;

    constructor(port: ReminderPort, userPort: UserPort) {
        this.port = port;
        this.userPort = userPort;
    }

    async createReminder(reminder: Omit<Reminder, "id">): Promise<number> {
        UserRules.ensureActive(await this.userPort.getUserById(reminder.userId));
        ReminderRules.assertValidFrequency(reminder.frequencyMinutes);
        ReminderRules.assertValidTimeRange(reminder.startTime, reminder.endTime);

        return appLock.run(lockKey(reminder.userId), async () => {
            if (reminder.active) {
                ReminderRules.assertActiveQuota(await this.port.countActiveByUser(reminder.userId));
            }
            return this.port.createReminder(reminder);
        });
    }

    async getReminderById(id: number): Promise<Reminder | null> {
        return this.port.getReminderById(id);
    }

    async getAllReminders(): Promise<Reminder[]> {
        return this.port.getAllReminders();
    }

    async getActiveReminders(): Promise<Reminder[]> {
        return this.port.getActiveReminders();
    }

    async getRemindersByUserId(userId: number): Promise<Reminder[]> {
        if (!(await this.userPort.getUserById(userId))) {
            throw new NotFoundError("El usuario no existe");
        }
        return this.port.getRemindersByUserId(userId);
    }

    async updateReminder(id: number, changes: Partial<Reminder>): Promise<boolean> {
        const existing = await this.findReminder(id);

        if (changes.frequencyMinutes !== undefined) {
            ReminderRules.assertValidFrequency(changes.frequencyMinutes);
        }
        if (changes.startTime !== undefined || changes.endTime !== undefined) {
            ReminderRules.assertValidTimeRange(changes.startTime ?? existing.startTime, changes.endTime ?? existing.endTime);
        }
        if (changes.userId !== undefined) {
            UserRules.ensureActive(await this.userPort.getUserById(changes.userId));
        }

        const targetUserId = changes.userId ?? existing.userId;
        return appLock.run(lockKey(targetUserId), async () => {
            if (ReminderRules.addsActiveReminder(existing, changes)) {
                ReminderRules.assertActiveQuota(await this.port.countActiveByUser(targetUserId));
            }
            return this.port.updateReminder(id, changes);
        });
    }

    async deleteReminder(id: number): Promise<boolean> {
        await this.findReminder(id);
        return this.port.deleteReminder(id);
    }

    private async findReminder(id: number): Promise<Reminder> {
        const reminder = await this.port.getReminderById(id);
        if (!reminder) throw new NotFoundError("El recordatorio no existe");
        return reminder;
    }
}
