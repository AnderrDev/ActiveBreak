import { Repository } from "typeorm";
import { Organizacion as OrganizacionDomain } from "../../domain/Organizacion.js";
import { Organizacion as OrganizacionEntity } from "../entities/Organizacion.js";
import { OrganizacionPort } from "../../domain/OrganizacionPort.js";
import { AppDataSource } from "../config/data-base.js";

export class OrganizacionAdapter implements OrganizacionPort {

    private organizacionRepository: Repository<OrganizacionEntity>;

    constructor() {
        this.organizacionRepository = AppDataSource.getRepository(OrganizacionEntity);
    }

    // ENTITY -> DOMAIN
    private toDomain(organizacion: OrganizacionEntity): OrganizacionDomain {
        const domain: OrganizacionDomain = {
            id: organizacion.id,
            nombre: organizacion.nombre,
            nit: organizacion.nit,
            activo: organizacion.activo
        };
        if (organizacion.sector !== null) {
            domain.sector = organizacion.sector;
        }
        return domain;
    }

    // DOMAIN -> ENTITY
    private toEntity(organizacion: Omit<OrganizacionDomain, "id">): OrganizacionEntity {
        const entity = new OrganizacionEntity();
        entity.nombre = organizacion.nombre;
        entity.nit = organizacion.nit;
        entity.sector = organizacion.sector ?? null;
        entity.activo = organizacion.activo;
        return entity;
    }

    async createOrganizacion(organizacion: Omit<OrganizacionDomain, "id">): Promise<number> {
        const saved = await this.organizacionRepository.save(this.toEntity(organizacion));
        return saved.id;
    }

    async updateOrganizacion(id: number, organizacion: Partial<OrganizacionDomain>): Promise<boolean> {
        const existing = await this.organizacionRepository.findOne({ where: { id } });
        if (!existing) return false;

        Object.assign(existing, {
            nombre: organizacion.nombre ?? existing.nombre,
            nit: organizacion.nit ?? existing.nit,
            sector: organizacion.sector ?? existing.sector,
            activo: organizacion.activo ?? existing.activo,
        });

        await this.organizacionRepository.save(existing);
        return true;
    }

    async deleteOrganizacion(id: number): Promise<boolean> {
        const existing = await this.organizacionRepository.findOne({ where: { id } });
        if (!existing) return false;

        // soft delete
        existing.activo = false;
        await this.organizacionRepository.save(existing);
        return true;
    }

    async getOrganizacionById(id: number): Promise<OrganizacionDomain | null> {
        const organizacion = await this.organizacionRepository.findOne({ where: { id } });
        return organizacion ? this.toDomain(organizacion) : null;
    }

    async getOrganizacionByNit(nit: string): Promise<OrganizacionDomain | null> {
        const organizacion = await this.organizacionRepository.findOne({ where: { nit } });
        return organizacion ? this.toDomain(organizacion) : null;
    }

    async getAllOrganizaciones(): Promise<OrganizacionDomain[]> {
        const organizaciones = await this.organizacionRepository.find({ order: { id: "ASC" } });
        return organizaciones.map(o => this.toDomain(o));
    }

    async getActiveOrganizaciones(): Promise<OrganizacionDomain[]> {
        const organizaciones = await this.organizacionRepository.find({ where: { activo: true }, order: { id: "ASC" } });
        return organizaciones.map(o => this.toDomain(o));
    }
}
