/*
Weekly goal use cases. The business rules live in domain/Goal.ts (GoalRules);
this service loads the goals and the progress, applies the rules and stores the status.
*/
import { Goal, GoalRules, GoalWithProgress } from "../domain/Goal.js";
import { GoalPort } from "../domain/GoalPort.js";
import { ActivityHistoryPort } from "../domain/ActivityHistoryPort.js";
import { UserRules } from "../domain/User.js";
import { UserPort } from "../domain/UserPort.js";
import { NotFoundError } from "../domain/errors.js";
import { appLock } from "./KeyedLock.js";
import { today } from "./clock.js";

// Goals of the same user are created/updated one at a time (overlap rule)
const lockKey = (userId: number) => `goals:user:${userId}`;

export type NewGoal = Pick<Goal, "userId" | "targetBreaks" | "startDate" | "endDate">;
export type GoalChanges = Partial<Pick<Goal, "targetBreaks" | "startDate" | "endDate">>;

export class GoalApplication {
    private port: GoalPort;
    private userPort: UserPort;
    private historyPort: ActivityHistoryPort;

    constructor(port: GoalPort, userPort: UserPort, historyPort: ActivityHistoryPort) {
        this.port = port;
        this.userPort = userPort;
        this.historyPort = historyPort;
    }

    async createGoal(goal: NewGoal): Promise<number> {
        UserRules.ensureActive(await this.userPort.getUserById(goal.userId));
        GoalRules.assertValidDates(goal.startDate, goal.endDate, today());

        return appLock.run(lockKey(goal.userId), async () => {
            GoalRules.assertNoOverlap(await this.port.getGoalsByUserId(goal.userId), goal.startDate, goal.endDate);

            const id = await this.port.createGoal({ ...goal, status: "in_progress", active: true });

            // It may already be completed if there are breaks registered in the range
            const created = await this.port.getGoalById(id);
            if (created) await this.refresh(created);

            return id;
        });
    }

    async getGoalById(id: number): Promise<GoalWithProgress | null> {
        const goal = await this.port.getGoalById(id);
        return goal ? this.refresh(goal) : null;
    }

    async getGoalsByUserId(userId: number): Promise<GoalWithProgress[]> {
        if (!(await this.userPort.getUserById(userId))) {
            throw new NotFoundError("El usuario no existe");
        }
        const goals = await this.port.getGoalsByUserId(userId);
        return Promise.all(goals.map(g => this.refresh(g)));
    }

    async getAllGoals(): Promise<GoalWithProgress[]> {
        const goals = await this.port.getAllGoals();
        return Promise.all(goals.map(g => this.refresh(g)));
    }

    async updateGoal(id: number, changes: GoalChanges): Promise<boolean> {
        const existing = await this.port.getGoalById(id);
        if (!existing || !existing.active) {
            throw new NotFoundError("La meta no existe");
        }

        return appLock.run(lockKey(existing.userId), async () => {
            // The stored status may be outdated: it is recomputed before deciding
            const current = await this.refresh(existing);
            GoalRules.assertModifiable(current.status);

            if (changes.startDate !== undefined || changes.endDate !== undefined) {
                const startDate = changes.startDate ?? existing.startDate;
                const endDate = changes.endDate ?? existing.endDate;
                GoalRules.assertValidDates(startDate, endDate, today());
                GoalRules.assertNoOverlap(await this.port.getGoalsByUserId(existing.userId), startDate, endDate, id);
            }

            const updated = await this.port.updateGoal(id, changes);

            const goal = await this.port.getGoalById(id);
            if (goal) await this.refresh(goal);

            return updated;
        });
    }

    async deleteGoal(id: number): Promise<boolean> {
        if (!(await this.port.getGoalById(id))) {
            throw new NotFoundError("La meta no existe");
        }
        return this.port.deleteGoal(id);
    }

    // Called every time the activity history of the user changes
    async recalculateUserGoals(userId: number): Promise<void> {
        const goals = await this.port.getGoalsByUserId(userId);
        for (const goal of goals.filter(g => g.active)) {
            await this.refresh(goal);
        }
    }

    // Loads the progress, applies the domain rule and stores the status when it changes
    private async refresh(goal: Goal): Promise<GoalWithProgress> {
        const completedBreaks = await this.historyPort.countCompletedInRange(goal.userId, goal.startDate, goal.endDate);
        const result = GoalRules.withProgress(goal, completedBreaks, today());

        if (goal.active && result.status !== goal.status) {
            await this.port.updateGoal(goal.id, { status: result.status });
        }
        return result;
    }
}
