// Implements OrganizationPort with TypeORM
import { Repository } from "typeorm";
import { Organization as OrganizationDomain } from "../../domain/Organization.js";
import { OrganizationPort } from "../../domain/OrganizationPort.js";
import { Organization as OrganizationEntity } from "../entities/Organization.js";
import { AppDataSource } from "../config/database.js";

export class OrganizationAdapter implements OrganizationPort {
    private repository: Repository<OrganizationEntity>;

    constructor() {
        this.repository = AppDataSource.getRepository(OrganizationEntity);
    }

    private toDomain(entity: OrganizationEntity): OrganizationDomain {
        return {
            id: entity.id,
            name: entity.name,
            taxId: entity.tax_id,
            active: entity.active,
            ...(entity.sector !== null && { sector: entity.sector }),
        };
    }

    private toEntity(organization: Omit<OrganizationDomain, "id">): OrganizationEntity {
        const entity = new OrganizationEntity();
        entity.name = organization.name;
        entity.tax_id = organization.taxId;
        entity.sector = organization.sector ?? null;
        entity.active = organization.active;
        return entity;
    }

    async createOrganization(organization: Omit<OrganizationDomain, "id">): Promise<number> {
        const saved = await this.repository.save(this.toEntity(organization));
        return saved.id;
    }

    async updateOrganization(id: number, organization: Partial<OrganizationDomain>): Promise<boolean> {
        const existing = await this.repository.findOne({ where: { id } });
        if (!existing) return false;

        Object.assign(existing, {
            name: organization.name ?? existing.name,
            tax_id: organization.taxId ?? existing.tax_id,
            sector: organization.sector ?? existing.sector,
            active: organization.active ?? existing.active,
        });
        await this.repository.save(existing);
        return true;
    }

    async deleteOrganization(id: number): Promise<boolean> {
        const existing = await this.repository.findOne({ where: { id } });
        if (!existing) return false;

        // Logical delete
        existing.active = false;
        await this.repository.save(existing);
        return true;
    }

    async getOrganizationById(id: number): Promise<OrganizationDomain | null> {
        const organization = await this.repository.findOne({ where: { id } });
        return organization ? this.toDomain(organization) : null;
    }

    async getOrganizationByTaxId(taxId: string): Promise<OrganizationDomain | null> {
        const organization = await this.repository.findOne({ where: { tax_id: taxId } });
        return organization ? this.toDomain(organization) : null;
    }

    async getAllOrganizations(): Promise<OrganizationDomain[]> {
        const organizations = await this.repository.find({ order: { id: "ASC" } });
        return organizations.map(o => this.toDomain(o));
    }

    async getActiveOrganizations(): Promise<OrganizationDomain[]> {
        const organizations = await this.repository.find({ where: { active: true }, order: { id: "ASC" } });
        return organizations.map(o => this.toDomain(o));
    }
}
