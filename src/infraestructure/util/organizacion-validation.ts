import joi from "joi";
import { validationErrorFrom } from "./joi-error.js";

export type ReturnOrganizacion = {
    nombre: string;
    nit: string;
    sector?: string;
    activo: boolean;
};

// NIT colombiano: 9 dígitos, guion y dígito de verificación (el dígito se comprueba en la capa de aplicación)
const NIT = /^\d{9}-\d$/;
// Nombre de empresa: letras, números, espacios y . , & -
const NOMBRE_ORGANIZACION = /^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ0-9][A-Za-zÁÉÍÓÚÜáéíóúüÑñ0-9\s.,&-]*$/;

const nombre = joi.string()
    .trim()
    .min(3)
    .max(120)
    .pattern(NOMBRE_ORGANIZACION)
    .messages({
        "string.base": "El nombre debe ser un texto",
        "string.empty": "El nombre no puede estar vacío",
        "string.min": "El nombre debe tener al menos 3 caracteres",
        "string.max": "El nombre debe tener máximo 120 caracteres",
        "string.pattern.base": "El nombre solo puede contener letras, números, espacios y los signos . , & -",
        "any.required": "El nombre es obligatorio",
    });

const nit = joi.string()
    .trim()
    .pattern(NIT)
    .messages({
        "string.base": "El NIT debe ser un texto",
        "string.empty": "El NIT no puede estar vacío",
        "string.pattern.base": "El NIT debe tener 9 dígitos, un guion y el dígito de verificación (ej. 900123456-8)",
        "any.required": "El NIT es obligatorio",
    });

const sector = joi.string()
    .trim()
    .min(3)
    .max(80)
    .pattern(/^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ\s]+$/)
    .messages({
        "string.base": "El sector debe ser un texto",
        "string.min": "El sector debe tener al menos 3 caracteres",
        "string.max": "El sector debe tener máximo 80 caracteres",
        "string.pattern.base": "El sector solo puede contener letras y espacios",
    });

const activo = joi.boolean()
    .messages({
        "boolean.base": "El campo activo debe ser true o false",
    });

const createSchema = joi.object({
    nombre: nombre.required(),
    nit: nit.required(),
    sector: sector.optional(),
    activo: activo.default(true),
}).unknown(false);

const updateSchema = joi.object({
    nombre,
    nit,
    sector,
    activo,
}).min(1).unknown(false);

const load = <T>(schema: joi.ObjectSchema, data: any): T => {
    const { error, value } = schema.validate(data, { abortEarly: false, stripUnknown: true, convert: true });
    if (error) {
        throw validationErrorFrom(error);
    }
    return value;
};

export const loadOrganizacion = (data: any): ReturnOrganizacion => load<ReturnOrganizacion>(createSchema, data);

export const loadUpdateOrganizacion = (data: any): Partial<ReturnOrganizacion> =>
    load<Partial<ReturnOrganizacion>>(updateSchema, data);
