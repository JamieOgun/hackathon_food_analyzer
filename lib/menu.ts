import fs from "node:fs";
import path from "node:path";
import type { MenuItem } from "./types";

let cached: MenuItem[] | null = null;

export function loadMenu(): MenuItem[] {
  if (cached) return cached;
  const csvPath = path.join(process.cwd(), "data", "menu.csv");
  const raw = fs.readFileSync(csvPath, "utf-8");
  const [header, ...rows] = raw.trim().split("\n");
  const cols = header.split(",").map((c) => c.trim());

  cached = rows
    .filter((row) => row.trim().length > 0)
    .map((row) => {
      const values = row.split(",");
      const obj: Record<string, string> = {};
      cols.forEach((c, i) => (obj[c] = (values[i] ?? "").trim()));
      return {
        dish_id: obj.dish_id,
        dish_name: obj.dish_name,
        price_yen: Number(obj.price_yen),
        food_cost_yen: Number(obj.food_cost_yen),
        daypart: obj.daypart as MenuItem["daypart"],
      };
    });

  return cached;
}

export function findMenuItem(dishName: string): MenuItem | null {
  return loadMenu().find((m) => m.dish_name === dishName) ?? null;
}

export function menuDishNames(): string[] {
  return loadMenu().map((m) => m.dish_name);
}
