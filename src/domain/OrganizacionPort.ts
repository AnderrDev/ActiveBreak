import { Organizacion } from "./Organizacion.js";

export interface OrganizacionPort {

    createOrganizacion(organizacion: Omit<Organizacion, "id">): Promise<number>;

    updateOrganizacion(id: number, organizacion: Partial<Organizacion>): Promise<boolean>;

    deleteOrganizacion(id: number): Promise<boolean>;

    getOrganizacionById(id: number): Promise<Organizacion | null>;

    getOrganizacionByNit(nit: string): Promise<Organizacion | null>;

    getAllOrganizaciones(): Promise<Organizacion[]>;

    getActiveOrganizaciones(): Promise<Organizacion[]>;
}
