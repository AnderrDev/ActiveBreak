import { Repository } from "typeorm";
import { Meta as MetaDomain } from "../../domain/Meta.js";
import { Meta as MetaEntity } from "../entities/Meta.js";
import { MetaPort } from "../../domain/MetaPort.js";
import { AppDataSource } from "../config/data-base.js";

export class MetaAdapter implements MetaPort {

    private metaRepository: Repository<MetaEntity>;

    constructor() {
        this.metaRepository = AppDataSource.getRepository(MetaEntity);
    }

    // ENTITY -> DOMAIN
    private toDomain(meta: MetaEntity): MetaDomain {
        return {
            id: meta.id,
            usuarioId: meta.usuario_id,
            pausasObjetivo: meta.pausas_objetivo,
            fechaInicio: meta.fecha_inicio,
            fechaFin: meta.fecha_fin,
            estado: meta.estado,
            activo: meta.activo
        };
    }

    // DOMAIN -> ENTITY
    private toEntity(meta: Omit<MetaDomain, "id">): MetaEntity {
        const entity = new MetaEntity();
        entity.usuario_id = meta.usuarioId;
        entity.pausas_objetivo = meta.pausasObjetivo;
        entity.fecha_inicio = meta.fechaInicio;
        entity.fecha_fin = meta.fechaFin;
        entity.estado = meta.estado;
        entity.activo = meta.activo;
        return entity;
    }

    async createMeta(meta: Omit<MetaDomain, "id">): Promise<number> {
        const saved = await this.metaRepository.save(this.toEntity(meta));
        return saved.id;
    }

    async updateMeta(id: number, meta: Partial<MetaDomain>): Promise<boolean> {
        const existing = await this.metaRepository.findOne({ where: { id } });
        if (!existing) return false;

        Object.assign(existing, {
            pausas_objetivo: meta.pausasObjetivo ?? existing.pausas_objetivo,
            fecha_inicio: meta.fechaInicio ?? existing.fecha_inicio,
            fecha_fin: meta.fechaFin ?? existing.fecha_fin,
            estado: meta.estado ?? existing.estado,
            activo: meta.activo ?? existing.activo,
        });

        await this.metaRepository.save(existing);
        return true;
    }

    async deleteMeta(id: number): Promise<boolean> {
        const existing = await this.metaRepository.findOne({ where: { id } });
        if (!existing) return false;

        // soft delete
        existing.activo = false;
        await this.metaRepository.save(existing);
        return true;
    }

    async getMetaById(id: number): Promise<MetaDomain | null> {
        const meta = await this.metaRepository.findOne({ where: { id } });
        return meta ? this.toDomain(meta) : null;
    }

    async getMetasByUsuarioId(usuarioId: number): Promise<MetaDomain[]> {
        const metas = await this.metaRepository.find({ where: { usuario_id: usuarioId }, order: { fecha_inicio: "DESC" } });
        return metas.map(m => this.toDomain(m));
    }

    async getAllMetas(): Promise<MetaDomain[]> {
        const metas = await this.metaRepository.find({ order: { id: "ASC" } });
        return metas.map(m => this.toDomain(m));
    }
}
