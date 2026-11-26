/*
Activity history use cases. The business rules live in domain/ActivityHistory.ts
(ActivityHistoryRules). Every change recalculates the goals of the user.
*/
import { ActivityHistory, ActivityHistoryRules } from "../domain/ActivityHistory.js";
import { ActivityHistoryPort } from "../domain/ActivityHistoryPort.js";
import { ActiveBreakRules } from "../domain/ActiveBreak.js";
import { ActiveBreakPort } from "../domain/ActiveBreakPort.js";
import { UserRules } from "../domain/User.js";
import { UserPort } from "../domain/UserPort.js";
import { NotFoundError } from "../domain/errors.js";
import { GoalApplication } from "./GoalApplication.js";

export class ActivityHistoryApplication {
    private port: ActivityHistoryPort;
    private userPort: UserPort;
    private breakPort: ActiveBreakPort;
    private goals: GoalApplication;

    constructor(port: ActivityHistoryPort, userPort: UserPort, breakPort: ActiveBreakPort, goals: GoalApplication) {
        this.port = port;
        this.userPort = userPort;
        this.breakPort = breakPort;
        this.goals = goals;
    }

    async createRecord(record: Omit<ActivityHistory, "id">): Promise<number> {
        UserRules.ensureActive(await this.userPort.getUserById(record.userId));

        const activeBreak = ActiveBreakRules.ensureAvailable(await this.breakPort.getBreakById(record.breakId));
        ActivityHistoryRules.assertValidRecord(record, activeBreak, new Date());

        const id = await this.port.createRecord(record);
        await this.goals.recalculateUserGoals(record.userId);
        return id;
    }

    async getRecordById(id: number): Promise<ActivityHistory | null> {
        return this.port.getRecordById(id);
    }

    async getAllRecords(): Promise<ActivityHistory[]> {
        return this.port.getAllRecords();
    }

    async getRecordsByUserId(userId: number): Promise<ActivityHistory[]> {
        if (!(await this.userPort.getUserById(userId))) {
            throw new NotFoundError("El usuario no existe");
        }
        return this.port.getRecordsByUserId(userId);
    }

    async getRecordsByBreakId(breakId: number): Promise<ActivityHistory[]> {
        if (!(await this.breakPort.getBreakById(breakId))) {
            throw new NotFoundError("La pausa no existe");
        }
        return this.port.getRecordsByBreakId(breakId);
    }

    async deleteRecord(id: number): Promise<boolean> {
        const existing = await this.port.getRecordById(id);
        if (!existing) {
            throw new NotFoundError("El registro no existe");
        }

        const deleted = await this.port.deleteRecord(id);
        await this.goals.recalculateUserGoals(existing.userId);
        return deleted;
    }
}
