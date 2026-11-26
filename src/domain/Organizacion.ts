// Empresa o institución que usa la plataforma
export interface Organizacion {
    id: number;
    nombre: string;
    nit: string;      // formato 900123456-7 (9 dígitos, guion y dígito de verificación)
    sector?: string;
    activo: boolean;
}
