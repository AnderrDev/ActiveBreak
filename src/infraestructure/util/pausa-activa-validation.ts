import joi from "joi";
import { validationErrorFrom } from "./joi-error.js";

export type ReturnPausaActiva = {
    nombre: string;
    descripcion?: string;
    duracionMinutos: number;
    intensidad: "baja" | "media" | "alta";
    activo: boolean;
    categoriaId: number;
};

// Nombre de la pausa: letras, números, espacios y . , ( ) -  (3 a 100 caracteres)
export const NOMBRE_PAUSA = /^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ0-9]+(?:[\s.,()-]+[A-Za-zÁÉÍÓÚÜáéíóúüÑñ0-9]+)*[.)]?$/;

type ValidationPausa = {
    error: joi.ValidationError | undefined;
    value: ReturnPausaActiva;
};

function validatePausaActiva(data: any): ValidationPausa {
    const schema = joi.object({
        nombre: joi.string()
            .trim()
            .min(3)
            .max(100)
            .pattern(NOMBRE_PAUSA)
            .required()
            .messages({
                "string.base": "El nombre debe ser un texto",
                "string.empty": "El nombre no puede estar vacío",
                "string.min": "El nombre debe tener entre 3 y 100 caracteres",
                "string.max": "El nombre debe tener entre 3 y 100 caracteres",
                "string.pattern.base": "El nombre solo puede contener letras, números, espacios y los signos . , ( ) -",
                "any.required": "El nombre es obligatorio",
            }),

        descripcion: joi.string()
            .trim()
            .max(1000)
            .allow("")
            .optional()
            .messages({
                "string.base": "La descripción debe ser un texto",
                "string.max": "La descripción debe tener máximo 1000 caracteres",
            }),

        duracionMinutos: joi.number()
            .integer()
            .min(1)
            .max(30)
            .required()
            .messages({
                "number.base": "La duración debe ser un número",
                "number.integer": "La duración debe ser un número entero",
                "number.min": "La duración debe estar entre 1 y 30 minutos",
                "number.max": "La duración debe estar entre 1 y 30 minutos",
                "any.required": "La duración es obligatoria",
            }),

        intensidad: joi.string()
            .valid("baja", "media", "alta")
            .required()
            .messages({
                "string.base": "La intensidad debe ser un texto",
                "any.only": "La intensidad debe ser 'baja', 'media' o 'alta'",
                "any.required": "La intensidad es obligatoria",
            }),

        categoriaId: joi.number()
            .integer()
            .positive()
            .required()
            .messages({
                "number.base": "categoriaId debe ser un número",
                "number.integer": "categoriaId debe ser un número entero",
                "number.positive": "categoriaId debe ser mayor a 0",
                "any.required": "La categoría (categoriaId) es obligatoria",
            }),

        activo: joi.boolean()
            .required()
            .messages({
                "boolean.base": "El campo activo debe ser true o false",
                "any.required": "El campo activo es obligatorio",
            }),
    }).unknown(false);

    const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
    });

    return { error, value };
}

// funcion de carga
export const loadPausaActiva = (data: any): ReturnPausaActiva => {
    const result = validatePausaActiva(data);

    if (result.error) {
        throw validationErrorFrom(result.error);
    }

    return result.value;
};

// ---- Filtros del catálogo: GET /pausas-activas/activas?categoriaId=&intensidad=&duracionMax= ----
export type ReturnFiltrosCatalogo = {
    categoriaId?: number;
    intensidad?: "baja" | "media" | "alta";
    duracionMax?: number;
};

const filtrosSchema = joi.object({
    categoriaId: joi.number().integer().positive().messages({
        "number.base": "categoriaId debe ser un número",
        "number.integer": "categoriaId debe ser un número entero",
        "number.positive": "categoriaId debe ser mayor a 0",
    }),
    intensidad: joi.string().valid("baja", "media", "alta").messages({
        "any.only": "La intensidad debe ser 'baja', 'media' o 'alta'",
    }),
    duracionMax: joi.number().integer().min(1).max(30).messages({
        "number.base": "duracionMax debe ser un número",
        "number.integer": "duracionMax debe ser un número entero",
        "number.min": "duracionMax debe estar entre 1 y 30",
        "number.max": "duracionMax debe estar entre 1 y 30",
    }),
}).unknown(false).messages({
    "object.unknown": "Filtro no permitido: {#label}",
});

export const loadFiltrosCatalogo = (query: any): ReturnFiltrosCatalogo => {
    const { error, value } = filtrosSchema.validate(query, { abortEarly: false, convert: true });
    if (error) {
        throw validationErrorFrom(error);
    }
    return value;
};
