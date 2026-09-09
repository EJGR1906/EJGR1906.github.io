import type { Category } from "../database/db";
import {
    getAllCategories,
} from "../repositories/categoryRepository";
import {
    getAllTransactions,
} from "../repositories/transactionRepository";
import {
    createCategory as persistCategory,
    deleteCategory as removeCategoryRecord,
    updateCategory as updateCategoryRecord,
} from "../repositories/categoryRepository";
import { generateId } from "../utils/id";

export interface CategoryInput {
    name: string;
    type: Category["type"];
}

function validateCategory(input: CategoryInput): string {
    const name = input.name.trim();
    if (!name) throw new Error("El nombre de la categoría es obligatorio.");
    if (name.length > 50) throw new Error("El nombre no puede superar 50 caracteres.");
    return name;
}

export async function addCategory(input: CategoryInput): Promise<Category> {
    const name = validateCategory(input);
    const existing = await getAllCategories();
    if (existing.some((category) => category.type === input.type && category.name.toLowerCase() === name.toLowerCase())) {
        throw new Error("Ya existe una categoría con ese nombre.");
    }

    const category: Category = { id: generateId("category"), name, type: input.type };
    await persistCategory(category);
    return category;
}

export async function editCategory(id: string, input: CategoryInput): Promise<void> {
    const name = validateCategory(input);
    const existing = await getAllCategories();
    if (existing.some((category) => category.id !== id && category.type === input.type && category.name.toLowerCase() === name.toLowerCase())) {
        throw new Error("Ya existe una categoría con ese nombre.");
    }
    await updateCategoryRecord(id, { name, type: input.type });
}

export async function removeCategory(id: string): Promise<void> {
    const transactions = (await getAllTransactions()).filter((transaction) => transaction.categoryId === id).length;
    if (transactions > 0) {
        throw new Error("No puedes eliminar una categoría que tiene movimientos asociados.");
    }
    await removeCategoryRecord(id);
}
