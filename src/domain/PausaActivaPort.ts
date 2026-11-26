import { PausaActiva, Intensidad } from "./PausaActiva.js";

// Filtros opcionales del catálogo
export interface FiltrosCatalogo {
    categoriaId?: number;
    intensidad?: Intensidad;
    duracionMax?: number;
}

export interface PausaActivaPort {

    createPausaActiva(pausa: Omit<PausaActiva, "id">): Promise<number>;

    updatePausaActiva(id: number, pausa: Partial<PausaActiva>): Promise<boolean>;

    deletePausaActiva(id: number): Promise<boolean>;

    getByIdPausaActiva(id: number): Promise<PausaActiva | null>;

    getAllPausaActiva(): Promise<PausaActiva[]>;

    getActivasPausaActiva(filtros?: FiltrosCatalogo): Promise<PausaActiva[]>;

    // Pausas activas que pertenecen a una categoría (regla: no desactivar categorías en uso)
    countActivasByCategoria(categoriaId: number): Promise<number>;
}