import { PausaActiva } from "./PausaActiva.js";

export interface PausaActivaPort {

    createPausaActiva(pausa: Omit<PausaActiva, "id">): Promise<number>;

    updatePausaActiva(id: number, pausa: Partial<PausaActiva>): Promise<boolean>;

    deletePausaActiva(id: number): Promise<boolean>;

    getByIdPausaActiva(id: number): Promise<PausaActiva | null>;

    getAllPausaActiva(): Promise<PausaActiva[]>;

    getActivasPausaActiva(): Promise<PausaActiva[]>;
}