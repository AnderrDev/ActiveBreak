/*
Reglas de negocio de las organizaciones:
- El NIT es único y su dígito de verificación debe ser correcto (algoritmo de la DIAN)
- No se puede desactivar una organización que tenga usuarios activos
*/
import { Organizacion } from "../domain/Organizacion.js";
import { OrganizacionPort } from "../domain/OrganizacionPort.js";
import { UserPort } from "../domain/UserPort.js";
import { ConflictError, NotFoundError, ValidationError } from "../domain/errors.js";

// Pesos de la DIAN para los 9 dígitos del NIT, de izquierda a derecha
const PESOS_NIT = [41, 37, 29, 23, 19, 17, 13, 7, 3];

export class OrganizacionApplication {

    private port: OrganizacionPort;
    private userPort: UserPort; // necesario para saber si tiene usuarios activos

    constructor(port: OrganizacionPort, userPort: UserPort) {
        this.port = port;
        this.userPort = userPort;
    }

    // Calcula el dígito de verificación de un NIT de 9 dígitos
    static calcularDigitoVerificacion(numero: string): number {
        const suma = numero
            .split("")
            .reduce((acc, digito, i) => acc + Number(digito) * (PESOS_NIT[i] ?? 0), 0);
        const residuo = suma % 11;
        return residuo > 1 ? 11 - residuo : residuo;
    }

    private async validarNit(nit: string, idActual?: number): Promise<void> {
        // El formato (9 dígitos, guion y 1 dígito) ya lo validó Joi
        const [numero = "", dv = ""] = nit.split("-");
        if (OrganizacionApplication.calcularDigitoVerificacion(numero) !== Number(dv)) {
            throw new ValidationError("El dígito de verificación del NIT no es correcto");
        }

        const existente = await this.port.getOrganizacionByNit(nit);
        if (existente && existente.id !== idActual) {
            throw new ConflictError("Ya existe una organización con ese NIT");
        }
    }

    private async validarSinUsuariosActivos(id: number): Promise<void> {
        const usuarios = await this.userPort.countActiveByOrganizacion(id);
        if (usuarios > 0) {
            throw new ConflictError(`No se puede desactivar la organización: tiene ${usuarios} usuario(s) activo(s)`);
        }
    }

    async createOrganizacion(organizacion: Omit<Organizacion, "id">): Promise<number> {
        await this.validarNit(organizacion.nit);
        return this.port.createOrganizacion(organizacion);
    }

    async getOrganizacionById(id: number): Promise<Organizacion | null> {
        return this.port.getOrganizacionById(id);
    }

    async getAllOrganizaciones(): Promise<Organizacion[]> {
        return this.port.getAllOrganizaciones();
    }

    async getActiveOrganizaciones(): Promise<Organizacion[]> {
        return this.port.getActiveOrganizaciones();
    }

    async updateOrganizacion(id: number, organizacion: Partial<Organizacion>): Promise<boolean> {
        const existing = await this.port.getOrganizacionById(id);
        if (!existing) {
            throw new NotFoundError("La organización no existe");
        }

        if (organizacion.nit !== undefined) {
            await this.validarNit(organizacion.nit, id);
        }

        if (organizacion.activo === false && existing.activo) {
            await this.validarSinUsuariosActivos(id);
        }

        return this.port.updateOrganizacion(id, organizacion);
    }

    async deleteOrganizacion(id: number): Promise<boolean> {
        const existing = await this.port.getOrganizacionById(id);
        if (!existing) {
            throw new NotFoundError("La organización no existe");
        }

        await this.validarSinUsuariosActivos(id);
        return this.port.deleteOrganizacion(id);
    }
}
