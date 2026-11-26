import { Organization } from "./Organization.js";

export interface OrganizationPort {
    createOrganization(organization: Omit<Organization, "id">): Promise<number>;
    updateOrganization(id: number, organization: Partial<Organization>): Promise<boolean>;
    deleteOrganization(id: number): Promise<boolean>;
    getOrganizationById(id: number): Promise<Organization | null>;
    getOrganizationByTaxId(taxId: string): Promise<Organization | null>;
    getAllOrganizations(): Promise<Organization[]>;
    getActiveOrganizations(): Promise<Organization[]>;
}
