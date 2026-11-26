import joi from "joi";
import { DATE_TIME_PATTERN, existingDate, validate } from "./validate.js";

export type ActivityRecordData = {
    userId: number; breakId: number; performedAt?: string; completed: boolean; actualDurationMinutes: number;
};

const schema = joi.object({
    userId: joi.number().integer().positive().required().messages({
        "number.base": "userId debe ser un número",
        "number.integer": "userId debe ser un número entero",
        "number.positive": "userId debe ser mayor a 0",
        "any.required": "userId es obligatorio",
    }),
    breakId: joi.number().integer().positive().required().messages({
        "number.base": "breakId debe ser un número",
        "number.integer": "breakId debe ser un número entero",
        "number.positive": "breakId debe ser mayor a 0",
        "any.required": "breakId es obligatorio",
    }),
    // Optional: when it is not sent, the server uses the current date and time
    performedAt: joi.string().pattern(DATE_TIME_PATTERN).custom(existingDate).optional().messages({
        "string.base": "performedAt debe ser un texto",
        "string.pattern.base": "performedAt debe tener formato YYYY-MM-DDTHH:mm",
        "date.nonexistent": "performedAt no es una fecha válida",
    }),
    completed: joi.boolean().required().messages({
        "boolean.base": "completed debe ser true o false",
        "any.required": "completed es obligatorio",
    }),
    actualDurationMinutes: joi.number().integer().min(0).max(60).required().messages({
        "number.base": "La duración real (actualDurationMinutes) debe ser un número",
        "number.integer": "La duración real (actualDurationMinutes) debe ser un número entero",
        "number.min": "La duración real no puede ser negativa",
        "number.max": "La duración real debe ser como máximo 60 minutos",
        "any.required": "La duración real (actualDurationMinutes) es obligatoria",
    }),
}).unknown(false);

export const loadActivityRecord = (data: unknown) => validate<ActivityRecordData>(schema, data);
