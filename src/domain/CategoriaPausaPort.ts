import { CategoriaPausa } from "./CategoriaPausa.js";

export interface CategoriaPausaPort {

    createCategoria(categoria: Omit<CategoriaPausa, "id">): Promise<number>;

    updateCategoria(id: number, categoria: Partial<CategoriaPausa>): Promise<boolean>;

    deleteCategoria(id: number): Promise<boolean>;

    getCategoriaById(id: number): Promise<CategoriaPausa | null>;

    // Búsqueda sin distinguir mayúsculas, para la regla de nombre único
    getCategoriaByNombre(nombre: string): Promise<CategoriaPausa | null>;

    getAllCategorias(): Promise<CategoriaPausa[]>;

    getActiveCategorias(): Promise<CategoriaPausa[]>;
}
