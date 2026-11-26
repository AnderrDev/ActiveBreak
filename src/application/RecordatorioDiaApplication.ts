import { RecordatorioDia } from "../domain/RecordatorioDia.js";
import { RecordatorioDiaPort } from "../domain/RecordatorioDiaPort.js";
import { ConflictError, NotFoundError, ValidationError } from "../domain/errors.js";

export class RecordatorioDiaApplication {

    private port: RecordatorioDiaPort;

    constructor(port: RecordatorioDiaPort) {
        this.port = port;
    }

    async createRecordatorioDia(recordatorioId: number, diaSemana: string[]): Promise<number[]> {

        if (!recordatorioId) {
            throw new ValidationError("El recordatorioId es obligatorio");
        }

        if (!diaSemana || diaSemana.length === 0) {
            throw new ValidationError("Debes enviar al menos un día");
        }

        const diasValidos = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];

        // No se repiten días: ni dentro de la petición ni con los ya guardados
        if (new Set(diaSemana).size !== diaSemana.length) {
            throw new ValidationError("No se pueden repetir días en la misma petición");
        }
        const existentes = await this.port.getByRecordatorioId(recordatorioId);
        const repetidos = existentes.map(d => d.diaSemana).filter(d => diaSemana.includes(d));
        if (repetidos.length > 0) {
            throw new ConflictError(`El recordatorio ya tiene los días: ${repetidos.join(", ")}`);
        }

        const ids: number[] = [];

        for (const dia of diaSemana) {

            if (!diasValidos.includes(dia)) {
                throw new ValidationError(`Día inválido: ${dia}`);
            }

            const id = await this.port.createRecordatorioDia({ recordatorioId, diaSemana: dia as any });

            ids.push(id);
        }

        return ids;
    }

    async getById(id: number): Promise<RecordatorioDia | null> {
        return this.port.getById(id);
    }

    async getAll(): Promise<RecordatorioDia[]> {
        return this.port.getAllRecordatorioDia();
    }

    async getByRecordatorioId(recordatorioId: number): Promise<RecordatorioDia[]> {

        if (!recordatorioId) {
            throw new ValidationError("recordatorioId es obligatorio");
        }

        return this.port.getByRecordatorioId(recordatorioId);
    }

    async delete(id: number): Promise<boolean> {

        const existing = await this.port.getById(id);

        if (!existing) {
            throw new NotFoundError("El registro no existe");
        }

        return this.port.deleteRecordatorioDia(id);
    }
}