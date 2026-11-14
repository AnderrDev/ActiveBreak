/*
Usuario existe
Usuario activo
frecuencia > 0
horaFin > horaInicio
*/

import { Recordatorio } from "../domain/Recordatorio.js";
import { RecordatorioPort } from "../domain/RecordatorioPort.js";
import { UserPort } from "../domain/UserPort.js";

export class RecordatorioApplication {

    private port: RecordatorioPort;
    private userPort: UserPort; //necesario para validar usuario

    constructor(port: RecordatorioPort, userPort: UserPort) {
        this.port = port;
        this.userPort = userPort;
    }

    private toMinutes(time: string): number {
        const parts = time.split(":");
        /*
        Convierte una hora tipo: "14:30"
        a minutos desde medianoche: 14 * 60 + 30 = 870
        */
        const h = Number(parts[0]);
        const m = Number(parts[1]);

        if (Number.isNaN(h) || Number.isNaN(m)) {
            throw new Error("Formato de hora inválido (HH:MM)");
        }

        if (h < 0 || h > 23 || m < 0 || m > 59) {
            throw new Error("Hora fuera de rango");
        }

        return h * 60 + m;
    }

    async createRecordatorio(recordatorio: Omit<Recordatorio, "id">): Promise<number> {

        // validar usuario
        const user = await this.userPort.getUserById(recordatorio.usuarioId);

        if (!user) {
            throw new Error("El usuario no existe");
        }

        if (!user.activo) {
            throw new Error("El usuario está inactivo");
        }

        // validaciones de negocio
        if (recordatorio.frecuenciaMinutos <= 0) {
            throw new Error("La frecuencia debe ser mayor a 0");
        }

        if (
            this.toMinutes(recordatorio.horaFin) <=
            this.toMinutes(recordatorio.horaInicio)
        ) {
            throw new Error("La hora fin debe ser mayor que la hora inicio");
        }

        return this.port.createRecordatorio(recordatorio);
    }


    async getRecordatorioById(id: number): Promise<Recordatorio | null> {
        return this.port.getRecordatorioById(id);
    }

    async getAllRecordatorios(): Promise<Recordatorio[]> {
        return this.port.getAllRecordatorios();
    }

    async getActiveRecordatorios(): Promise<Recordatorio[]> {
        return this.port.getActiveRecordatorios();
    }

    async getRecordatoriosByUsuarioId(usuarioId: number): Promise<Recordatorio[]> {

        const user = await this.userPort.getUserById(usuarioId);
        if (!user) {
            throw new Error("El usuario no existe");
        }

        return this.port.getRecordatoriosByUsuarioId(usuarioId);
    }
    async updateRecordatorio(
        id: number,
        recordatorio: Partial<Recordatorio>
    ): Promise<boolean> {

        const existing = await this.port.getRecordatorioById(id);

        if (!existing) {
            throw new Error("El recordatorio no existe");
        }

        if (
            recordatorio.frecuenciaMinutos !== undefined &&
            recordatorio.frecuenciaMinutos <= 0
        ) {
            throw new Error("La frecuencia debe ser mayor a 0");
        }

        if (recordatorio.horaInicio || recordatorio.horaFin) {

            const inicio = recordatorio.horaInicio ?? existing.horaInicio;
            const fin = recordatorio.horaFin ?? existing.horaFin;

            if (this.toMinutes(fin) <= this.toMinutes(inicio)) {
                throw new Error("La hora fin debe ser mayor que la hora inicio");
            }
        }

        // validar usuario si lo cambian
        if (recordatorio.usuarioId) {

            const user = await this.userPort.getUserById(recordatorio.usuarioId);

            if (!user) {
                throw new Error("El usuario no existe");
            }

            if (!user.activo) {
                throw new Error("El usuario está inactivo");
            }
        }

        return this.port.updateRecordatorio(id, recordatorio);
    }

    async deleteRecordatorio(id: number): Promise<boolean> {

        const existing = await this.port.getRecordatorioById(id);

        if (!existing) {
            throw new Error("El recordatorio no existe");
        }

        return this.port.deleteRecordatorio(id);
    }
}