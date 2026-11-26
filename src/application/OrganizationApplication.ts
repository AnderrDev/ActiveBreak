/*
Organization use cases. The business rules live in domain/Organization.ts (OrganizationRules).
*/
import { Organization, OrganizationRules } from "../domain/Organization.js";
import { OrganizationPort } from "../domain/OrganizationPort.js";
import { UserPort } from "../domain/UserPort.js";
import { NotFoundError } from "../domain/errors.js";

export class OrganizationApplication {
    private port: OrganizationPort;
    private userPort: UserPort;

    constructor(port: OrganizationPort, userPort: UserPort) {
        this.port = port;
        this.userPort = userPort;
    }

    async createOrganization(organization: Omit<Organization, "id">): Promise<number> {
        OrganizationRules.assertValidTaxId(organization.taxId);
        OrganizationRules.assertTaxIdAvailable(await this.port.getOrganizationByTaxId(organization.taxId));
        return this.port.createOrganization(organization);
    }

    async getOrganizationById(id: number): Promise<Organization | null> {
        return this.port.getOrganizationById(id);
    }

    async getAllOrganizations(): Promise<Organization[]> {
        return this.port.getAllOrganizations();
    }

    async getActiveOrganizations(): Promise<Organization[]> {
        return this.port.getActiveOrganizations();
    }

    async updateOrganization(id: number, changes: Partial<Organization>): Promise<boolean> {
        const existing = await this.findOrganization(id);

        if (changes.taxId !== undefined) {
            OrganizationRules.assertValidTaxId(changes.taxId);
            OrganizationRules.assertTaxIdAvailable(await this.port.getOrganizationByTaxId(changes.taxId), id);
        }

        if (changes.active === false && existing.active) {
            OrganizationRules.assertCanDeactivate(await this.userPort.countActiveByOrganization(id));
        }

        return this.port.updateOrganization(id, changes);
    }

    async deleteOrganization(id: number): Promise<boolean> {
        await this.findOrganization(id);
        OrganizationRules.assertCanDeactivate(await this.userPort.countActiveByOrganization(id));
        return this.port.deleteOrganization(id);
    }

    private async findOrganization(id: number): Promise<Organization> {
        const organization = await this.port.getOrganizationById(id);
        if (!organization) throw new NotFoundError("La organización no existe");
        return organization;
    }
}
