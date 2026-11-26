/*
Active break use cases. The business rules live in domain/ActiveBreak.ts (ActiveBreakRules)
and domain/BreakCategory.ts (a break needs an active category).
*/
import { ActiveBreak, ActiveBreakRules } from "../domain/ActiveBreak.js";
import { ActiveBreakPort, CatalogFilters } from "../domain/ActiveBreakPort.js";
import { BreakCategoryRules } from "../domain/BreakCategory.js";
import { BreakCategoryPort } from "../domain/BreakCategoryPort.js";
import { NotFoundError } from "../domain/errors.js";

export class ActiveBreakApplication {
    private port: ActiveBreakPort;
    private categoryPort: BreakCategoryPort;

    constructor(port: ActiveBreakPort, categoryPort: BreakCategoryPort) {
        this.port = port;
        this.categoryPort = categoryPort;
    }

    async createBreak(activeBreak: Omit<ActiveBreak, "id">): Promise<number> {
        ActiveBreakRules.assertValidDuration(activeBreak.durationMinutes);
        BreakCategoryRules.assertUsable(await this.categoryPort.getCategoryById(activeBreak.categoryId));
        return this.port.createBreak(activeBreak);
    }

    async getBreakById(id: number): Promise<ActiveBreak | null> {
        return this.port.getBreakById(id);
    }

    async getAllBreaks(): Promise<ActiveBreak[]> {
        return this.port.getAllBreaks();
    }

    async getActiveBreaks(filters: CatalogFilters = {}): Promise<ActiveBreak[]> {
        return this.port.getActiveBreaks(filters);
    }

    async updateBreak(id: number, changes: Partial<ActiveBreak>): Promise<boolean> {
        const existing = await this.findBreak(id);

        if (changes.durationMinutes !== undefined) {
            ActiveBreakRules.assertValidDuration(changes.durationMinutes);
        }

        if (ActiveBreakRules.needsCategoryCheck(existing, changes)) {
            const categoryId = changes.categoryId ?? existing.categoryId;
            BreakCategoryRules.assertUsable(await this.categoryPort.getCategoryById(categoryId));
        }

        return this.port.updateBreak(id, changes);
    }

    async deleteBreak(id: number): Promise<boolean> {
        await this.findBreak(id);
        return this.port.deleteBreak(id);
    }

    private async findBreak(id: number): Promise<ActiveBreak> {
        const activeBreak = await this.port.getBreakById(id);
        if (!activeBreak) throw new NotFoundError("La pausa no existe");
        return activeBreak;
    }
}
