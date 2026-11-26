import joi from "joi";
import { DATE_PATTERN, existingDate, validate } from "./validate.js";

const date = (field: string) => joi.string().pattern(DATE_PATTERN).custom(existingDate).messages({
    "string.base": `${field} debe ser un texto`,
    "string.empty": `${field} no puede estar vacía`,
    "string.pattern.base": `${field} debe tener formato YYYY-MM-DD`,
    "date.nonexistent": `${field} no es una fecha válida`,
    "any.required": `${field} es obligatoria`,
});

const targetBreaks = joi.number().integer().min(1).max(50).messages({
    "number.base": "targetBreaks debe ser un número",
    "number.integer": "targetBreaks debe ser un número entero",
    "number.min": "targetBreaks debe ser al menos 1",
    "number.max": "targetBreaks debe ser como máximo 50",
    "any.required": "targetBreaks es obligatorio",
});

export type GoalData = { userId: number; targetBreaks: number; startDate: string; endDate: string };
export type GoalUpdateData = Partial<Omit<GoalData, "userId">>;

const createSchema = joi.object({
    userId: joi.number().integer().positive().required().messages({
        "number.base": "userId debe ser un número",
        "number.integer": "userId debe ser un número entero",
        "number.positive": "userId debe ser mayor a 0",
        "any.required": "userId es obligatorio",
    }),
    targetBreaks: targetBreaks.required(),
    startDate: date("La fecha de inicio (startDate)").required(),
    endDate: date("La fecha de fin (endDate)").required(),
}).unknown(false);

// The status is computed by the server and the owner of the goal cannot change
const updateSchema = joi.object({
    targetBreaks,
    startDate: date("La fecha de inicio (startDate)"),
    endDate: date("La fecha de fin (endDate)"),
}).min(1).unknown(false).messages({ "object.min": "Debes enviar al menos un campo para actualizar" });

export const loadGoal = (data: unknown) => validate<GoalData>(createSchema, data);
export const loadGoalUpdate = (data: unknown) => validate<GoalUpdateData>(updateSchema, data);
