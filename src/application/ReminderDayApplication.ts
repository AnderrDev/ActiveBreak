/*
Reminder day use cases. The business rules live in domain/ReminderDay.ts (ReminderDayRules).
*/
import { ReminderDay, ReminderDayRules, Weekday } from "../domain/ReminderDay.js";
import { ReminderDayPort } from "../domain/ReminderDayPort.js";
import { NotFoundError } from "../domain/errors.js";
import { appLock } from "./KeyedLock.js";

export class ReminderDayApplication {
    private port: ReminderDayPort;

    constructor(port: ReminderDayPort) {
        this.port = port;
    }

    async createReminderDays(reminderId: number, weekdays: Weekday[]): Promise<number[]> {
        return appLock.run(`reminder-days:${reminderId}`, async () => {
            ReminderDayRules.assertNoRepeatedDays(weekdays, await this.port.getDaysByReminderId(reminderId));

            const ids: number[] = [];
            for (const weekday of weekdays) {
                ids.push(await this.port.createReminderDay({ reminderId, weekday }));
            }
            return ids;
        });
    }

    async getReminderDayById(id: number): Promise<ReminderDay | null> {
        return this.port.getReminderDayById(id);
    }

    async getAllReminderDays(): Promise<ReminderDay[]> {
        return this.port.getAllReminderDays();
    }

    async getDaysByReminderId(reminderId: number): Promise<ReminderDay[]> {
        return this.port.getDaysByReminderId(reminderId);
    }

    async deleteReminderDay(id: number): Promise<boolean> {
        if (!(await this.port.getReminderDayById(id))) {
            throw new NotFoundError("El día de recordatorio no existe");
        }
        return this.port.deleteReminderDay(id);
    }
}
