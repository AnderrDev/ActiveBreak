import joi from "joi";
import { ValidationError } from "../../domain/errors.js";

export type ReturnUpdatePausaActiva = Partial<{
    nombre: string;
    descripcion: string;
    duracionMinutos: number;
    intensidad: "baja" | "media" | "alta";
    activo: boolean;
}>;

type ValidationUpdatePausa = {
    error: joi.ValidationError | undefined;
    value: ReturnUpdatePausaActiva;
};

const updateSchema = joi.object({
    nombre: joi.string()
        .trim()
        .min(3)
        .pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/)
        .messages({
            "string.base": "El nombre debe ser un texto",
            "string.min": "El nombre debe tener al menos 3 caracteres",
        }),

    descripcion: joi.string()
        .allow("")
        .messages({
            "string.base": "La descripción debe ser un texto",
        }),

    duracionMinutos: joi.number()
        .integer()
        .positive()
        .messages({
            "number.base": "La duración debe ser un número",
            "number.positive": "La duración debe ser mayor a 0",
        }),

    intensidad: joi.string()
        .valid("baja", "media", "alta")
        .messages({
            "any.only": "La intensidad debe ser 'baja', 'media' o 'alta'",
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
        const messages = result.error.details.map(d => d.message).join(", ");
        throw new ValidationError(messages);
    }

    return result.value;
};