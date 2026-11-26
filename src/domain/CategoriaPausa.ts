// Categoría del catálogo de pausas (cuello, ojos, piernas, respiración...)
export interface CategoriaPausa {
    id: number;
    nombre: string;
    descripcion?: string;
    activo: boolean;
}
