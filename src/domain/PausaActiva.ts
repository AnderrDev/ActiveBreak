export type Intensidad = "baja" | "media" | "alta";
//Domain no debe llevar null
export interface PausaActiva {
    id: number;
    nombre: string;
    descripcion?: string; //el ? indica que podria no venir
    duracionMinutos: number;
    intensidad: "baja" | "media" | "alta";
    activo: boolean;
}