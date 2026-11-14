import { Repository } from "typeorm";
import { HistorialActividad as HistorialDomain } from "../../domain/Historial.js";
import { HistorialActividad as HistorialEntity } from "../entities/HistorialActividad.js";
import { HistorialPort } from "../../domain/HistorialPort.js";
import { AppDataSource } from "../config/data-base.js";

export class HistorialAdapter implements HistorialPort {

    private historialRepository: Repository<HistorialEntity>;

    constructor() {
        this.historialRepository = AppDataSource.getRepository(HistorialEntity);
    }

    // ENTITY -> DOMAIN
    private toDomain(historial: HistorialEntity): HistorialDomain {
        return {
            id: historial.id,
            usuarioId: historial.usuario.id,
            pausaId: historial.pausa.id,
            fechaHora: historial.fecha_hora,
            completado: historial.completado,
            duracionReal: historial.duracion_real
        };
    }

    // DOMAIN -> ENTITY
    private toEntity(historial: Omit<HistorialDomain, "id">): HistorialEntity {
        const entity = new HistorialEntity();

        // relaciones (solo IDs)
        entity.usuario = { id: historial.usuarioId } as any;
        entity.pausa = { id: historial.pausaId } as any;

        entity.fecha_hora = historial.fechaHora ?? new Date();
        entity.completado = historial.completado;
        entity.duracion_real = historial.duracionReal;

        return entity;
    }

    async createHistorial(historial: Omit<HistorialDomain, "id">): Promise<number> {
        const newHistorial = this.toEntity(historial);
        const saved = await this.historialRepository.save(newHistorial);
        return saved.id;
    }

    async getHistorialById(id: number): Promise<HistorialDomain | null> {
        const historial = await this.historialRepository.findOne({
            where: { id },
            relations: ["usuario", "pausa"]
        });

        return historial ? this.toDomain(historial) : null;
    }

    async getAllHistorial(): Promise<HistorialDomain[]> {
        const historial = await this.historialRepository.find({
            relations: ["usuario", "pausa"],
            order: { id: "ASC" }
        });

        return historial.map(h => this.toDomain(h));
    }

    async getHistorialByUsuarioId(usuarioId: number): Promise<HistorialDomain[]> {
        const historial = await this.historialRepository.find({ where: { usuario: { id: usuarioId } }, relations: ["usuario", "pausa"], order: { id: "ASC" } });

        return historial.map(h => this.toDomain(h));
    }

    async getHistorialByPausaId(pausaId: number): Promise<HistorialDomain[]> {
        const historial = await this.historialRepository.find({ where: { pausa: { id: pausaId } }, relations: ["usuario", "pausa"], order: { id: "ASC" } });

        return historial.map(h => this.toDomain(h));
    }

    async deleteHistorial(id: number): Promise<boolean> {
        const existing = await this.historialRepository.findOne({ where: { id } });

        if (!existing) return false;

        await this.historialRepository.remove(existing);
        return true;
    }
}