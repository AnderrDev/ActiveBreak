import joi from "joi";
import { ValidationError } from "../../domain/errors.js";

export type ReturnPausaActiva = {
    nombre: string;
    descripcion?: string;
    duracionMinutos: number;
    intensidad: "baja" | "media" | "alta";
    activo: boolean;
};

type ValidationPausa = {
    error: joi.ValidationError | undefined;
    value: ReturnPausaActiva;
};

function validatePausaActiva(data: any): ValidationPausa {
    const schema = joi.object({
        nombre: joi.string()
            .trim()
            .min(3)
            .required()
            .messages({
                "string.base": "El nombre debe ser un texto",
                "string.empty": "El nombre no puede estar vacío",
                "string.min": "El nombre debe tener al menos 3 caracteres",
                "any.required": "El nombre es obligatorio",
            }),

        descripcion: joi.string()
            .allow("")
            .optional()
            .messages({
                "string.base": "La descripción debe ser un texto",
            }),

        duracionMinutos: joi.number()
            .integer()
            .positive()
            .required()
            .messages({
                "number.base": "La duración debe ser un número",
                "number.integer": "La duración debe ser un número entero",
                "number.positive": "La duración debe ser mayor a 0",
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
        const messages = result.error.details.map(d => d.message).join(", ");
        throw new ValidationError(messages);
    }

    return result.value;
};