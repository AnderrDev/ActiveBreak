/*
EN ESTA CAPA ESTA:
- Validaciones de Lógica de negocio
- Están los SERVICIOS que se encargan de procesar la información, es decir, de realizar las operaciones necesarias para cumplir con los requerimientos del negocio.
*/

import { HistorialActividad } from "../domain/Historial.js";
import { HistorialPort } from "../domain/HistorialPort.js";
import { UserPort } from "../domain/UserPort.js";
import { PausaActivaPort } from "../domain/PausaActivaPort.js";

export class HistorialApplication {

    private port: HistorialPort;
    private userPort: UserPort;
    private pausaPort: PausaActivaPort;

    constructor(
        port: HistorialPort,
        userPort: UserPort,
        pausaPort: PausaActivaPort
    ) {
        this.port = port;
        this.userPort = userPort;
        this.pausaPort = pausaPort;
    }

    async createHistorial(historial: Omit<HistorialActividad, "id">): Promise<number> {

        // validar usuario
        const user = await this.userPort.getUserById(historial.usuarioId);
        if (!user) {
            throw new Error("El usuario no existe");
        }

        if (!user.activo) {
            throw new Error("El usuario está inactivo");
        }

        // validar pausa
        const pausa = await this.pausaPort.getByIdPausaActiva(historial.pausaId);
        if (!pausa) {
            throw new Error("La pausa activa no existe");
        }

        if (!pausa.activo) {
            throw new Error("La pausa activa está inactiva");
        }

        // validaciones de negocio
        if (historial.duracionReal < 0) {
            throw new Error("La duración real no puede ser negativa");
        }

        const margen = 5;

        if (historial.duracionReal > pausa.duracionMinutos + margen) {
            throw new Error("La duración real excede el tiempo permitido para esta pausa");
        }

        if (!historial.completado && historial.duracionReal > 0) {
            throw new Error("No puede haber duración si no se completó la actividad");
        }

        return this.port.createHistorial(historial);
    }

    async getHistorialById(id: number): Promise<HistorialActividad | null> {
        return this.port.getHistorialById(id);
    }

    async getAllHistorial(): Promise<HistorialActividad[]> {
        return this.port.getAllHistorial();
    }

    async getHistorialByUsuarioId(usuarioId: number): Promise<HistorialActividad[]> {

        const user = await this.userPort.getUserById(usuarioId);
        if (!user) {
            throw new Error("El usuario no existe");
        }

        return this.port.getHistorialByUsuarioId(usuarioId);
    }

    async getHistorialByPausaId(pausaId: number): Promise<HistorialActividad[]> {

        const pausa = await this.pausaPort.getByIdPausaActiva(pausaId);
        if (!pausa) {
            throw new Error("La pausa no existe");
        }

        return this.port.getHistorialByPausaId(pausaId);
    }

    async deleteHistorial(id: number): Promise<boolean> {

        const existing = await this.port.getHistorialById(id);
        if (!existing) {
            throw new Error("El historial no existe");
        }

        return this.port.deleteHistorial(id);
    }
}