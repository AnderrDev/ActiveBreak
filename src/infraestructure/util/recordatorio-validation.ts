import joi from "joi";
import { ValidationError } from "../../domain/errors.js";

export type ReturnRecordatorio = {
    usuarioId: number;
    frecuenciaMinutos: number;
    horaInicio: string;
    horaFin: string;
    activo: boolean;
};

type ValidationRecordatorio = {
    error: joi.ValidationError | undefined;
    value: ReturnRecordatorio;
};

function validateRecordatorio(data: any): ValidationRecordatorio {

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

        frecuenciaMinutos: joi.number()
            .integer()
            .positive()
            .required()
            .messages({
                "number.base": "La frecuencia debe ser un número",
                "number.integer": "La frecuencia debe ser un número entero",
                "number.positive": "La frecuencia debe ser mayor a 0",
                "any.required": "La frecuencia es obligatoria",
            }),

        horaInicio: joi.string()
            .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/) // formato HH:mm
            .required()
            .messages({
                "string.base": "La hora de inicio debe ser texto",
                "string.pattern.base": "La hora de inicio debe tener formato HH:mm de 24 horas",
                "any.required": "La hora de inicio es obligatoria",
            }),

        horaFin: joi.string()
            .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
            .required()
            .messages({
                "string.base": "La hora fin debe ser texto",
                "string.pattern.base": "La hora fin debe tener formato HH:mm de 24 horas",
                "any.required": "La hora fin es obligatoria",
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


// función de carga
export const loadRecordatorio = (data: any): ReturnRecordatorio => {

    const result = validateRecordatorio(data);

    if (result.error) {
        const messages = result.error.details.map(d => d.message).join(", ");
        throw new ValidationError(messages);
    }

    return result.value;
};