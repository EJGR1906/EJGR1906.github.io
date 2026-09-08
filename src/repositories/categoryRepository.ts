import { db } from "../database/db";
import type { Category } from "../database/db";

export async function getAllCategories(): Promise<Category[]> {
  return db.categories.toArray();
}

export async function getCategoriesByType(
  type: Category["type"]
): Promise<Category[]> {
  return db.categories
    .where("type")
    .equals(type)
    .toArray();
}

export async function getCategoryById(
  id: string
): Promise<Category | undefined> {
  return db.categories.get(id);
}

export async function createCategory(
  category: Category
): Promise<string> {
  return db.categories.add(category);
}

export async function updateCategory(
  id: string,
  changes: Partial<Category>
): Promise<void> {
  await db.categories.update(id, changes);
}

export async function deleteCategory(
  id: string
): Promise<void> {
  await db.categories.delete(id);
}