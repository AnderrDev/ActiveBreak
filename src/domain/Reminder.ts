import { ConflictError, ValidationError } from "./errors.js";

// Break reminder configured by a user
export interface Reminder {
    id: number;
    userId: number;
    frequencyMinutes: number;
    startTime: string; // HH:mm
    endTime: string;   // HH:mm
    active: boolean;
}

export const MIN_REMINDER_FREQUENCY = 15;
export const MAX_REMINDER_FREQUENCY = 240;
export const MAX_ACTIVE_REMINDERS = 3;

// "14:30" or "14:30:00" -> minutes since midnight (870)
const toMinutes = (time: string): number => {
    const [hours = NaN, minutes = NaN] = time.split(":").map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
        throw new ValidationError("Formato de hora inválido (HH:mm)");
    }
    return hours * 60 + minutes;
};

// ---------- Domain rules ----------
export const ReminderRules = {
    assertValidFrequency(minutes: number): void {
        if (minutes < MIN_REMINDER_FREQUENCY || minutes > MAX_REMINDER_FREQUENCY) {
            throw new ValidationError(`La frecuencia debe estar entre ${MIN_REMINDER_FREQUENCY} y ${MAX_REMINDER_FREQUENCY} minutos`);
        }
    },

    assertValidTimeRange(startTime: string, endTime: string): void {
        if (toMinutes(endTime) <= toMinutes(startTime)) {
            throw new ValidationError("La hora de fin debe ser posterior a la hora de inicio");
        }
    },

    // True when the change adds one more active reminder to the target user
    // (it is reactivated, or an active reminder is moved to another user)
    addsActiveReminder(existing: Reminder, changes: Partial<Reminder>): boolean {
        const staysActive = changes.active ?? existing.active;
        const targetUserId = changes.userId ?? existing.userId;
        return staysActive && (!existing.active || targetUserId !== existing.userId);
    },

    // At most 3 active reminders per user
    assertActiveQuota(activeReminders: number): void {
        if (activeReminders >= MAX_ACTIVE_REMINDERS) {
            throw new ConflictError(`Un usuario puede tener como máximo ${MAX_ACTIVE_REMINDERS} recordatorios activos`);
        }
    },
};
