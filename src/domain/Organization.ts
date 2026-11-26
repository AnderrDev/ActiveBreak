import { ConflictError, NotFoundError, ValidationError } from "./errors.js";

// Company or institution that uses the platform
export interface Organization {
    id: number;
    name: string;
    taxId: string; // Colombian NIT: 9 digits, hyphen and check digit (900123456-8)
    sector?: string;
    active: boolean;
}

// DIAN weights for the 9 digits of the NIT, left to right
const NIT_WEIGHTS = [41, 37, 29, 23, 19, 17, 13, 7, 3];

// ---------- Domain rules ----------
export const OrganizationRules = {
    // Check digit of a 9-digit NIT (DIAN algorithm)
    computeCheckDigit(nitNumber: string): number {
        const sum = nitNumber
            .split("")
            .reduce((total, digit, i) => total + Number(digit) * (NIT_WEIGHTS[i] ?? 0), 0);
        const remainder = sum % 11;
        return remainder > 1 ? 11 - remainder : remainder;
    },

    assertValidTaxId(taxId: string): void {
        const [nitNumber = "", checkDigit = ""] = taxId.split("-");
        if (OrganizationRules.computeCheckDigit(nitNumber) !== Number(checkDigit)) {
            throw new ValidationError("El dígito de verificación del NIT no es correcto");
        }
    },

    // The NIT is unique
    assertTaxIdAvailable(owner: Organization | null, organizationId?: number): void {
        if (owner && owner.id !== organizationId) {
            throw new ConflictError("Ya existe una organización con ese NIT");
        }
    },

    // An organization with active users cannot be deactivated
    assertCanDeactivate(activeUsers: number): void {
        if (activeUsers > 0) {
            throw new ConflictError(`No se puede desactivar la organización: tiene ${activeUsers} usuario(s) activo(s)`);
        }
    },

    // Only an existing and active organization can be assigned to a user
    assertAssignable(organization: Organization | null): void {
        if (!organization) throw new NotFoundError("La organización no existe");
        if (!organization.active) throw new ValidationError("La organización está inactiva");
    },
};
