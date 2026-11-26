import { ConflictError, NotFoundError, ValidationError } from "./errors.js";

export type Role = "user" | "admin";
export type HealthLevel = "low" | "medium" | "high";

// Domain user. The domain never uses null: optional values use "?"
export interface User {
    id: number;
    name: string;
    email: string;
    password: string; // bcrypt hash once stored
    role: Role;
    healthLevel: HealthLevel;
    active: boolean;
    organizationId?: number;
}

// ---------- Domain rules ----------
export const UserRules = {
    // A user must exist and be active to operate (create reminders, goals, records...)
    ensureActive(user: User | null): User {
        if (!user) throw new NotFoundError("El usuario no existe");
        if (!user.active) throw new ValidationError("El usuario está inactivo");
        return user;
    },

    // Rules about admins:
    // - an admin cannot deactivate themselves
    // - there must always be at least one active admin
    assertAdminChangeAllowed(
        target: User,
        actorId: number,
        change: { losesAdminRole: boolean; isDeactivated: boolean },
        activeAdmins: number
    ): void {
        if (target.role !== "admin" || !target.active) return;

        if (change.isDeactivated && target.id === actorId) {
            throw new ConflictError("Un administrador no puede desactivarse a sí mismo");
        }

        if ((change.losesAdminRole || change.isDeactivated) && activeAdmins <= 1) {
            throw new ConflictError("Debe quedar al menos un administrador activo");
        }
    },

    // True when the change could leave the platform without this admin
    affectsAdmin(target: User, changes: Partial<User>): boolean {
        return target.role === "admin" && target.active &&
            ((changes.role !== undefined && changes.role !== "admin") || changes.active === false);
    },

    // The email is unique: it cannot belong to another user
    assertEmailAvailable(owner: User | null, userId?: number): void {
        if (owner && owner.id !== userId) {
            throw new ConflictError("El correo electrónico ya está registrado");
        }
    },
};
