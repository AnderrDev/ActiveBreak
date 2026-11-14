/*
recordatorio_id NO existe en create/update (lo maneja relación)
usuarioId si es importante en create/update (por la FK)
*/
import joi from "joi";

export type ReturnRecordatorioData = Partial<{
    usuarioId: number;
    frecuenciaMinutos: number;
    horaInicio: string;
    horaFin: string;
    activo: boolean;
}>;

const updateRecordatorioSchema = joi.object({

    usuarioId: joi.number()
        .integer()
        .positive()
        .messages({
            "number.base": "El usuarioId debe ser un número",
            "number.integer": "El usuarioId debe ser entero",
            "number.positive": "El usuarioId debe ser positivo",
        }),

    frecuenciaMinutos: joi.number()
        .integer()
        .positive()
        .messages({
            "number.base": "La frecuencia debe ser un número",
            "number.integer": "La frecuencia debe ser un entero",
            "number.positive": "La frecuencia debe ser mayor a 0",
        }),

    horaInicio: joi.string()
        .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .messages({
            "string.base": "horaInicio debe ser texto",
            "string.pattern.base": "horaInicio debe tener formato HH:MM de 24 horas",
        }),

    horaFin: joi.string()
        .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .messages({
            "string.base": "horaFin debe ser texto",
            "string.pattern.base": "horaFin debe tener formato HH:MM 24 horas",
        }),

    activo: joi.boolean()
        .messages({
            "boolean.base": "El campo activo debe ser true o false",
        }),

})
    .min(1)
    .unknown(false);


export const loadUpdateRecordatorioData = (data: any): ReturnRecordatorioData => {
    const { error, value } = updateRecordatorioSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
    });

    if (error) {
        const messages = error.details.map(d => d.message).join(", ");
        throw new Error(messages);
    }

    return value;
};