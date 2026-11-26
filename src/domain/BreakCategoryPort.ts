import { BreakCategory } from "./BreakCategory.js";

export interface BreakCategoryPort {
    createCategory(category: Omit<BreakCategory, "id">): Promise<number>;
    updateCategory(id: number, category: Partial<BreakCategory>): Promise<boolean>;
    deleteCategory(id: number): Promise<boolean>;
    getCategoryById(id: number): Promise<BreakCategory | null>;

    // Case-insensitive lookup, used by the unique-name rule
    getCategoryByName(name: string): Promise<BreakCategory | null>;

    getAllCategories(): Promise<BreakCategory[]>;
    getActiveCategories(): Promise<BreakCategory[]>;
}
