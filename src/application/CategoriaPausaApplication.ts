/*
Reglas de negocio de las categorías de pausa:
- El nombre es único (sin distinguir mayúsculas)
- No se puede desactivar una categoría que tenga pausas activas
*/
import { CategoriaPausa } from "../domain/CategoriaPausa.js";
import { CategoriaPausaPort } from "../domain/CategoriaPausaPort.js";
import { PausaActivaPort } from "../domain/PausaActivaPort.js";
import { ConflictError, NotFoundError } from "../domain/errors.js";

export class CategoriaPausaApplication {

    private port: CategoriaPausaPort;
    private pausaPort: PausaActivaPort; // necesario para saber si la categoría está en uso

    constructor(port: CategoriaPausaPort, pausaPort: PausaActivaPort) {
        this.port = port;
        this.pausaPort = pausaPort;
    }

    private async validarNombreUnico(nombre: string, idActual?: number): Promise<void> {
        const existente = await this.port.getCategoriaByNombre(nombre);
        if (existente && existente.id !== idActual) {
            throw new ConflictError("Ya existe una categoría con ese nombre");
        }
    }

    private async validarSinPausasActivas(id: number): Promise<void> {
        const enUso = await this.pausaPort.countActivasByCategoria(id);
        if (enUso > 0) {
            throw new ConflictError(`No se puede desactivar la categoría: tiene ${enUso} pausa(s) activa(s)`);
        }
    }

    async createCategoria(categoria: Omit<CategoriaPausa, "id">): Promise<number> {
        await this.validarNombreUnico(categoria.nombre);
        return this.port.createCategoria(categoria);
    }

    async getCategoriaById(id: number): Promise<CategoriaPausa | null> {
        return this.port.getCategoriaById(id);
    }

    async getAllCategorias(): Promise<CategoriaPausa[]> {
        return this.port.getAllCategorias();
    }

    async getActiveCategorias(): Promise<CategoriaPausa[]> {
        return this.port.getActiveCategorias();
    }

    async updateCategoria(id: number, categoria: Partial<CategoriaPausa>): Promise<boolean> {
        const existing = await this.port.getCategoriaById(id);
        if (!existing) {
            throw new NotFoundError("La categoría no existe");
        }

        if (categoria.nombre !== undefined) {
            await this.validarNombreUnico(categoria.nombre, id);
        }

        if (categoria.activo === false && existing.activo) {
            await this.validarSinPausasActivas(id);
        }

        return this.port.updateCategoria(id, categoria);
    }

    async deleteCategoria(id: number): Promise<boolean> {
        const existing = await this.port.getCategoriaById(id);
        if (!existing) {
            throw new NotFoundError("La categoría no existe");
        }

        await this.validarSinPausasActivas(id);
        return this.port.deleteCategoria(id);
    }
}
