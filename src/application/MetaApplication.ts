/*
Reglas de negocio de las metas semanales:
- El usuario debe existir y estar activo
- La meta dura como máximo 7 días y no puede terminar en el pasado
- Un usuario no puede tener dos metas activas con fechas que se crucen
- El estado se calcula con el historial: "cumplida" al llegar al objetivo,
  "vencida" si termina la fecha sin lograrlo y "en_curso" mientras tanto
- Solo se pueden modificar las metas en curso
*/
import { EstadoMeta, Meta, MetaConAvance } from "../domain/Meta.js";
import { MetaPort } from "../domain/MetaPort.js";
import { HistorialPort } from "../domain/HistorialPort.js";
import { UserPort } from "../domain/UserPort.js";
import { ConflictError, NotFoundError, ValidationError } from "../domain/errors.js";

const MAX_DIAS_META = 7;
const MS_POR_DIA = 24 * 60 * 60 * 1000;

// Fecha local de hoy en formato YYYY-MM-DD
const hoy = (): string => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mm}-${dd}`;
};

// Días entre dos fechas YYYY-MM-DD (fin - inicio)
const diferenciaDias = (inicio: string, fin: string): number =>
    Math.round((Date.parse(`${fin}T00:00:00Z`) - Date.parse(`${inicio}T00:00:00Z`)) / MS_POR_DIA);

export type NuevaMeta = Pick<Meta, "usuarioId" | "pausasObjetivo" | "fechaInicio" | "fechaFin">;
export type CambiosMeta = Partial<Pick<Meta, "pausasObjetivo" | "fechaInicio" | "fechaFin">>;

export class MetaApplication {

    private port: MetaPort;
    private userPort: UserPort;
    private historialPort: HistorialPort; // para calcular el avance

    constructor(port: MetaPort, userPort: UserPort, historialPort: HistorialPort) {
        this.port = port;
        this.userPort = userPort;
        this.historialPort = historialPort;
    }

    private validarFechas(fechaInicio: string, fechaFin: string): void {
        const dias = diferenciaDias(fechaInicio, fechaFin);
        if (dias < 0) {
            throw new ValidationError("La fecha de fin debe ser igual o posterior a la fecha de inicio");
        }
        if (dias + 1 > MAX_DIAS_META) {
            throw new ValidationError(`Una meta semanal dura como máximo ${MAX_DIAS_META} días`);
        }
        if (fechaFin < hoy()) {
            throw new ValidationError("La meta no puede terminar en una fecha pasada");
        }
    }

    private async validarSinCruce(usuarioId: number, fechaInicio: string, fechaFin: string, idActual?: number): Promise<void> {
        const metas = await this.port.getMetasByUsuarioId(usuarioId);
        // Dos rangos se cruzan si cada uno empieza antes de que termine el otro
        const cruce = metas.find(m =>
            m.activo &&
            m.id !== idActual &&
            m.fechaInicio <= fechaFin &&
            fechaInicio <= m.fechaFin
        );
        if (cruce) {
            throw new ConflictError(`Ya tienes una meta activa entre ${cruce.fechaInicio} y ${cruce.fechaFin}`);
        }
    }

    // Calcula el avance y, si la meta está activa, guarda el estado cuando cambia
    private async conAvance(meta: Meta): Promise<MetaConAvance> {
        const completadas = await this.historialPort.countCompletadasEnRango(meta.usuarioId, meta.fechaInicio, meta.fechaFin);

        let estado: EstadoMeta = "en_curso";
        if (completadas >= meta.pausasObjetivo) {
            estado = "cumplida";
        } else if (meta.fechaFin < hoy()) {
            estado = "vencida";
        }

        if (meta.activo && estado !== meta.estado) {
            await this.port.updateMeta(meta.id, { estado });
        }

        return {
            ...meta,
            estado,
            pausasCompletadas: completadas,
            porcentajeAvance: Math.min(100, Math.round((completadas / meta.pausasObjetivo) * 100))
        };
    }

    async createMeta(meta: NuevaMeta): Promise<number> {
        const user = await this.userPort.getUserById(meta.usuarioId);
        if (!user) {
            throw new NotFoundError("El usuario no existe");
        }
        if (!user.activo) {
            throw new ValidationError("El usuario está inactivo");
        }

        this.validarFechas(meta.fechaInicio, meta.fechaFin);
        await this.validarSinCruce(meta.usuarioId, meta.fechaInicio, meta.fechaFin);

        const id = await this.port.createMeta({ ...meta, estado: "en_curso", activo: true });

        // Puede nacer cumplida si ya hay pausas registradas en el rango
        const creada = await this.port.getMetaById(id);
        if (creada) await this.conAvance(creada);

        return id;
    }

    async getMetaById(id: number): Promise<MetaConAvance | null> {
        const meta = await this.port.getMetaById(id);
        return meta ? this.conAvance(meta) : null;
    }

    async getMetasByUsuarioId(usuarioId: number): Promise<MetaConAvance[]> {
        const user = await this.userPort.getUserById(usuarioId);
        if (!user) {
            throw new NotFoundError("El usuario no existe");
        }
        const metas = await this.port.getMetasByUsuarioId(usuarioId);
        return Promise.all(metas.map(m => this.conAvance(m)));
    }

    async getAllMetas(): Promise<MetaConAvance[]> {
        const metas = await this.port.getAllMetas();
        return Promise.all(metas.map(m => this.conAvance(m)));
    }

    async updateMeta(id: number, cambios: CambiosMeta): Promise<boolean> {
        const existing = await this.port.getMetaById(id);
        if (!existing || !existing.activo) {
            throw new NotFoundError("La meta no existe");
        }

        // El estado guardado puede estar desactualizado: se recalcula antes de decidir
        const actual = await this.conAvance(existing);
        if (actual.estado !== "en_curso") {
            throw new ConflictError(`Solo se pueden modificar metas en curso; esta meta está ${actual.estado}`);
        }

        const fechaInicio = cambios.fechaInicio ?? existing.fechaInicio;
        const fechaFin = cambios.fechaFin ?? existing.fechaFin;
        if (cambios.fechaInicio !== undefined || cambios.fechaFin !== undefined) {
            this.validarFechas(fechaInicio, fechaFin);
            await this.validarSinCruce(existing.usuarioId, fechaInicio, fechaFin, id);
        }

        const updated = await this.port.updateMeta(id, cambios);

        const meta = await this.port.getMetaById(id);
        if (meta) await this.conAvance(meta);

        return updated;
    }

    async deleteMeta(id: number): Promise<boolean> {
        const existing = await this.port.getMetaById(id);
        if (!existing) {
            throw new NotFoundError("La meta no existe");
        }
        return this.port.deleteMeta(id);
    }

    // Se llama cada vez que cambia el historial del usuario
    async recalcularMetasDeUsuario(usuarioId: number): Promise<void> {
        const metas = await this.port.getMetasByUsuarioId(usuarioId);
        for (const meta of metas.filter(m => m.activo)) {
            await this.conAvance(meta);
        }
    }
}
