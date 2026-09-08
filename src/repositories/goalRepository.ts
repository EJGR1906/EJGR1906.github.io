import { db } from "../database/db";
import type { Goal } from "../database/db";

export async function getAllGoals(): Promise<Goal[]> {
    return db.goals.orderBy("updatedAt").reverse().toArray();
}

export async function getGoalById(id: string): Promise<Goal | undefined> {
    return db.goals.get(id);
}

export async function getGoalsByAccount(accountId: string): Promise<Goal[]> {
    const goals = await db.goals.toArray();
    return goals.filter((goal) => goal.backingAccountId === accountId);
}

export async function createGoal(goal: Goal): Promise<string> {
    return db.goals.add(goal);
}

export async function updateGoal(id: string, changes: Partial<Goal>): Promise<void> {
    await db.goals.update(id, changes);
}

export async function deleteGoal(id: string): Promise<void> {
    await db.goals.delete(id);
}
