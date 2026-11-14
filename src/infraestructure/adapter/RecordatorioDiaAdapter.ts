import { Repository } from "typeorm";
import { AppDataSource } from "../config/data-base.js";
import { RecordatorioDia as RecordatorioDiaDomain } from "../../domain/RecordatorioDia.js";
import { RecordatorioDia as RecordatorioDiaEntity } from "../entities/RecordatorioDia.js";
import { RecordatorioDiaPort } from "../../domain/RecordatorioDiaPort.js";

export class RecordatorioDiaAdapter implements RecordatorioDiaPort {

    private recordatorioDiaRepository: Repository<RecordatorioDiaEntity>;

    constructor() {
        this.recordatorioDiaRepository = AppDataSource.getRepository(RecordatorioDiaEntity);
    }

    // ENTITY -> DOMAIN
    private toDomain(entity: RecordatorioDiaEntity): RecordatorioDiaDomain {

        return {
            id: entity.id,
            recordatorioId: entity.recordatorio.id,
            diaSemana: entity.dia_semana
        };
    }

    // DOMAIN -> ENTITY
    private toEntity(domain: Omit<RecordatorioDiaDomain, "id">): RecordatorioDiaEntity {

        const entity = new RecordatorioDiaEntity();

        entity.recordatorio = { id: domain.recordatorioId } as any;
        entity.dia_semana = domain.diaSemana;

        return entity;
    }

    async createRecordatorioDia(data: Omit<RecordatorioDiaDomain, "id">): Promise<number> {

        const newEntity = this.toEntity(data);
        const saved = await this.recordatorioDiaRepository.save(newEntity);

        return saved.id;
    }

    async deleteRecordatorioDia(id: number): Promise<boolean> {

        const existing = await this.recordatorioDiaRepository.findOne({ where: { id } });

        if (!existing) return false;

        await this.recordatorioDiaRepository.remove(existing);

        return true;
    }

    async getById(id: number): Promise<RecordatorioDiaDomain | null> {

        const entity = await this.recordatorioDiaRepository.findOne({
            where: { id },
            relations: ["recordatorio"]
        });

        return entity ? this.toDomain(entity) : null;
    }

    async getAllRecordatorioDia(): Promise<RecordatorioDiaDomain[]> {

        const entities = await this.recordatorioDiaRepository.find({
            relations: ["recordatorio"],
            order: { id: "ASC" }
        });

        return entities.map(e => this.toDomain(e));
    }

    async getByRecordatorioId(recordatorioId: number): Promise<RecordatorioDiaDomain[]> {

        const entities = await this.recordatorioDiaRepository.find({
            where: {
                recordatorio: { id: recordatorioId }
            },
            relations: ["recordatorio"]
        });

        return entities.map(e => this.toDomain(e));
    }
}