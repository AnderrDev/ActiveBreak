import joi from "joi";
import { validationErrorFrom } from "./joi-error.js";
import { NOMBRE_PAUSA } from "./pausa-activa-validation.js";

export type ReturnUpdatePausaActiva = Partial<{
    nombre: string;
    descripcion: string;
    duracionMinutos: number;
    intensidad: "baja" | "media" | "alta";
    activo: boolean;
    categoriaId: number;
}>;

type ValidationUpdatePausa = {
    error: joi.ValidationError | undefined;
    value: ReturnUpdatePausaActiva;
};

const updateSchema = joi.object({
    nombre: joi.string()
        .trim()
        .min(3)
        .max(100)
        .pattern(NOMBRE_PAUSA)
        .messages({
            "string.base": "El nombre debe ser un texto",
            "string.empty": "El nombre no puede estar vacío",
            "string.min": "El nombre debe tener entre 3 y 100 caracteres",
            "string.max": "El nombre debe tener entre 3 y 100 caracteres",
            "string.pattern.base": "El nombre solo puede contener letras, números, espacios y los signos . , ( ) -",
        }),

    descripcion: joi.string()
        .trim()
        .max(1000)
        .allow("")
        .messages({
            "string.base": "La descripción debe ser un texto",
            "string.max": "La descripción debe tener máximo 1000 caracteres",
        }),

    duracionMinutos: joi.number()
        .integer()
        .min(1)
        .max(30)
        .messages({
            "number.base": "La duración debe ser un número",
            "number.integer": "La duración debe ser un número entero",
            "number.min": "La duración debe estar entre 1 y 30 minutos",
            "number.max": "La duración debe estar entre 1 y 30 minutos",
        }),

    intensidad: joi.string()
        .valid("baja", "media", "alta")
        .messages({
            "any.only": "La intensidad debe ser 'baja', 'media' o 'alta'",
        }),

    categoriaId: joi.number()
        .integer()
        .positive()
        .messages({
            "number.base": "categoriaId debe ser un número",
            "number.integer": "categoriaId debe ser un número entero",
            "number.positive": "categoriaId debe ser mayor a 0",
        }),

    activo: joi.boolean()
        .messages({
            "boolean.base": "El campo activo debe ser booleano",
        }),
})
    .min(1)
    .unknown(false);

function validateUpdatePausaActiva(data: any): ValidationUpdatePausa {
    const { error, value } = updateSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
    });

    return { error, value };
}

export const loadUpdatePausaActiva = (data: any): ReturnUpdatePausaActiva => {
    const result = validateUpdatePausaActiva(data);

    if (result.error) {
        throw validationErrorFrom(result.error);
    }

    return result.value;
};