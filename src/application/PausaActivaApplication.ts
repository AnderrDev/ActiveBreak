/*
Validar que el usuario exista y esté activo
Validar que la pausa activa exista y esté activa
Validar que la duración real no sea negativa
Validar integridad de relaciones (usuario - pausa)
Evitar registros de historial con datos inválidos
*/
import { PausaActiva } from "../domain/PausaActiva.js";
import { FiltrosCatalogo, PausaActivaPort } from "../domain/PausaActivaPort.js";
import { CategoriaPausaPort } from "../domain/CategoriaPausaPort.js";
import { NotFoundError, ValidationError } from "../domain/errors.js";

// Rango de duración permitido para una pausa (minutos)
const DURACION_MIN = 1;
const DURACION_MAX = 30;

export class PausaActivaApplication {

    private port: PausaActivaPort;
    private categoriaPort: CategoriaPausaPort; // cada pausa pertenece a una categoría existente

    constructor(port: PausaActivaPort, categoriaPort: CategoriaPausaPort) {
        this.port = port;
        this.categoriaPort = categoriaPort;
    }

    private validarDuracion(duracion: number): void {
        if (duracion < DURACION_MIN || duracion > DURACION_MAX) {
            throw new ValidationError(`La duración debe estar entre ${DURACION_MIN} y ${DURACION_MAX} minutos`);
        }
    }

    // La categoría debe existir y estar activa
    private async validarCategoria(categoriaId: number): Promise<void> {
        const categoria = await this.categoriaPort.getCategoriaById(categoriaId);
        if (!categoria) {
            throw new NotFoundError("La categoría no existe");
        }
        if (!categoria.activo) {
            throw new ValidationError("La categoría está inactiva");
        }
    }

    async createPausaActiva(pausa: Omit<PausaActiva, "id">): Promise<number> {

        this.validarDuracion(pausa.duracionMinutos);

        if (pausa.categoriaId === undefined) {
            throw new ValidationError("La categoría es obligatoria");
        }
        await this.validarCategoria(pausa.categoriaId);

        const intensidades = ["baja", "media", "alta"];

        if (!intensidades.includes(pausa.intensidad)) {
            throw new ValidationError("Intensidad inválida");
        }

        return this.port.createPausaActiva(pausa);
    }
    async getByIdPausaActiva(id: number): Promise<PausaActiva | null> {
        return this.port.getByIdPausaActiva(id);
    }
    async getAllPausaActiva(): Promise<PausaActiva[]> {
        return this.port.getAllPausaActiva();
    }
    async getActivasPausaActiva(filtros: FiltrosCatalogo = {}): Promise<PausaActiva[]> {
        return this.port.getActivasPausaActiva(filtros);
    }
    async updatePausaActiva(id: number, pausa: Partial<PausaActiva>): Promise<boolean> {

        const existing = await this.port.getByIdPausaActiva(id);

        if (!existing) {
            throw new NotFoundError("La pausa no existe");
        }

        if (pausa.duracionMinutos !== undefined) {
            this.validarDuracion(pausa.duracionMinutos);
        }

        // Si cambia la categoría o se reactiva la pausa, su categoría debe estar activa
        const categoriaId = pausa.categoriaId ?? existing.categoriaId;
        const reactivando = pausa.activo === true && !existing.activo;
        if (categoriaId !== undefined && (pausa.categoriaId !== undefined || reactivando)) {
            await this.validarCategoria(categoriaId);
        }

        const intensidades = ["baja", "media", "alta"];

        if (pausa.intensidad && !intensidades.includes(pausa.intensidad)) {
            throw new ValidationError("Intensidad inválida");
        }

        return this.port.updatePausaActiva(id, pausa);
    }
    async deletePausaActiva(id: number): Promise<boolean> {

        const existing = await this.port.getByIdPausaActiva(id);

        if (!existing) {
            throw new NotFoundError("La pausa no existe");
        }

        return this.port.deletePausaActiva(id);
    }
}