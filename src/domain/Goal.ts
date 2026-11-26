import { ConflictError, ValidationError } from "./errors.js";

export type GoalStatus = "in_progress" | "completed" | "expired";

// Weekly goal of breaks of a user
export interface Goal {
    id: number;
    userId: number;
    targetBreaks: number;
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
    status: GoalStatus;
    active: boolean;
}

// Goal with its progress, computed from the activity history
export interface GoalWithProgress extends Goal {
    completedBreaks: number;
    progressPercentage: number; // 0 to 100
}

export const MAX_GOAL_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Days between two YYYY-MM-DD dates (end - start)
const daysBetween = (start: string, end: string): number =>
    Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / MS_PER_DAY);

const STATUS_LABELS: Record<GoalStatus, string> = { in_progress: "en curso", completed: "cumplida", expired: "vencida" };

// ---------- Domain rules ----------
// "today" is received as YYYY-MM-DD so the rules do not depend on the clock
export const GoalRules = {
    // A goal lasts at most 7 days and cannot end in the past
    assertValidDates(startDate: string, endDate: string, today: string): void {
        const days = daysBetween(startDate, endDate);
        if (days < 0) {
            throw new ValidationError("La fecha de fin debe ser igual o posterior a la fecha de inicio");
        }
        if (days + 1 > MAX_GOAL_DAYS) {
            throw new ValidationError(`Una meta semanal dura como máximo ${MAX_GOAL_DAYS} días`);
        }
        if (endDate < today) {
            throw new ValidationError("La meta no puede terminar en una fecha pasada");
        }
    },

    // A user cannot have two active goals whose dates overlap
    assertNoOverlap(goals: Goal[], startDate: string, endDate: string, goalId?: number): void {
        // Two ranges overlap when each one starts before the other ends
        const overlapping = goals.find(g =>
            g.active && g.id !== goalId && g.startDate <= endDate && startDate <= g.endDate
        );
        if (overlapping) {
            throw new ConflictError(`Ya tienes una meta activa entre ${overlapping.startDate} y ${overlapping.endDate}`);
        }
    },

    // Status from the progress: completed when the target is reached, expired when the date passes
    computeStatus(goal: Goal, completedBreaks: number, today: string): GoalStatus {
        if (completedBreaks >= goal.targetBreaks) return "completed";
        if (goal.endDate < today) return "expired";
        return "in_progress";
    },

    withProgress(goal: Goal, completedBreaks: number, today: string): GoalWithProgress {
        return {
            ...goal,
            status: GoalRules.computeStatus(goal, completedBreaks, today),
            completedBreaks,
            progressPercentage: Math.min(100, Math.round((completedBreaks / goal.targetBreaks) * 100)),
        };
    },

    // Only goals in progress can be modified
    assertModifiable(status: GoalStatus): void {
        if (status !== "in_progress") {
            throw new ConflictError(`Solo se pueden modificar metas en curso; esta meta está ${STATUS_LABELS[status]}`);
        }
    },
};
