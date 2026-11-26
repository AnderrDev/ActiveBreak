import joi from "joi";
import { TIME_PATTERN, validate } from "./validate.js";

const userId = joi.number().integer().positive().messages({
    "number.base": "userId debe ser un número",
    "number.integer": "userId debe ser un número entero",
    "number.positive": "userId debe ser mayor a 0",
    "any.required": "userId es obligatorio",
});

const frequencyMinutes = joi.number().integer().min(15).max(240).messages({
    "number.base": "La frecuencia (frequencyMinutes) debe ser un número",
    "number.integer": "La frecuencia (frequencyMinutes) debe ser un número entero",
    "number.min": "La frecuencia debe estar entre 15 y 240 minutos",
    "number.max": "La frecuencia debe estar entre 15 y 240 minutos",
    "any.required": "La frecuencia (frequencyMinutes) es obligatoria",
});

const time = (field: string) => joi.string().pattern(TIME_PATTERN).messages({
    "string.base": `${field} debe ser un texto`,
    "string.pattern.base": `${field} debe tener formato HH:mm de 24 horas`,
    "any.required": `${field} es obligatoria`,
});

const active = joi.boolean().messages({
    "boolean.base": "active debe ser true o false",
    "any.required": "active es obligatorio",
});

export type ReminderData = { userId: number; frequencyMinutes: number; startTime: string; endTime: string; active: boolean };

const createSchema = joi.object({
    userId: userId.required(),
    frequencyMinutes: frequencyMinutes.required(),
    startTime: time("La hora de inicio (startTime)").required(),
    endTime: time("La hora de fin (endTime)").required(),
    active: active.default(true),
}).unknown(false);

const updateSchema = joi.object({
    userId,
    frequencyMinutes,
    startTime: time("La hora de inicio (startTime)"),
    endTime: time("La hora de fin (endTime)"),
    active,
}).min(1).unknown(false).messages({ "object.min": "Debes enviar al menos un campo para actualizar" });

export const loadReminder = (data: unknown) => validate<ReminderData>(createSchema, data);
export const loadReminderUpdate = (data: unknown) => validate<Partial<ReminderData>>(updateSchema, data);
