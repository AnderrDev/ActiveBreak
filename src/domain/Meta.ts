// Meta semanal de pausas de un usuario
export type EstadoMeta = "en_curso" | "cumplida" | "vencida";

export interface Meta {
    id: number;
    usuarioId: number;
    pausasObjetivo: number;
    fechaInicio: string; // formato YYYY-MM-DD
    fechaFin: string;    // formato YYYY-MM-DD
    estado: EstadoMeta;
    activo: boolean;
}

// Meta con su avance calculado a partir del historial
export interface MetaConAvance extends Meta {
    pausasCompletadas: number;
    porcentajeAvance: number; // 0 a 100
}
