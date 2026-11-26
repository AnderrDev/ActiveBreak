/*
Usuario existe
Usuario activo
frecuencia entre 15 y 240 minutos
horaFin > horaInicio
máximo 3 recordatorios activos por usuario
*/

import { Recordatorio } from "../domain/Recordatorio.js";
import { RecordatorioPort } from "../domain/RecordatorioPort.js";
import { UserPort } from "../domain/UserPort.js";
import { ConflictError, NotFoundError, ValidationError } from "../domain/errors.js";

const FRECUENCIA_MIN = 15;
const FRECUENCIA_MAX = 240;
const MAX_RECORDATORIOS_ACTIVOS = 3;

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
            throw new ValidationError("Formato de hora inválido (HH:MM)");
        }

        if (h < 0 || h > 23 || m < 0 || m > 59) {
            throw new ValidationError("Hora fuera de rango");
        }

        return h * 60 + m;
    }

    private validarFrecuencia(frecuencia: number): void {
        if (frecuencia < FRECUENCIA_MIN || frecuencia > FRECUENCIA_MAX) {
            throw new ValidationError(`La frecuencia debe estar entre ${FRECUENCIA_MIN} y ${FRECUENCIA_MAX} minutos`);
        }
    }

    private async validarCupoActivos(usuarioId: number): Promise<void> {
        const activos = await this.port.countActivosByUsuario(usuarioId);
        if (activos >= MAX_RECORDATORIOS_ACTIVOS) {
            throw new ConflictError(`Un usuario puede tener como máximo ${MAX_RECORDATORIOS_ACTIVOS} recordatorios activos`);
        }
    }

    async createRecordatorio(recordatorio: Omit<Recordatorio, "id">): Promise<number> {

        // validar usuario
        const user = await this.userPort.getUserById(recordatorio.usuarioId);

        if (!user) {
            throw new NotFoundError("El usuario no existe");
        }

        if (!user.activo) {
            throw new ValidationError("El usuario está inactivo");
        }

        // validaciones de negocio
        this.validarFrecuencia(recordatorio.frecuenciaMinutos);

        if (recordatorio.activo) {
            await this.validarCupoActivos(recordatorio.usuarioId);
        }

        if (
            this.toMinutes(recordatorio.horaFin) <=
            this.toMinutes(recordatorio.horaInicio)
        ) {
            throw new ValidationError("La hora fin debe ser mayor que la hora inicio");
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
            throw new NotFoundError("El usuario no existe");
        }

        return this.port.getRecordatoriosByUsuarioId(usuarioId);
    }
    async updateRecordatorio(
        id: number,
        recordatorio: Partial<Recordatorio>
    ): Promise<boolean> {

        const existing = await this.port.getRecordatorioById(id);

        if (!existing) {
            throw new NotFoundError("El recordatorio no existe");
        }

        if (recordatorio.frecuenciaMinutos !== undefined) {
            this.validarFrecuencia(recordatorio.frecuenciaMinutos);
        }

        if (recordatorio.horaInicio || recordatorio.horaFin) {

            const inicio = recordatorio.horaInicio ?? existing.horaInicio;
            const fin = recordatorio.horaFin ?? existing.horaFin;

            if (this.toMinutes(fin) <= this.toMinutes(inicio)) {
                throw new ValidationError("La hora fin debe ser mayor que la hora inicio");
            }
        }

        // validar usuario si lo cambian
        if (recordatorio.usuarioId) {

            const user = await this.userPort.getUserById(recordatorio.usuarioId);

            if (!user) {
                throw new NotFoundError("El usuario no existe");
            }

            if (!user.activo) {
                throw new ValidationError("El usuario está inactivo");
            }
        }

        // Si el recordatorio queda activo para un usuario donde antes no contaba
        // (se reactiva o se reasigna), se revisa el cupo de ese usuario
        const usuarioDestino = recordatorio.usuarioId ?? existing.usuarioId;
        const quedaActivo = recordatorio.activo ?? existing.activo;
        const sumaUnActivo = !existing.activo || usuarioDestino !== existing.usuarioId;
        if (quedaActivo && sumaUnActivo) {
            await this.validarCupoActivos(usuarioDestino);
        }

        return this.port.updateRecordatorio(id, recordatorio);
    }

    async deleteRecordatorio(id: number): Promise<boolean> {

        const existing = await this.port.getRecordatorioById(id);

        if (!existing) {
            throw new NotFoundError("El recordatorio no existe");
        }

        return this.port.deleteRecordatorio(id);
    }
}