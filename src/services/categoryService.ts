import { db, type Category } from "../database/db";
import {
    createCategory,
    deleteCategory,
    updateCategory,
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
    const existing = await db.categories.toArray();
    if (existing.some((category) => category.type === input.type && category.name.toLowerCase() === name.toLowerCase())) {
        throw new Error("Ya existe una categoría con ese nombre.");
    }

    const category: Category = { id: generateId("category"), name, type: input.type };
    await createCategory(category);
    return category;
}

export async function editCategory(id: string, input: CategoryInput): Promise<void> {
    const name = validateCategory(input);
    const existing = await db.categories.toArray();
    if (existing.some((category) => category.id !== id && category.type === input.type && category.name.toLowerCase() === name.toLowerCase())) {
        throw new Error("Ya existe una categoría con ese nombre.");
    }
    await updateCategory(id, { name, type: input.type });
}

export async function removeCategory(id: string): Promise<void> {
    const transactions = await db.transactions.where("categoryId").equals(id).count();
    if (transactions > 0) {
        throw new Error("No puedes eliminar una categoría que tiene movimientos asociados.");
    }
    await deleteCategory(id);
}
