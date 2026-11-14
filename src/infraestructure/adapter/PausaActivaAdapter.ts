import { Repository } from "typeorm";
import { PausaActiva as PausaDomain } from "../../domain/PausaActiva.js";
import { PausaActiva as PausaEntity } from "../entities/PausaActiva.js";
import { AppDataSource } from "../config/data-base.js";
import { PausaActivaPort } from "../../domain/PausaActivaPort.js";

export class PausaActivaAdapter implements PausaActivaPort {

    private pausaRepository: Repository<PausaEntity>;

    constructor() {
        this.pausaRepository = AppDataSource.getRepository(PausaEntity);
    }

    // ENTITY -> DOMAIN
    private toDomain(pausa: PausaEntity): PausaDomain {
        const domain: PausaDomain = {
            id: pausa.id,
            nombre: pausa.nombre,
            duracionMinutos: pausa.duracion_minutos,
            intensidad: pausa.intensidad as "baja" | "media" | "alta",
            activo: pausa.activo
        };

        if (pausa.descripcion !== null) {
            domain.descripcion = pausa.descripcion;
        }

        return domain;
    }

    // DOMAIN -> ENTITY
    private toEntity(pausa: Omit<PausaDomain, "id">): PausaEntity {
        const entity = new PausaEntity();
        entity.nombre = pausa.nombre;
        entity.descripcion = pausa.descripcion ?? null;
        entity.duracion_minutos = pausa.duracionMinutos;
        entity.intensidad = pausa.intensidad;
        entity.activo = pausa.activo;

        return entity;
    }

    async createPausaActiva(pausa: Omit<PausaDomain, "id">): Promise<number> {
        const newPausa = this.toEntity(pausa);
        const saved = await this.pausaRepository.save(newPausa);
        return saved.id;
    }

    async updatePausaActiva(id: number, pausa: Partial<PausaDomain>): Promise<boolean> {

        const existing = await this.pausaRepository.findOne({ where: { id } });
        if (!existing) return false;

        Object.assign(existing, {
            nombre: pausa.nombre ?? existing.nombre,
            descripcion: pausa.descripcion ?? existing.descripcion,
            duracion_minutos: pausa.duracionMinutos ?? existing.duracion_minutos,
            intensidad: pausa.intensidad ?? existing.intensidad,
            activo: pausa.activo ?? existing.activo,
        });

        await this.pausaRepository.save(existing);
        return true;
    }
    async deletePausaActiva(id: number): Promise<boolean> {

        const existing = await this.pausaRepository.findOne({ where: { id } });
        if (!existing) return false;

        // soft delete
        existing.activo = false;

        await this.pausaRepository.save(existing);
        return true;
    }
    async getByIdPausaActiva(id: number): Promise<PausaDomain | null> {

        const pausa = await this.pausaRepository.findOne({ where: { id } });

        return pausa ? this.toDomain(pausa) : null;
    }
    async getAllPausaActiva(): Promise<PausaDomain[]> {

        const pausas = await this.pausaRepository.find({
            order: { id: "ASC" }
        });

        return pausas.map(p => this.toDomain(p));
    }
    async getActivasPausaActiva(): Promise<PausaDomain[]> {

        const pausas = await this.pausaRepository.find({
            where: { activo: true },
            order: { id: "ASC" }
        });

        return pausas.map(p => this.toDomain(p));
    }
}