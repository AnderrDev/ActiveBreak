export interface Recordatorio {
    id: number;
    usuarioId: number;
    frecuenciaMinutos: number;
    horaInicio: string; // formato HH:mm
    horaFin: string;    // formato HH:mm
    activo: boolean;
}