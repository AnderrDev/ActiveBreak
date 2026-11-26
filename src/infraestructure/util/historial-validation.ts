import joi from "joi";
import { validationErrorFrom } from "./joi-error.js";

export type ReturnHistorial = {
    usuarioId: number;
    pausaId: number;
    fechaHora: string;
    completado: boolean;
    duracionReal: number;
};

type ValidationHistorial = {
    error: joi.ValidationError | undefined;
    value: ReturnHistorial;
};

function validateHistorial(data: any): ValidationHistorial {

    const schema = joi.object({

        usuarioId: joi.number()
            .integer()
            .positive()
            .required()
            .messages({
                "number.base": "El usuarioId debe ser un número",
                "number.integer": "El usuarioId debe ser un número entero",
                "number.positive": "El usuarioId debe ser mayor a 0",
                "any.required": "El usuarioId es obligatorio",
            }),

        pausaId: joi.number()
            .integer()
            .positive()
            .required()
            .messages({
                "number.base": "El pausaId debe ser un número",
                "number.integer": "El pausaId debe ser un número entero",
                "number.positive": "El pausaId debe ser mayor a 0",
                "any.required": "El pausaId es obligatorio",
            }),

        fechaHora: joi.string()
            .optional()
            .pattern(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/)
            .messages({
                "string.pattern.base": "fechaHora debe tener formato ISO (YYYY-MM-DDTHH:mm)"
            }),

        completado: joi.boolean()
            .required()
            .messages({
                "boolean.base": "El campo completado debe ser true o false",
                "any.required": "El campo completado es obligatorio",
            }),

        duracionReal: joi.number()
            .integer()
            .min(0)
            .max(60)
            .required()
            .messages({
                "number.base": "La duración debe ser un número",
                "number.integer": "La duración debe ser un número entero",
                "number.min": "La duración no puede ser negativa",
                "number.max": "La duración real debe ser como máximo 60 minutos",
                "any.required": "La duración es obligatoria",
            }),

    }).unknown(false);

    const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
    });

    return { error, value };
}


// función de carga
export const loadHistorial = (data: any): ReturnHistorial => {

    const result = validateHistorial(data);

    if (result.error) {
        throw validationErrorFrom(result.error);
    }

    return result.value;
};