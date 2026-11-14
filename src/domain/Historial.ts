export interface HistorialActividad {
    id: number;
    usuarioId: number;
    pausaId: number;
    fechaHora: Date;
    completado: boolean;
    duracionReal: number;
}