/*
Validar que el usuario exista y esté activo
Validar que la pausa activa exista y esté activa
Validar que la duración real no sea negativa
Validar integridad de relaciones (usuario - pausa)
Evitar registros de historial con datos inválidos
*/
import { PausaActiva } from "../domain/PausaActiva.js";
import { PausaActivaPort } from "../domain/PausaActivaPort.js";
import { NotFoundError, ValidationError } from "../domain/errors.js";

export class PausaActivaApplication {

    private port: PausaActivaPort;

    constructor(port: PausaActivaPort) {
        this.port = port;
    }

    async createPausaActiva(pausa: Omit<PausaActiva, "id">): Promise<number> {

        // Validación de tiempo
        if (pausa.duracionMinutos <= 0) {
            throw new ValidationError("La duración debe ser mayor a 0");
        }

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
    async getActivasPausaActiva(): Promise<PausaActiva[]> {
        return this.port.getActivasPausaActiva();
    }
    async updatePausaActiva(id: number, pausa: Partial<PausaActiva>): Promise<boolean> {

        const existing = await this.port.getByIdPausaActiva(id);

        if (!existing) {
            throw new NotFoundError("La pausa no existe");
        }

        if (pausa.duracionMinutos != null && pausa.duracionMinutos <= 0) {
            throw new ValidationError("La duración debe ser mayor a 0");
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