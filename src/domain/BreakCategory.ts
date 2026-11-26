import { ConflictError, NotFoundError, ValidationError } from "./errors.js";

// Category of the break catalog (neck, eyes, legs, breathing...)
export interface BreakCategory {
    id: number;
    name: string;
    description?: string;
    active: boolean;
}

// ---------- Domain rules ----------
export const BreakCategoryRules = {
    // The name is unique (the lookup is case-insensitive)
    assertNameAvailable(owner: BreakCategory | null, categoryId?: number): void {
        if (owner && owner.id !== categoryId) {
            throw new ConflictError("Ya existe una categoría con ese nombre");
        }
    },

    // A category with active breaks cannot be deactivated
    assertCanDeactivate(activeBreaks: number): void {
        if (activeBreaks > 0) {
            throw new ConflictError(`No se puede desactivar la categoría: tiene ${activeBreaks} pausa(s) activa(s)`);
        }
    },

    // A break can only belong to an existing and active category
    assertUsable(category: BreakCategory | null): void {
        if (!category) throw new NotFoundError("La categoría no existe");
        if (!category.active) throw new ValidationError("La categoría está inactiva");
    },
};
