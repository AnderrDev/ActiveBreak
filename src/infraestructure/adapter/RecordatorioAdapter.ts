import { Repository } from "typeorm";
import { Recordatorio as RecordatorioDomain } from "../../domain/Recordatorio.js";
import { Recordatorio as RecordatorioEntity } from "../entities/Recordatorio.js";
import { AppDataSource } from "../config/data-base.js";
import { RecordatorioPort } from "../../domain/RecordatorioPort.js";

export class RecordatorioAdapter implements RecordatorioPort {

    private recordatorioRepository: Repository<RecordatorioEntity>;

    constructor() {
        this.recordatorioRepository = AppDataSource.getRepository(RecordatorioEntity);
    }

    // ENTITY -> DOMAIN
    private toDomain(recordatorio: RecordatorioEntity): RecordatorioDomain {
        return {
            id: recordatorio.id,
            usuarioId: recordatorio.usuario.id,
            frecuenciaMinutos: recordatorio.frecuencia_minutos,
            horaInicio: recordatorio.hora_inicio,
            horaFin: recordatorio.hora_fin,
            activo: recordatorio.activo
        };
    }

    // DOMAIN -> ENTITY
    private toEntity(recordatorio: Omit<RecordatorioDomain, "id">): RecordatorioEntity {
        const entity = new RecordatorioEntity();

        //relación: solo pasamos el ID
        entity.usuario = { id: recordatorio.usuarioId } as any;

        entity.frecuencia_minutos = recordatorio.frecuenciaMinutos;
        entity.hora_inicio = recordatorio.horaInicio;
        entity.hora_fin = recordatorio.horaFin;
        entity.activo = recordatorio.activo;

        return entity;
    }

    async createRecordatorio(recordatorio: Omit<RecordatorioDomain, "id">): Promise<number> {
        const newRecordatorio = this.toEntity(recordatorio);
        const saved = await this.recordatorioRepository.save(newRecordatorio);
        return saved.id;
    }
    async updateRecordatorio(id: number, recordatorio: Partial<RecordatorioDomain>): Promise<boolean> {

        const existing = await this.recordatorioRepository.findOne({
            where: { id },
            relations: ["usuario"] //importante para acceder a usuario.id
        });

        if (!existing) return false;

        Object.assign(existing, {
            frecuencia_minutos: recordatorio.frecuenciaMinutos ?? existing.frecuencia_minutos,
            hora_inicio: recordatorio.horaInicio ?? existing.hora_inicio,
            hora_fin: recordatorio.horaFin ?? existing.hora_fin,
            activo: recordatorio.activo ?? existing.activo,
        });

        //si cambian el usuario
        if (recordatorio.usuarioId) {
            existing.usuario = { id: recordatorio.usuarioId } as any;
        }

        await this.recordatorioRepository.save(existing);
        return true;
    }
    async deleteRecordatorio(id: number): Promise<boolean> {

        const existing = await this.recordatorioRepository.findOne({ where: { id } });
        if (!existing) return false;

        // soft delete
        existing.activo = false;

        await this.recordatorioRepository.save(existing);
        return true;
    }
    async getRecordatorioById(id: number): Promise<RecordatorioDomain | null> {

        const recordatorio = await this.recordatorioRepository.findOne({ where: { id }, relations: ["usuario"] });

        return recordatorio ? this.toDomain(recordatorio) : null;
    }
    async getRecordatoriosByUsuarioId(usuarioId: number): Promise<RecordatorioDomain[]> {

        const recordatorios = await this.recordatorioRepository.find({ where: { usuario: { id: usuarioId } }, relations: ["usuario"], order: { id: "ASC" } });

        return recordatorios.map(r => this.toDomain(r));
    }
    async getAllRecordatorios(): Promise<RecordatorioDomain[]> {

        const recordatorios = await this.recordatorioRepository.find({ relations: ["usuario"], order: { id: "ASC" } });

        return recordatorios.map(r => this.toDomain(r));
    }
    async getActiveRecordatorios(): Promise<RecordatorioDomain[]> {

        const recordatorios = await this.recordatorioRepository.find({ where: { activo: true }, relations: ["usuario"], order: { id: "ASC" } });

        return recordatorios.map(r => this.toDomain(r));
    }

    async countActivosByUsuario(usuarioId: number): Promise<number> {
        return this.recordatorioRepository.count({ where: { usuario: { id: usuarioId }, activo: true } });
    }
}
