import joi from "joi";
import { validationErrorFrom } from "./joi-error.js";

export type ReturnCategoria = {
    nombre: string;
    descripcion?: string;
    activo: boolean;
};

// Letras (con tildes), espacios y guiones: "Cuello", "Ojos", "Respiración"
const NOMBRE_CATEGORIA = /^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ]+(?:[\s-][A-Za-zÁÉÍÓÚÜáéíóúüÑñ]+)*$/;

const nombre = joi.string()
    .trim()
    .min(3)
    .max(60)
    .pattern(NOMBRE_CATEGORIA)
    .messages({
        "string.base": "El nombre debe ser un texto",
        "string.empty": "El nombre no puede estar vacío",
        "string.min": "El nombre debe tener al menos 3 caracteres",
        "string.max": "El nombre debe tener máximo 60 caracteres",
        "string.pattern.base": "El nombre solo puede contener letras, espacios y guiones",
        "any.required": "El nombre es obligatorio",
    });

const descripcion = joi.string()
    .trim()
    .max(500)
    .allow("")
    .messages({
        "string.base": "La descripción debe ser un texto",
        "string.max": "La descripción debe tener máximo 500 caracteres",
    });

const activo = joi.boolean()
    .messages({
        "boolean.base": "El campo activo debe ser true o false",
    });

const createSchema = joi.object({
    nombre: nombre.required(),
    descripcion: descripcion.optional(),
    activo: activo.default(true),
}).unknown(false);

const updateSchema = joi.object({
    nombre,
    descripcion,
    activo,
}).min(1).unknown(false);

const load = <T>(schema: joi.ObjectSchema, data: any): T => {
    const { error, value } = schema.validate(data, { abortEarly: false, stripUnknown: true, convert: true });
    if (error) {
        throw validationErrorFrom(error);
    }
    return value;
};

export const loadCategoria = (data: any): ReturnCategoria => load<ReturnCategoria>(createSchema, data);

export const loadUpdateCategoria = (data: any): Partial<ReturnCategoria> =>
    load<Partial<ReturnCategoria>>(updateSchema, data);
