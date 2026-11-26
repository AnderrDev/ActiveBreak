import { NotFoundError, ValidationError } from "./errors.js";

export type Intensity = "low" | "medium" | "high";

// Exercise of the active-break catalog
export interface ActiveBreak {
    id: number;
    name: string;
    description?: string;
    durationMinutes: number;
    intensity: Intensity;
    categoryId: number;
    active: boolean;
}

export const MIN_BREAK_DURATION = 1;
export const MAX_BREAK_DURATION = 30;

// ---------- Domain rules ----------
export const ActiveBreakRules = {
    assertValidDuration(minutes: number): void {
        if (minutes < MIN_BREAK_DURATION || minutes > MAX_BREAK_DURATION) {
            throw new ValidationError(`La duración debe estar entre ${MIN_BREAK_DURATION} y ${MAX_BREAK_DURATION} minutos`);
        }
    },

    // The category must be checked when it changes or when the break is reactivated
    needsCategoryCheck(existing: ActiveBreak, changes: Partial<ActiveBreak>): boolean {
        return changes.categoryId !== undefined || (changes.active === true && !existing.active);
    },

    // Only an existing and active break can be registered in the history
    ensureAvailable(activeBreak: ActiveBreak | null): ActiveBreak {
        if (!activeBreak) throw new NotFoundError("La pausa activa no existe");
        if (!activeBreak.active) throw new ValidationError("La pausa activa está inactiva");
        return activeBreak;
    },
};
