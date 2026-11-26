import { ActivityHistory } from "./ActivityHistory.js";

export interface ActivityHistoryPort {
    createRecord(record: Omit<ActivityHistory, "id">): Promise<number>;
    getRecordById(id: number): Promise<ActivityHistory | null>;
    getAllRecords(): Promise<ActivityHistory[]>;
    getRecordsByUserId(userId: number): Promise<ActivityHistory[]>;
    getRecordsByBreakId(breakId: number): Promise<ActivityHistory[]>;
    deleteRecord(id: number): Promise<boolean>;

    // Completed breaks of a user between two dates (YYYY-MM-DD, both included)
    countCompletedInRange(userId: number, from: string, to: string): Promise<number>;
}
