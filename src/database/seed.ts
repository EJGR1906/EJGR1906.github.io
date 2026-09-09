import { db } from "./db";

export async function seedDatabase() {
  if (await db.categories.count() === 0) {
    await db.categories.bulkAdd([
      {
        id: "cat_food",
        name: "Alimentos",
        type: "expense",
        icon: "utensils",
      },
      {
        id: "cat_services",
        name: "Servicios",
        type: "expense",
        icon: "zap",
      },
      {
        id: "cat_transport",
        name: "Transporte",
        type: "expense",
        icon: "car",
      },
      {
        id: "cat_entertainment",
        name: "Entretenimiento",
        type: "expense",
        icon: "gamepad",
      },
      {
        id: "cat_housing",
        name: "Vivienda",
        type: "expense",
        icon: "house",
      },
      {
        id: "cat_shopping",
        name: "Compras",
        type: "expense",
        icon: "shopping-cart",
      },
      {
        id: "cat_salary",
        name: "Salario",
        type: "income",
        icon: "briefcase",
      },
      {
        id: "cat_other_income",
        name: "Otros ingresos",
        type: "income",
        icon: "plus-circle",
      },
    ]);
  }
}