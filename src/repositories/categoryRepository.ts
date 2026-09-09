import { db } from "../database/db";
import type { Category } from "../database/db";
import { isCloudPersistenceEnabled } from "../database/persistence";
import { createCloudCategory, deleteCloudCategory, getCloudCategories, getCloudCategory, updateCloudCategory } from "./supabaseRepositories";

export async function getAllCategories(): Promise<Category[]> {
  if (isCloudPersistenceEnabled()) return getCloudCategories();
  return db.categories.toArray();
}

export async function getCategoriesByType(
  type: Category["type"]
): Promise<Category[]> {
  if (isCloudPersistenceEnabled()) return (await getCloudCategories()).filter((category) => category.type === type);
  return db.categories
    .where("type")
    .equals(type)
    .toArray();
}

export async function getCategoryById(
  id: string
): Promise<Category | undefined> {
  if (isCloudPersistenceEnabled()) return getCloudCategory(id);
  return db.categories.get(id);
}

export async function createCategory(
  category: Category
): Promise<string> {
  if (isCloudPersistenceEnabled()) return createCloudCategory(category);
  return db.categories.add(category);
}

export async function updateCategory(
  id: string,
  changes: Partial<Category>
): Promise<void> {
  if (isCloudPersistenceEnabled()) return updateCloudCategory(id, changes);
  await db.categories.update(id, changes);
}

export async function deleteCategory(
  id: string
): Promise<void> {
  if (isCloudPersistenceEnabled()) return deleteCloudCategory(id);
  await db.categories.delete(id);
}