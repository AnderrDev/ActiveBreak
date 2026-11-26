import { ValidationError } from "./errors.js";
import { ActiveBreak } from "./ActiveBreak.js";

// A break performed by a user
export interface ActivityHistory {
    id: number;
    userId: number;
    breakId: number;
    performedAt: Date;
    completed: boolean;
    actualDurationMinutes: number;
}

// Tolerance for the device clock when rejecting future dates
const FUTURE_TOLERANCE_MS = 60 * 1000;
// Extra minutes allowed over the break duration
const DURATION_MARGIN_MINUTES = 5;

// ---------- Domain rules ----------
export const ActivityHistoryRules = {
    assertValidRecord(record: Omit<ActivityHistory, "id">, activeBreak: ActiveBreak, now: Date): void {
        if (record.performedAt.getTime() > now.getTime() + FUTURE_TOLERANCE_MS) {
            throw new ValidationError("No se aceptan registros con fecha futura");
        }
        if (record.actualDurationMinutes > activeBreak.durationMinutes + DURATION_MARGIN_MINUTES) {
            throw new ValidationError("La duración real excede el tiempo permitido para esta pausa");
        }
        if (!record.completed && record.actualDurationMinutes > 0) {
            throw new ValidationError("No puede haber duración si la pausa no se completó");
        }
    },
};
