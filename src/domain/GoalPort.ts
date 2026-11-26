import { Goal } from "./Goal.js";

export interface GoalPort {
    createGoal(goal: Omit<Goal, "id">): Promise<number>;
    updateGoal(id: number, goal: Partial<Goal>): Promise<boolean>;
    deleteGoal(id: number): Promise<boolean>;
    getGoalById(id: number): Promise<Goal | null>;
    getGoalsByUserId(userId: number): Promise<Goal[]>;
    getAllGoals(): Promise<Goal[]>;
}
