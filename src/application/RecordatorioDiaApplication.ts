import { RecordatorioDia } from "../domain/RecordatorioDia.js";
import { RecordatorioDiaPort } from "../domain/RecordatorioDiaPort.js";

export class RecordatorioDiaApplication {

    private port: RecordatorioDiaPort;

    constructor(port: RecordatorioDiaPort) {
        this.port = port;
    }

    async createRecordatorioDia(recordatorioId: number, diaSemana: string[]): Promise<number[]> {

        if (!recordatorioId) {
            throw new Error("El recordatorioId es obligatorio");
        }

        if (!diaSemana || diaSemana.length === 0) {
            throw new Error("Debes enviar al menos un día");
        }

        const diasValidos = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];

        const ids: number[] = [];

        for (const dia of diaSemana) {

            if (!diasValidos.includes(dia)) {
                throw new Error(`Día inválido: ${dia}`);
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
            throw new Error("recordatorioId es obligatorio");
        }

        return this.port.getByRecordatorioId(recordatorioId);
    }

    async delete(id: number): Promise<boolean> {

        const existing = await this.port.getById(id);

        if (!existing) {
            throw new Error("El registro no existe");
        }

        return this.port.deleteRecordatorioDia(id);
    }
}