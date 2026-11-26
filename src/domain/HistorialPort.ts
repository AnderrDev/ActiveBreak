// los metodos que vamos a usar para crear, leer y eliminar registros del historial.

import { HistorialActividad } from "./Historial.js";

export interface HistorialPort {

    createHistorial(historial: Omit<HistorialActividad, "id">): Promise<number>;

    getHistorialById(id: number): Promise<HistorialActividad | null>;

    getAllHistorial(): Promise<HistorialActividad[]>;

    getHistorialByUsuarioId(usuarioId: number): Promise<HistorialActividad[]>;

    getHistorialByPausaId(pausaId: number): Promise<HistorialActividad[]>;

    deleteHistorial(id: number): Promise<boolean>;

    // Pausas completadas por un usuario entre dos fechas (YYYY-MM-DD, ambas incluidas)
    countCompletadasEnRango(usuarioId: number, desde: string, hasta: string): Promise<number>;
}