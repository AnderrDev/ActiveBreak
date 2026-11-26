/*
Break category use cases. The business rules live in domain/BreakCategory.ts (BreakCategoryRules).
*/
import { BreakCategory, BreakCategoryRules } from "../domain/BreakCategory.js";
import { BreakCategoryPort } from "../domain/BreakCategoryPort.js";
import { ActiveBreakPort } from "../domain/ActiveBreakPort.js";
import { NotFoundError } from "../domain/errors.js";

export class BreakCategoryApplication {
    private port: BreakCategoryPort;
    private breakPort: ActiveBreakPort;

    constructor(port: BreakCategoryPort, breakPort: ActiveBreakPort) {
        this.port = port;
        this.breakPort = breakPort;
    }

    async createCategory(category: Omit<BreakCategory, "id">): Promise<number> {
        BreakCategoryRules.assertNameAvailable(await this.port.getCategoryByName(category.name));
        return this.port.createCategory(category);
    }

    async getCategoryById(id: number): Promise<BreakCategory | null> {
        return this.port.getCategoryById(id);
    }

    async getAllCategories(): Promise<BreakCategory[]> {
        return this.port.getAllCategories();
    }

    async getActiveCategories(): Promise<BreakCategory[]> {
        return this.port.getActiveCategories();
    }

    async updateCategory(id: number, changes: Partial<BreakCategory>): Promise<boolean> {
        const existing = await this.findCategory(id);

        if (changes.name !== undefined) {
            BreakCategoryRules.assertNameAvailable(await this.port.getCategoryByName(changes.name), id);
        }

        if (changes.active === false && existing.active) {
            BreakCategoryRules.assertCanDeactivate(await this.breakPort.countActiveByCategory(id));
        }

        return this.port.updateCategory(id, changes);
    }

    async deleteCategory(id: number): Promise<boolean> {
        await this.findCategory(id);
        BreakCategoryRules.assertCanDeactivate(await this.breakPort.countActiveByCategory(id));
        return this.port.deleteCategory(id);
    }

    private async findCategory(id: number): Promise<BreakCategory> {
        const category = await this.port.getCategoryById(id);
        if (!category) throw new NotFoundError("La categoría no existe");
        return category;
    }
}
