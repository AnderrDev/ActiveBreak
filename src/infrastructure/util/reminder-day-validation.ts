import joi from "joi";
import { validate } from "./validate.js";
import { WEEKDAYS, Weekday } from "../../domain/ReminderDay.js";

export type ReminderDaysData = { reminderId: number; weekdays: Weekday[] };

const schema = joi.object({
    reminderId: joi.number().integer().positive().required().messages({
        "number.base": "reminderId debe ser un número",
        "number.integer": "reminderId debe ser un número entero",
        "number.positive": "reminderId debe ser mayor a 0",
        "any.required": "reminderId es obligatorio",
    }),
    weekdays: joi.array()
        .items(joi.string().valid(...WEEKDAYS).messages({ "any.only": `Los días válidos son: ${WEEKDAYS.join(", ")}` }))
        .min(1)
        .required()
        .messages({
            "array.base": "weekdays debe ser una lista",
            "array.min": "weekdays no puede estar vacío",
            "any.required": "weekdays es obligatorio",
        }),
}).unknown(false);

export const loadReminderDays = (data: unknown) => validate<ReminderDaysData>(schema, data);
