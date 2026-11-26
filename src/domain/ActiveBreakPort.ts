import { ActiveBreak, Intensity } from "./ActiveBreak.js";

// Optional filters of the catalog
export interface CatalogFilters {
    categoryId?: number;
    intensity?: Intensity;
    maxDuration?: number;
}

export interface ActiveBreakPort {
    createBreak(activeBreak: Omit<ActiveBreak, "id">): Promise<number>;
    updateBreak(id: number, activeBreak: Partial<ActiveBreak>): Promise<boolean>;
    deleteBreak(id: number): Promise<boolean>;
    getBreakById(id: number): Promise<ActiveBreak | null>;
    getAllBreaks(): Promise<ActiveBreak[]>;
    getActiveBreaks(filters?: CatalogFilters): Promise<ActiveBreak[]>;

    // Business rule: a category in use cannot be deactivated
    countActiveByCategory(categoryId: number): Promise<number>;
}
