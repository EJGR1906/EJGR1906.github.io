import { db } from "../database/db";
import type { Goal } from "../database/db";
import { isCloudPersistenceEnabled } from "../database/persistence";
import { createCloudGoal, deleteCloudGoal, getCloudGoal, getCloudGoals, updateCloudGoal } from "./supabaseRepositories";

export async function getAllGoals(): Promise<Goal[]> {
    if (isCloudPersistenceEnabled()) return getCloudGoals();
    return db.goals.orderBy("updatedAt").reverse().toArray();
}

export async function getGoalById(id: string): Promise<Goal | undefined> {
    if (isCloudPersistenceEnabled()) return getCloudGoal(id);
    return db.goals.get(id);
}

export async function getGoalsByAccount(accountId: string): Promise<Goal[]> {
    const goals = await db.goals.toArray();
    return goals.filter((goal) => goal.backingAccountId === accountId);
}

export async function createGoal(goal: Goal): Promise<string> {
    if (isCloudPersistenceEnabled()) return createCloudGoal(goal);
    return db.goals.add(goal);
}

export async function updateGoal(id: string, changes: Partial<Goal>): Promise<void> {
    if (isCloudPersistenceEnabled()) return updateCloudGoal(id, changes);
    await db.goals.update(id, changes);
}

export async function deleteGoal(id: string): Promise<void> {
    if (isCloudPersistenceEnabled()) return deleteCloudGoal(id);
    await db.goals.delete(id);
}
