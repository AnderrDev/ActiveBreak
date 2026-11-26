import { Recordatorio } from "./Recordatorio.js";

export interface RecordatorioPort {

    createRecordatorio(recordatorio: Omit<Recordatorio, "id">): Promise<number>;

    updateRecordatorio(id: number, recordatorio: Partial<Recordatorio>): Promise<boolean>;

    deleteRecordatorio(id: number): Promise<boolean>;

    getRecordatorioById(id: number): Promise<Recordatorio | null>;

    getRecordatoriosByUsuarioId(usuarioId: number): Promise<Recordatorio[]>;

    getAllRecordatorios(): Promise<Recordatorio[]>;

    getActiveRecordatorios(): Promise<Recordatorio[]>;

    // Regla de negocio: máximo de recordatorios activos por usuario
    countActivosByUsuario(usuarioId: number): Promise<number>;
}