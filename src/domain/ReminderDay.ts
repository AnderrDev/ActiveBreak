import { ConflictError, ValidationError } from "./errors.js";

export type Weekday = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export const WEEKDAYS: Weekday[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

// Day of the week on which a reminder applies
export interface ReminderDay {
    id: number;
    reminderId: number;
    weekday: Weekday;
}

// ---------- Domain rules ----------
export const ReminderDayRules = {
    // A reminder cannot repeat a weekday: neither in the request nor against the saved days
    assertNoRepeatedDays(requested: Weekday[], saved: ReminderDay[]): void {
        if (new Set(requested).size !== requested.length) {
            throw new ValidationError("No se pueden repetir días en la misma petición");
        }
        const repeated = saved.map(d => d.weekday).filter(day => requested.includes(day));
        if (repeated.length > 0) {
            throw new ConflictError(`El recordatorio ya tiene los días: ${repeated.join(", ")}`);
        }
    },
};
