import { RecordatorioDia } from "./RecordatorioDia.js";

export interface RecordatorioDiaPort {

    createRecordatorioDia(data: Omit<RecordatorioDia, "id">): Promise<number>;

    deleteRecordatorioDia(id: number): Promise<boolean>;

    getAllRecordatorioDia(): Promise<RecordatorioDia[]>;

    getById(id: number): Promise<RecordatorioDia | null>;

    getByRecordatorioId(recordatorioId: number): Promise<RecordatorioDia[]>;
}